export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Paint {
  type: 'SOLID' | 'GRADIENT_LINEAR';
  color?: RGB;
  opacity?: number;
  visible?: boolean;
  gradientTransform?: number[][];
  gradientStops?: Array<{ position: number; color: RGB & { a: number } }>;
}

export interface Effect {
  type: 'LAYER_BLUR' | 'BACKGROUND_BLUR' | 'DROP_SHADOW' | 'INNER_SHADOW';
  radius: number;
  visible: boolean;
  color?: RGB & { a: number };
  offset?: { x: number; y: number };
  spread?: number;
  blendMode?: 'NORMAL';
}

export interface Transition {
  type: string;
  duration: number;
  easing: { type: string };
  direction?: string;
  matchLayers?: boolean;
}

export function fromHex(hex: string): { color: RGB; opacity: number } {
  const value = hex.slice(1);
  const colorValue = value.slice(0, 6);
  return {
    color: {
      r: Number.parseInt(colorValue.slice(0, 2), 16) / 255,
      g: Number.parseInt(colorValue.slice(2, 4), 16) / 255,
      b: Number.parseInt(colorValue.slice(4, 6), 16) / 255,
    },
    opacity: value.length === 8 ? Number.parseInt(value.slice(6), 16) / 255 : 1,
  };
}

export function paintFromSpec(spec: any): any {
  if (spec.type === 'solid') {
    const { color, opacity } = fromHex(spec.color);
    return { type: 'SOLID', color, opacity: opacity * (spec.opacity ?? 1), visible: spec.visible ?? true };
  }
  const radians = ((spec.angle ?? 0) * Math.PI) / 180;
  const x = Math.cos(radians) / 2;
  const y = Math.sin(radians) / 2;
  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[x, y, 0.5 - x / 2 - y / 2], [-y, x, 0.5 + y / 2 - x / 2]],
    gradientStops: spec.stops.map((stop: any) => {
      const parsed = fromHex(stop.color);
      return { position: stop.position, color: { ...parsed.color, a: parsed.opacity } };
    }),
    opacity: spec.opacity ?? 1,
    visible: spec.visible ?? true,
  };
}

export function effectFromSpec(spec: any): any {
  if (spec.type === 'layer-blur' || spec.type === 'background-blur') {
    return {
      type: spec.type === 'layer-blur' ? 'LAYER_BLUR' : 'BACKGROUND_BLUR',
      radius: spec.radius,
      visible: spec.visible ?? true,
    };
  }
  const parsed = fromHex(spec.color);
  return {
    type: spec.type === 'drop-shadow' ? 'DROP_SHADOW' : 'INNER_SHADOW',
    color: { ...parsed.color, a: parsed.opacity },
    offset: spec.offset,
    radius: spec.radius,
    spread: spec.spread ?? 0,
    visible: spec.visible ?? true,
    blendMode: 'NORMAL',
  };
}

export function transitionFromSpec(spec: any): Transition | null {
  if (!spec || spec.type === 'instant') return null;
  const type = spec.type.replaceAll('-', '_').toUpperCase();
  const easingType = spec.easing === 'ease-in-out'
    ? 'EASE_IN_AND_OUT'
    : (spec.easing ?? 'ease-out').replaceAll('-', '_').toUpperCase();
  const transition: Transition = {
    type,
    duration: spec.duration ?? 0.3,
    easing: { type: easingType },
  };
  if (['MOVE_IN', 'MOVE_OUT', 'PUSH', 'SLIDE_IN', 'SLIDE_OUT'].includes(type)) {
    transition.direction = (spec.direction ?? 'right').toUpperCase();
    transition.matchLayers = false;
  }
  return transition;
}
