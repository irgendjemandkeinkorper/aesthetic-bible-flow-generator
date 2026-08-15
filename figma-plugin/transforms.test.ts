import { describe, expect, it } from 'vitest';
import { effectFromSpec, fromHex, paintFromSpec, transitionFromSpec } from './transforms';

describe('Figma interchange transforms', () => {
  it('converts six- and eight-digit hex colors', () => {
    expect(fromHex('#336699')).toEqual({ color: { r: 0.2, g: 0.4, b: 0.6 }, opacity: 1 });
    expect(fromHex('#33669980').opacity).toBeCloseTo(128 / 255);
  });

  it('converts solid and gradient paints', () => {
    expect(paintFromSpec({ type: 'solid', color: '#ff000080', opacity: 0.5 })).toMatchObject({
      type: 'SOLID',
      opacity: (128 / 255) * 0.5,
    });
    expect(paintFromSpec({ type: 'linear-gradient', angle: 90, stops: [{ position: 0, color: '#000000' }] }))
      .toMatchObject({ type: 'GRADIENT_LINEAR', gradientStops: [{ position: 0, color: { a: 1 } }] });
  });

  it('converts blur and shadow effects with optional defaults', () => {
    expect(effectFromSpec({ type: 'layer-blur', radius: 8 })).toMatchObject({ type: 'LAYER_BLUR', visible: true });
    expect(effectFromSpec({ type: 'drop-shadow', color: '#ffffff', radius: 4, offset: { x: 1, y: 2 } }))
      .toMatchObject({ type: 'DROP_SHADOW', spread: 0, color: { a: 1 } });
  });

  it('converts instant and directional transitions', () => {
    expect(transitionFromSpec({ type: 'instant' })).toBeNull();
    expect(transitionFromSpec({ type: 'move-in', easing: 'ease-in-out', direction: 'left' }))
      .toMatchObject({ type: 'MOVE_IN', direction: 'LEFT', matchLayers: false, easing: { type: 'EASE_IN_AND_OUT' } });
  });
});
