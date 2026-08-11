import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const DEFAULT_RATE_LIMIT = 100;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_MAX_RATE_LIMIT_CLIENTS = 10_000;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 8_192;
export const MAX_IMAGE_PIXELS = 25_000_000;

export interface ServerConfig {
  allowedOrigins: ReadonlySet<string>;
  apiRateLimit: number;
  apiRateLimitWindowMs: number;
  maxRateLimitClients: number;
}

function parsePositiveInteger(value: string | undefined, name: string, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return Number(value);
}

export function loadServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const configuredOrigins = env.CORS_ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const defaultOrigins = env.APP_URL
    ? [env.APP_URL]
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  return {
    allowedOrigins: new Set(configuredOrigins?.length ? configuredOrigins : defaultOrigins),
    apiRateLimit: parsePositiveInteger(env.API_RATE_LIMIT, 'API_RATE_LIMIT', DEFAULT_RATE_LIMIT),
    apiRateLimitWindowMs: parsePositiveInteger(
      env.API_RATE_LIMIT_WINDOW_MS,
      'API_RATE_LIMIT_WINDOW_MS',
      DEFAULT_RATE_LIMIT_WINDOW_MS,
    ),
    maxRateLimitClients: parsePositiveInteger(
      env.API_RATE_LIMIT_MAX_CLIENTS,
      'API_RATE_LIMIT_MAX_CLIENTS',
      DEFAULT_MAX_RATE_LIMIT_CLIENTS,
    ),
  };
}

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

export class BoundedRateLimiter {
  private readonly clients = new Map<string, RateLimitEntry>();

  constructor(
    private readonly requestLimit: number,
    private readonly windowMs: number,
    private readonly maxClients: number,
  ) {}

  get size(): number {
    return this.clients.size;
  }

  consume(clientId: string, now = Date.now()): { allowed: boolean; remaining: number; resetAt: number } {
    const existing = this.clients.get(clientId);
    if (existing && existing.expiresAt > now) {
      existing.count += 1;
      // Refresh insertion order so eviction approximates least-recently-used clients.
      this.clients.delete(clientId);
      this.clients.set(clientId, existing);
      return {
        allowed: existing.count <= this.requestLimit,
        remaining: Math.max(0, this.requestLimit - existing.count),
        resetAt: existing.expiresAt,
      };
    }

    if (existing) this.clients.delete(clientId);
    this.evictExpired(now);
    while (this.clients.size >= this.maxClients) {
      const oldestClient = this.clients.keys().next().value as string | undefined;
      if (oldestClient === undefined) break;
      this.clients.delete(oldestClient);
    }

    const entry = { count: 1, expiresAt: now + this.windowMs };
    this.clients.set(clientId, entry);
    return {
      allowed: true,
      remaining: Math.max(0, this.requestLimit - 1),
      resetAt: entry.expiresAt,
    };
  }

  private evictExpired(now: number): void {
    for (const [clientId, entry] of this.clients) {
      if (entry.expiresAt <= now) this.clients.delete(clientId);
    }
  }
}

export interface ValidatedImage {
  data: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
}

function detectImage(buffer: Buffer): Omit<ValidatedImage, 'data'> | null {
  if (
    buffer.length >= 24
    && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    && buffer.toString('ascii', 12, 16) === 'IHDR'
  ) {
    return { mimeType: 'image/png', width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 3 < buffer.length) {
      if (buffer[offset] !== 0xff) return null;
      while (buffer[offset] === 0xff) offset += 1;
      const marker = buffer[offset++];
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > buffer.length) return null;
      const segmentLength = buffer.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;
      const isStartOfFrame = (marker >= 0xc0 && marker <= 0xc3)
        || (marker >= 0xc5 && marker <= 0xc7)
        || (marker >= 0xc9 && marker <= 0xcb)
        || (marker >= 0xcd && marker <= 0xcf);
      if (isStartOfFrame) {
        if (segmentLength < 7) return null;
        return {
          mimeType: 'image/jpeg',
          width: buffer.readUInt16BE(offset + 5),
          height: buffer.readUInt16BE(offset + 3),
        };
      }
      offset += segmentLength;
    }
    return null;
  }

  if (
    buffer.length >= 30
    && buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return {
        mimeType: 'image/webp',
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (chunk === 'VP8L' && buffer[20] === 0x2f) {
      return {
        mimeType: 'image/webp',
        width: 1 + buffer[21] + ((buffer[22] & 0x3f) << 8),
        height: 1 + (buffer[22] >> 6) + (buffer[23] << 2) + ((buffer[24] & 0x0f) << 10),
      };
    }
    if (chunk === 'VP8 ' && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
      return {
        mimeType: 'image/webp',
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
  }

  return null;
}

export function validateImagePayload(imageBase64: unknown, suppliedMimeType?: unknown): ValidatedImage {
  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    throw new Error('imageBase64 parameter is required.');
  }

  let encoded = imageBase64;
  let dataUriMime: string | undefined;
  const dataUriMatch = /^data:([^;,]+);base64,(.*)$/s.exec(imageBase64);
  if (dataUriMatch) {
    [, dataUriMime, encoded] = dataUriMatch;
  } else if (imageBase64.startsWith('data:')) {
    throw new Error('Image data URL must contain base64-encoded data.');
  }

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
    throw new Error('Image data is not valid base64.');
  }
  const decodedSize = (encoded.length / 4) * 3 - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0);
  if (decodedSize > MAX_IMAGE_BYTES) {
    throw new Error(`Image exceeds the ${MAX_IMAGE_BYTES / 1024 / 1024} MB decoded-size limit.`);
  }

  const buffer = Buffer.from(encoded, 'base64');
  const detected = detectImage(buffer);
  if (!detected) throw new Error('Image bytes are not a supported PNG, JPEG, or WebP file.');

  const labels = [dataUriMime, typeof suppliedMimeType === 'string' ? suppliedMimeType : undefined].filter(Boolean);
  if (labels.some((label) => label !== detected.mimeType)) {
    throw new Error(`Image MIME type does not match its content (${detected.mimeType}).`);
  }
  if (detected.width < 1 || detected.height < 1) throw new Error('Image dimensions are invalid.');
  if (
    detected.width > MAX_IMAGE_DIMENSION
    || detected.height > MAX_IMAGE_DIMENSION
    || detected.width * detected.height > MAX_IMAGE_PIXELS
  ) {
    throw new Error(
      `Image dimensions exceed the ${MAX_IMAGE_DIMENSION}px edge or ${MAX_IMAGE_PIXELS.toLocaleString()} pixel limit.`,
    );
  }

  return { data: encoded, ...detected };
}

const serverConfig = loadServerConfig();
export const app = express();
const PORT = 3000;

app.disable('x-powered-by');
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.get('Origin');
  if (!origin) return next();
  if (!serverConfig.allowedOrigins.has(origin)) {
    return res.status(403).json({ error: 'Origin is not allowed.' });
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.vary('Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Max-Age', '600');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const rateLimiter = new BoundedRateLimiter(
  serverConfig.apiRateLimit,
  serverConfig.apiRateLimitWindowMs,
  serverConfig.maxRateLimitClients,
);
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const result = rateLimiter.consume(req.ip || req.socket.remoteAddress || 'unknown');
  res.setHeader('RateLimit-Limit', serverConfig.apiRateLimit);
  res.setHeader('RateLimit-Remaining', result.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt / 1000));
  if (!result.allowed) return res.status(429).json({ error: 'API rate limit exceeded.' });
  next();
});

// 12 MB accommodates the base64 expansion of an 8 MB decoded image plus JSON framing.
app.use(express.json({ limit: '12mb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Helper to get initialized GoogleGenAI instance safely
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// API Endpoint 1: Generate Complete Aesthetic Bible
// -------------------------------------------------------------
app.post('/api/generate-bible', async (req, res) => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment secrets.',
      });
    }

    const { genre, subgenre, philosophyAnchors, visualMood, fineTuning, title } = req.body;

    const prompt = `You are a world-class Lead Art Director, Game Designer, and Speculative Worldbuilder.
Generate a comprehensive, mathematically sound, and deeply cohesive "Aesthetic Bible" (Design System and Style Guidelines) for a game/visual project.

Input Parameters:
- Title Idea: ${title || 'Automated Aesthetic Flow'}
- Genre Category: ${genre}
- Subgenre: ${subgenre || 'Speculative World'}
- Philosophy Anchors: ${Array.isArray(philosophyAnchors) ? philosophyAnchors.join(', ') : philosophyAnchors}
- Visual Mood & Direction: ${visualMood}
- Fine-Tuning Parameters: Visual Density (${fineTuning?.density || 7}/10), Contrast (${fineTuning?.contrast || 8}/10), Era Blend (${fineTuning?.eraBlend || 'Modern Speculative'}), Saturation (${fineTuning?.saturation || 6}/10), Philosophical Depth (${fineTuning?.philosophicalDepth || 8}/10)

Produce a full Aesthetic Bible JSON adhering to the required schema. Ensure the color palette uses valid 6-character hex codes (e.g., #1A1A24), the typography choices are distinct and domain-appropriate, the manifesto contains a sharp "doList" and "dontList" (banned tropes / style anti-patterns), and the mood board contains 4-6 rich tiles with detailed image generation prompts.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite Game Art Director and Worldbuilding Architect. Generate detailed, highly evocative design system JSON structures that are deeply cohesive.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            tagline: { type: Type.STRING },
            genre: { type: Type.STRING },
            subgenre: { type: Type.STRING },
            philosophyAnchors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            manifesto: {
              type: Type.OBJECT,
              properties: {
                coreThesis: { type: Type.STRING },
                visualPhilosophy: { type: Type.STRING },
                emotionalCadence: { type: Type.STRING },
                keyVisualMetaphors: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                doList: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                dontList: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['coreThesis', 'visualPhilosophy', 'emotionalCadence', 'keyVisualMetaphors', 'doList', 'dontList'],
            },
            colorSystem: {
              type: Type.OBJECT,
              properties: {
                primary: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING },
                    usage: { type: Type.STRING },
                  },
                  required: ['name', 'hex', 'usage'],
                },
                secondary: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING },
                    usage: { type: Type.STRING },
                  },
                  required: ['name', 'hex', 'usage'],
                },
                accent: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING },
                    usage: { type: Type.STRING },
                  },
                  required: ['name', 'hex', 'usage'],
                },
                neutralDark: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING },
                    usage: { type: Type.STRING },
                  },
                  required: ['name', 'hex', 'usage'],
                },
                neutralLight: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING },
                    usage: { type: Type.STRING },
                  },
                  required: ['name', 'hex', 'usage'],
                },
                specularGlow: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING },
                    usage: { type: Type.STRING },
                  },
                  required: ['name', 'hex', 'usage'],
                },
                paletteNotes: { type: Type.STRING },
              },
              required: ['primary', 'secondary', 'accent', 'neutralDark', 'neutralLight', 'specularGlow', 'paletteNotes'],
            },
            typographySystem: {
              type: Type.OBJECT,
              properties: {
                displayFont: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, category: { type: Type.STRING }, usage: { type: Type.STRING } },
                  required: ['name', 'category', 'usage'],
                },
                headingFont: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, category: { type: Type.STRING }, usage: { type: Type.STRING } },
                  required: ['name', 'category', 'usage'],
                },
                bodyFont: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, category: { type: Type.STRING }, usage: { type: Type.STRING } },
                  required: ['name', 'category', 'usage'],
                },
                monoFont: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, category: { type: Type.STRING }, usage: { type: Type.STRING } },
                  required: ['name', 'category', 'usage'],
                },
                hierarchyRules: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['displayFont', 'headingFont', 'bodyFont', 'monoFont', 'hierarchyRules'],
            },
            shapeAndForm: {
              type: Type.OBJECT,
              properties: {
                dominantGeometry: { type: Type.STRING },
                silhouetteStyle: { type: Type.STRING },
                materialAndTextures: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                gritAndWeathering: { type: Type.STRING },
              },
              required: ['dominantGeometry', 'silhouetteStyle', 'materialAndTextures', 'gritAndWeathering'],
            },
            interfaceAndHUD: {
              type: Type.OBJECT,
              properties: {
                diegeticType: { type: Type.STRING },
                layoutDensity: { type: Type.STRING },
                tactileAudioTone: { type: Type.STRING },
                motionGuidelines: { type: Type.STRING },
              },
              required: ['diegeticType', 'layoutDensity', 'tactileAudioTone', 'motionGuidelines'],
            },
            moodBoard: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  promptSpec: { type: Type.STRING },
                  imageUrl: { type: Type.STRING },
                  philosophyTag: { type: Type.STRING },
                  materialTags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  lightingProfile: { type: Type.STRING },
                  focalPoint: { type: Type.STRING },
                },
                required: ['id', 'title', 'category', 'description', 'promptSpec', 'philosophyTag', 'materialTags', 'lightingProfile', 'focalPoint'],
              },
            },
          },
          required: ['title', 'tagline', 'genre', 'manifesto', 'colorSystem', 'typographySystem', 'shapeAndForm', 'interfaceAndHUD', 'moodBoard'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);

    // Attach defaults / timestamps if missing
    parsedData.id = parsedData.id || `bible-${Date.now()}`;
    parsedData.createdAt = new Date().toISOString();
    parsedData.updatedAt = new Date().toISOString();
    parsedData.fineTuning = fineTuning || {
      density: 7,
      contrast: 8,
      eraBlend: 'Speculative Convergence',
      saturation: 6,
      philosophicalDepth: 8,
    };

    // Assign fallback stock photography URLs to tiles if imageUrl is empty or placeholder
    const defaultImages = [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
    ];

    if (Array.isArray(parsedData.moodBoard)) {
      parsedData.moodBoard = parsedData.moodBoard.map((tile: any, idx: number) => {
        return {
          ...tile,
          id: tile.id || `tile-${idx}-${Date.now()}`,
          imageUrl: tile.imageUrl && tile.imageUrl.startsWith('http') ? tile.imageUrl : defaultImages[idx % defaultImages.length],
        };
      });
    }

    res.json(parsedData);
  } catch (err: any) {
    console.error('Error generating aesthetic bible:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate Aesthetic Bible' });
  }
});

// -------------------------------------------------------------
// API Endpoint 2: Thematic Cohesion Audit Engine
// -------------------------------------------------------------
app.post('/api/audit-cohesion', async (req, res) => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment secrets.',
      });
    }

    const { bible, candidateConcept, candidateType } = req.body;

    const prompt = `You are an exacting Art Director auditing a new candidate asset/concept for strict thematic cohesion against an established Aesthetic Bible.

Aesthetic Bible Context:
Title: ${bible.title}
Genre: ${bible.genre} (${bible.subgenre})
Core Thesis: ${bible.manifesto?.coreThesis}
Philosophy Anchors: ${Array.isArray(bible.philosophyAnchors) ? bible.philosophyAnchors.join(', ') : ''}
Color Palette: Primary=${bible.colorSystem?.primary?.name} (${bible.colorSystem?.primary?.hex}), Accent=${bible.colorSystem?.accent?.name} (${bible.colorSystem?.accent?.hex}), Dark Neutral=${bible.colorSystem?.neutralDark?.hex}
Banned Tropes / Don'ts: ${Array.isArray(bible.manifesto?.dontList) ? bible.manifesto?.dontList.join('; ') : ''}
Required Do's: ${Array.isArray(bible.manifesto?.doList) ? bible.manifesto?.doList.join('; ') : ''}

Candidate Concept under Audit:
Type: ${candidateType}
Description / Specs: "${candidateConcept}"

Audit Instructions:
1. Calculate a Cohesion Score (0 to 100%).
2. Give a 1-sentence Verdict (e.g. "APPROVED: Seamless alignment with core alchemy thesis" or "REJECTED: Severe visual drift towards generic sci-fi").
3. Summarize the audit rationale.
4. List 2-3 specific Alignment Points (what works well).
5. List 2-3 specific Drift Warnings (what violates color, shape language, or philosophy).
6. Provide 2-3 concrete Actionable Fixes to restore 100% cohesion.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            verdict: { type: Type.STRING },
            summary: { type: Type.STRING },
            alignmentPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            driftWarnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedFixes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['score', 'verdict', 'summary', 'alignmentPoints', 'driftWarnings', 'suggestedFixes'],
        },
      },
    });

    const auditData = JSON.parse(response.text || '{}');
    res.json(auditData);
  } catch (err: any) {
    console.error('Error auditing cohesion:', err);
    res.status(500).json({ error: err?.message || 'Failed to perform cohesion audit' });
  }
});

// -------------------------------------------------------------
// API Endpoint 3: Generate Image / Mood Tile AI Visual
// -------------------------------------------------------------
app.post('/api/generate-mood-image', async (req, res) => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment secrets.',
      });
    }

    const { promptSpec, aspectRatio } = req.body;

    // Call Gemini Image generation model
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            text: `High quality art concept visualization: ${promptSpec}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || '1:1',
        },
      },
    });

    let imageUrl = '';
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Str = part.inlineData.data;
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${base64Str}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      // Fallback placeholder image with seed
      const seed = Math.floor(Math.random() * 100000);
      imageUrl = `https://picsum.photos/seed/${seed}/800/800`;
    }

    res.json({ imageUrl });
  } catch (err: any) {
    console.error('Error generating image:', err);
    // Graceful fallback image if image generation key model fails
    const seed = Math.floor(Math.random() * 100000);
    res.json({
      imageUrl: `https://picsum.photos/seed/${seed}/800/800`,
      warning: 'Fell back to curated stock visual due to generation parameters.',
    });
  }
});

// -------------------------------------------------------------
// API Endpoint 4: Decode Aesthetics from Uploaded Image
// -------------------------------------------------------------
app.post('/api/decode-image-aesthetic', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    let image: ValidatedImage;
    try {
      image = validateImagePayload(imageBase64, mimeType);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid image.' });
    }
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment secrets.',
      });
    }

    const prompt = `Deconstruct and decode the complete visual DNA & aesthetic guidelines of this image for game art direction and speculative worldbuilding.
Analyze color, composition, lighting, geometry, material textures, and thematic mood.

Produce a JSON response matching the schema:
1. title: An evocative, short title for this visual reference.
2. genreMatch: Recommended speculative genre (e.g. Grimdark Fantasy, Cyberpunk / Synth-Noir, Solarpunk, Cassette Futurism, etc.).
3. subgenreMatch: Specific subgenre or aesthetic niche.
4. category: Recommended category ('Environment', 'Character', 'Item/Prop', 'Architecture', 'UI/HUD', 'Lighting & FX').
5. summaryDescription: Clear 2-3 sentence visual breakdown of the style, lighting, and composition.
6. promptSpec: High-precision AI image generation prompt (Midjourney/Gemini style) to recreate this exact aesthetic.
7. philosophyTag: A 2-4 word philosophical anchor matching this visual tone.
8. dominantMaterials: Array of 3-5 surface materials/textures observed (e.g. "Brushed Obsidian", "Bioluminescent Glass").
9. lightingProfile: Precise description of light sources, specular highlights, and ambient shadow casts.
10. extractedPalette: Array of 5 color swatches extracted from key regions, each with 'name', 6-char 'hex' code (e.g. #1E293B), and 'usage'.
11. doAndDontGuidelines: Object with 'doList' (3 rules to follow) and 'dontList' (3 visual anti-patterns to avoid).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            genreMatch: { type: Type.STRING },
            subgenreMatch: { type: Type.STRING },
            category: { type: Type.STRING },
            summaryDescription: { type: Type.STRING },
            promptSpec: { type: Type.STRING },
            philosophyTag: { type: Type.STRING },
            dominantMaterials: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            lightingProfile: { type: Type.STRING },
            extractedPalette: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  hex: { type: Type.STRING },
                  usage: { type: Type.STRING },
                },
                required: ['name', 'hex', 'usage'],
              },
            },
            doAndDontGuidelines: {
              type: Type.OBJECT,
              properties: {
                doList: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                dontList: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['doList', 'dontList'],
            },
          },
          required: [
            'title',
            'genreMatch',
            'subgenreMatch',
            'category',
            'summaryDescription',
            'promptSpec',
            'philosophyTag',
            'dominantMaterials',
            'lightingProfile',
            'extractedPalette',
            'doAndDontGuidelines',
          ],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (err: any) {
    console.error('Error decoding image aesthetic:', err);
    res.status(500).json({ error: err?.message || 'Failed to decode image aesthetics.' });
  }
});

// -------------------------------------------------------------
// API Endpoint 5: Audit Image Directly Against Bible
// -------------------------------------------------------------
app.post('/api/audit-image-cohesion', async (req, res) => {
  try {
    const { bible, imageBase64, mimeType, candidateType } = req.body;
    let image: ValidatedImage;
    try {
      image = validateImagePayload(imageBase64, mimeType);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid image.' });
    }
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment secrets.',
      });
    }

    const prompt = `You are an expert Game Art Director performing a visual style cohesion audit on an uploaded artwork image against an established Aesthetic Bible.

Aesthetic Bible Parameters:
Title: ${bible.title}
Genre: ${bible.genre} (${bible.subgenre})
Core Thesis: ${bible.manifesto?.coreThesis}
Philosophy Anchors: ${Array.isArray(bible.philosophyAnchors) ? bible.philosophyAnchors.join(', ') : ''}
Color Palette: Primary=${bible.colorSystem?.primary?.name} (${bible.colorSystem?.primary?.hex}), Accent=${bible.colorSystem?.accent?.name} (${bible.colorSystem?.accent?.hex}), Dark Neutral=${bible.colorSystem?.neutralDark?.hex}
Banned Anti-Patterns: ${Array.isArray(bible.manifesto?.dontList) ? bible.manifesto?.dontList.join('; ') : ''}

Candidate Asset Type: ${candidateType || 'Visual Art Asset'}

Visual Audit Instructions:
Inspect the provided image's colors, lighting, geometry, material textures, and mood against the target Aesthetic Bible.
1. Score the image's style cohesion (0 to 100%).
2. Give a 1-sentence Verdict (e.g., "APPROVED: Color palette and lighting perfectly mirror the Bible's core thesis").
3. Summarize the visual audit rationale.
4. List 2-3 specific Alignment Points observed directly in the image.
5. List 2-3 specific Drift Warnings (e.g. wrong color cast, incorrect shape geometry, incompatible surface gloss).
6. Provide 2-3 actionable fixes to bring this image asset into 100% cohesion.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            verdict: { type: Type.STRING },
            summary: { type: Type.STRING },
            alignmentPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            driftWarnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedFixes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['score', 'verdict', 'summary', 'alignmentPoints', 'driftWarnings', 'suggestedFixes'],
        },
      },
    });

    const auditData = JSON.parse(response.text || '{}');
    res.json(auditData);
  } catch (err: any) {
    console.error('Error auditing image cohesion:', err);
    res.status(500).json({ error: err?.message || 'Failed to audit image cohesion.' });
  }
});

// -------------------------------------------------------------
// Express Server Start & Vite Middleware Setup
// -------------------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  void start();
}
