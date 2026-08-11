import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  app,
  BoundedRateLimiter,
  loadServerConfig,
  MAX_IMAGE_DIMENSION,
  validateImagePayload,
} from './server';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not bind to a TCP port.');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

const pngHeader = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buffer);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
};

describe('health endpoint', () => {
  it('reports that the local Express server is available', async () => {
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
});

describe('CORS middleware', () => {
  it('sends CORS headers for allowed origins', async () => {
    const response = await fetch(`${baseUrl}/api/not-found`, {
      headers: { Origin: 'http://localhost:3000' },
    });

    expect(response.status).toBe(404);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    expect(response.headers.get('vary')).toContain('Origin');
  });

  it('handles allowed preflight requests before routing', async () => {
    const response = await fetch(`${baseUrl}/api/decode-image-aesthetic`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    expect(response.headers.get('access-control-allow-headers')).toContain('Content-Type');
  });

  it('rejects denied origins without emitting an allow-origin header', async () => {
    const response = await fetch(`${baseUrl}/api/not-found`, {
      headers: { Origin: 'https://attacker.example' },
    });

    expect(response.status).toBe(403);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('image validation', () => {
  it('rejects a spoofed image whose label does not match its magic bytes', async () => {
    const response = await fetch(`${baseUrl}/api/decode-image-aesthetic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: `data:image/png;base64,${Buffer.from('not an image').toString('base64')}`,
        mimeType: 'image/png',
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('Image bytes'),
    });
  });

  it('rejects image dimensions above the decoded resource cap', async () => {
    const encoded = pngHeader(MAX_IMAGE_DIMENSION + 1, 1).toString('base64');
    const response = await fetch(`${baseUrl}/api/audit-image-cohesion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: encoded, mimeType: 'image/png', bible: {} }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('dimensions exceed'),
    });
  });

  it('rejects MIME labels that conflict with valid image signatures', () => {
    const encoded = pngHeader(16, 16).toString('base64');
    expect(() => validateImagePayload(encoded, 'image/jpeg')).toThrow(/does not match/);
  });
});

describe('bounded rate limiter', () => {
  it('evicts the least-recently-used client at capacity', () => {
    const limiter = new BoundedRateLimiter(1, 60_000, 2);
    expect(limiter.consume('a', 1).allowed).toBe(true);
    expect(limiter.consume('b', 2).allowed).toBe(true);
    expect(limiter.consume('c', 3).allowed).toBe(true);

    expect(limiter.size).toBe(2);
    expect(limiter.consume('a', 4).allowed).toBe(true);
    expect(limiter.size).toBe(2);
  });

  it('expires stale client counters', () => {
    const limiter = new BoundedRateLimiter(1, 10, 2);
    expect(limiter.consume('a', 0).allowed).toBe(true);
    expect(limiter.consume('a', 1).allowed).toBe(false);
    expect(limiter.consume('a', 10).allowed).toBe(true);
  });
});

describe('server configuration', () => {
  it.each(['0', '-1', '1.5', 'many'])('rejects invalid API_RATE_LIMIT=%s', (value) => {
    expect(() => loadServerConfig({ API_RATE_LIMIT: value })).toThrow(/API_RATE_LIMIT must be a positive integer/);
  });

  it('accepts a positive API rate limit', () => {
    expect(loadServerConfig({ API_RATE_LIMIT: '25' }).apiRateLimit).toBe(25);
  });
});
