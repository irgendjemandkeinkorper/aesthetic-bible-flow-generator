import { FigmaInterchangeSchema, type FigmaInterchangeDocument, type FigmaInterchangeNode } from '../src/services/figmaInterchange';

figma.showUI(__html__, { width: 420, height: 320, themeColors: true });

const nodeBySourceId = new Map<string, SceneNode>();
const componentBySourceId = new Map<string, ComponentNode>();
const paintStyleByName = new Map<string, PaintStyle>();
const effectStyleByName = new Map<string, EffectStyle>();
const deferredInstances: Array<{ spec: FigmaInterchangeNode; parent: ChildrenMixin }> = [];

function fromHex(hex: string): { color: RGB; opacity: number } {
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

function paintFromSpec(spec: any): Paint {
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

function effectFromSpec(spec: any): Effect {
  if (spec.type === 'layer-blur' || spec.type === 'background-blur') {
    return {
      type: spec.type === 'layer-blur' ? 'LAYER_BLUR' : 'BACKGROUND_BLUR',
      radius: spec.radius,
      visible: spec.visible ?? true,
    } as Effect;
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

async function createLocalStyles(document: FigmaInterchangeDocument): Promise<void> {
  for (const [name, token] of Object.entries(document.tokens)) {
    if (token.$type === 'color' && typeof token.$value === 'string') {
      const style = figma.createPaintStyle();
      style.name = name;
      style.description = token.$description ?? '';
      style.paints = [paintFromSpec({ type: 'solid', color: token.$value })];
      paintStyleByName.set(name, style);
    }
    if (token.$type === 'shadow') {
      const values = Array.isArray(token.$value) ? token.$value : [token.$value];
      const effects = values.flatMap((value: any) => {
        if (!value || typeof value !== 'object' || typeof value.color !== 'string') return [];
        return [effectFromSpec({
          type: value.inset ? 'inner-shadow' : 'drop-shadow',
          color: value.color,
          offset: { x: value.offsetX ?? 0, y: value.offsetY ?? 0 },
          radius: value.blur ?? 0,
          spread: value.spread ?? 0,
        })];
      });
      if (effects.length) {
        const style = figma.createEffectStyle();
        style.name = name;
        style.description = token.$description ?? '';
        style.effects = effects;
        effectStyleByName.set(name, style);
      }
    }
  }
}

function append(parent: ChildrenMixin, node: SceneNode): void {
  parent.appendChild(node);
}

async function applyCommon(node: SceneNode, spec: FigmaInterchangeNode): Promise<void> {
  node.name = spec.name;
  node.setPluginData('tangleSourceId', spec.id);
  if (typeof spec.x === 'number') node.x = spec.x;
  if (typeof spec.y === 'number') node.y = spec.y;
  if (typeof spec.opacity === 'number' && 'opacity' in node) node.opacity = spec.opacity;
  if (typeof spec.visible === 'boolean') node.visible = spec.visible;
  if (typeof spec.rotation === 'number' && 'rotation' in node) node.rotation = spec.rotation;
  if (typeof spec.description === 'string' && 'description' in node) (node as ComponentNode).description = spec.description;

  if ('resize' in node && typeof spec.width === 'number') {
    node.resize(spec.width, typeof spec.height === 'number' ? spec.height : Math.max(node.height, 1));
  }
  if ('fills' in node && Array.isArray(spec.fills)) {
    (node as GeometryMixin).fills = spec.fills.map(paintFromSpec);
    const styleName = spec.fills.length === 1 ? (spec.fills[0] as any).style : undefined;
    const style = styleName ? paintStyleByName.get(styleName) : undefined;
    if (style) (node as GeometryMixin).fillStyleId = style.id;
  }
  if ('strokes' in node && Array.isArray(spec.strokes)) {
    (node as GeometryMixin).strokes = spec.strokes.map(paintFromSpec);
  }
  if ('strokeWeight' in node && typeof spec.strokeWeight === 'number') (node as GeometryMixin).strokeWeight = spec.strokeWeight;
  if ('cornerRadius' in node && typeof spec.cornerRadius === 'number') (node as RectangleNode).cornerRadius = spec.cornerRadius;
  if ('effects' in node && Array.isArray(spec.effects)) {
    node.effects = spec.effects.map(effectFromSpec);
    const styleName = spec.effects.length === 1 ? (spec.effects[0] as any).style : undefined;
    const style = styleName ? effectStyleByName.get(styleName) : undefined;
    if (style) node.effectStyleId = style.id;
  }
}

async function createText(spec: FigmaInterchangeNode): Promise<TextNode> {
  const node = figma.createText();
  const requestedFont = { family: String(spec.fontFamily ?? 'Inter'), style: String(spec.fontStyle ?? 'Regular') };
  try {
    await figma.loadFontAsync(requestedFont);
    node.fontName = requestedFont;
  } catch {
    const fallback = { family: 'Inter', style: 'Regular' };
    await figma.loadFontAsync(fallback);
    node.fontName = fallback;
  }
  node.characters = String(spec.characters ?? '');
  if (typeof spec.fontSize === 'number') node.fontSize = spec.fontSize;
  if (typeof spec.textAlignHorizontal === 'string') node.textAlignHorizontal = spec.textAlignHorizontal.toUpperCase() as TextNode['textAlignHorizontal'];
  if (typeof spec.textAlignVertical === 'string') node.textAlignVertical = spec.textAlignVertical.toUpperCase() as TextNode['textAlignVertical'];
  if (typeof spec.lineHeight === 'number') node.lineHeight = { unit: 'PIXELS', value: spec.lineHeight };
  if (typeof spec.letterSpacing === 'number') node.letterSpacing = { unit: 'PIXELS', value: spec.letterSpacing };
  return node;
}

async function createNode(spec: FigmaInterchangeNode, parent: ChildrenMixin): Promise<void> {
  if (spec.type === 'instance') {
    deferredInstances.push({ spec, parent });
    return;
  }
  let node: SceneNode;
  switch (spec.type) {
    case 'frame': node = figma.createFrame(); break;
    case 'component': node = figma.createComponent(); break;
    case 'rectangle': node = figma.createRectangle(); break;
    case 'ellipse': node = figma.createEllipse(); break;
    case 'line': node = figma.createLine(); break;
    case 'text': node = await createText(spec); break;
    default: throw new Error(`Unsupported node type: ${String(spec.type)}`);
  }
  append(parent, node);
  await applyCommon(node, spec);
  nodeBySourceId.set(spec.id, node);
  if (node.type === 'COMPONENT') componentBySourceId.set(spec.id, node);

  if ('children' in node && Array.isArray(spec.children)) {
    for (const child of spec.children) await createNode(child, node);
  }
  if ((node.type === 'FRAME' || node.type === 'COMPONENT') && typeof spec.layoutMode === 'string' && spec.layoutMode !== 'none') {
    node.layoutMode = spec.layoutMode.toUpperCase() as 'HORIZONTAL' | 'VERTICAL';
    if (typeof spec.itemSpacing === 'number') node.itemSpacing = spec.itemSpacing;
    const padding = spec.padding as any;
    if (padding) {
      node.paddingTop = padding.top; node.paddingRight = padding.right;
      node.paddingBottom = padding.bottom; node.paddingLeft = padding.left;
    }
  }
  if (node.type === 'FRAME' && typeof spec.clipsContent === 'boolean') node.clipsContent = spec.clipsContent;
}

async function createDeferredInstances(): Promise<void> {
  for (const { spec, parent } of deferredInstances) {
    const component = componentBySourceId.get(String(spec.componentId));
    if (!component) throw new Error(`Component not created: ${String(spec.componentId)}`);
    const instance = component.createInstance();
    append(parent, instance);
    await applyCommon(instance, spec);
    nodeBySourceId.set(spec.id, instance);
    const overrides = spec.textOverrides as Record<string, string> | undefined;
    if (overrides) {
      for (const descendant of instance.findAll()) {
        const replacement = overrides[descendant.getPluginData('tangleSourceId')];
        if (descendant.type === 'TEXT' && replacement !== undefined && descendant.fontName !== figma.mixed) {
          await figma.loadFontAsync(descendant.fontName);
          descendant.characters = replacement;
        }
      }
    }
  }
}

function transitionFromSpec(spec: any): any {
  if (!spec || spec.type === 'instant') return null;
  const type = spec.type.replaceAll('-', '_').toUpperCase();
  const easingType = spec.easing === 'ease-in-out'
    ? 'EASE_IN_AND_OUT'
    : (spec.easing ?? 'ease-out').replaceAll('-', '_').toUpperCase();
  const transition: any = {
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

async function addPrototypeConnections(document: FigmaInterchangeDocument): Promise<void> {
  for (const connection of document.prototypeConnections) {
    const source = nodeBySourceId.get(connection.sourceNodeId);
    const target = nodeBySourceId.get(connection.targetNodeId);
    if (!source || !target || !('setReactionsAsync' in source)) continue;
    const action = connection.navigation === 'back'
      ? { type: 'BACK' }
      : {
          type: 'NODE', destinationId: target.id,
          navigation: connection.navigation.toUpperCase(),
          transition: transitionFromSpec(connection.transition),
          preserveScrollPosition: connection.preserveScrollPosition ?? false,
        };
    const triggerTypes = { click: 'ON_CLICK', hover: 'ON_HOVER', press: 'ON_PRESS', drag: 'ON_DRAG' } as const;
    await (source as any).setReactionsAsync([{ trigger: { type: triggerTypes[connection.trigger] }, action }]);
  }
}

async function importDocument(input: unknown): Promise<void> {
  const document = FigmaInterchangeSchema.parse(input);
  nodeBySourceId.clear(); componentBySourceId.clear(); paintStyleByName.clear(); effectStyleByName.clear(); deferredInstances.length = 0;
  await createLocalStyles(document);
  const importedPages: PageNode[] = [];
  for (const pageSpec of document.pages) {
    const page = figma.createPage();
    page.name = pageSpec.name;
    page.setPluginData('tangleSourceId', pageSpec.id);
    importedPages.push(page);
    await page.loadAsync();
    for (const child of pageSpec.children) await createNode(child, page);
  }
  await createDeferredInstances();
  await addPrototypeConnections(document);
  if (importedPages[0]) await figma.setCurrentPageAsync(importedPages[0]);
  const importedNodes = [...nodeBySourceId.values()].filter((node) => node.parent === importedPages[0]);
  if (importedNodes.length) {
    figma.currentPage.selection = importedNodes;
    figma.viewport.scrollAndZoomIntoView(importedNodes);
  }
}

figma.ui.onmessage = async (message: { type?: string; json?: string }) => {
  if (message.type !== 'import') return;
  try {
    const input = JSON.parse(message.json ?? '');
    await importDocument(input);
    figma.ui.postMessage({ type: 'result', ok: true, message: 'Import complete.' });
    figma.notify('Tangle design imported successfully');
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown import error';
    console.error('Tangle import failed', error);
    figma.ui.postMessage({ type: 'result', ok: false, message: messageText });
    figma.notify(`Import failed: ${messageText}`, { error: true });
  }
};
