import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment secrets.',
      });
    }

    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 parameter is required.' });
    }

    // Clean base64 data string
    let cleanData = imageBase64;
    let detectedMime = mimeType || 'image/jpeg';

    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      detectedMime = parts[0].replace('data:', '');
      cleanData = parts[1];
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
            mimeType: detectedMime,
            data: cleanData,
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
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment secrets.',
      });
    }

    const { bible, imageBase64, mimeType, candidateType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 parameter is required.' });
    }

    let cleanData = imageBase64;
    let detectedMime = mimeType || 'image/jpeg';

    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      detectedMime = parts[0].replace('data:', '');
      cleanData = parts[1];
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
            mimeType: detectedMime,
            data: cleanData,
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

start();
