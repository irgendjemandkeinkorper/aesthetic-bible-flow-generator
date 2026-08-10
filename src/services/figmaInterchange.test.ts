import { describe, expect, it } from 'vitest';
import { FIGMA_INTERCHANGE_FORMAT, FIGMA_INTERCHANGE_VERSION, FigmaInterchangeSchema } from './figmaInterchange';

const validDocument = () => ({
  format: FIGMA_INTERCHANGE_FORMAT,
  version: FIGMA_INTERCHANGE_VERSION,
  name: 'Test design',
  generatedAt: '2026-08-10T00:00:00.000Z',
  generator: { name: 'test', version: '1' },
  tokens: { primary: { $type: 'color', $value: '#112233' } },
  pages: [{
    id: 'page', name: 'Page', children: [
      { id: 'component', name: 'Button', type: 'component', children: [] },
      { id: 'instance', name: 'Button instance', type: 'instance', componentId: 'component' },
      { id: 'destination', name: 'Destination', type: 'frame', children: [] },
    ],
  }],
  prototypeConnections: [{ sourceNodeId: 'instance', targetNodeId: 'destination', trigger: 'click', navigation: 'navigate' }],
});

describe('FigmaInterchangeSchema', () => {
  it('accepts the documented version and supported node references', () => {
    expect(FigmaInterchangeSchema.parse(validDocument()).version).toBe('1.0.0');
  });

  it('rejects unknown versions', () => {
    expect(() => FigmaInterchangeSchema.parse({ ...validDocument(), version: '2.0.0' })).toThrow();
  });

  it('rejects invalid DTCG token values', () => {
    const document = validDocument();
    document.tokens.primary.$value = 'blue';
    expect(() => FigmaInterchangeSchema.parse(document)).toThrow(/Color tokens/);
  });

  it('rejects duplicate ids and dangling component/prototype references', () => {
    const document = validDocument();
    document.pages[0].children.push({ id: 'instance', name: 'Duplicate', type: 'instance', componentId: 'missing' } as never);
    document.prototypeConnections[0].targetNodeId = 'missing';
    const result = FigmaInterchangeSchema.safeParse(document);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(expect.arrayContaining([
      'Duplicate interchange id: instance',
      'Instance instance references missing component missing',
      'Prototype target node does not exist',
    ]));
  });
});
