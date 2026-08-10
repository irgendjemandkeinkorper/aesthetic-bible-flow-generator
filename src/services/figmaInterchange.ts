import { z } from 'zod';

export const FIGMA_INTERCHANGE_FORMAT = 'tangle-figma-interchange' as const;
export const FIGMA_INTERCHANGE_VERSION = '1.0.0' as const;

const finiteNumber = z.number().finite();
const positiveNumber = finiteNumber.positive();
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/, 'Expected a six or eight digit hex color');

export const SolidPaintSchema = z.object({
  type: z.literal('solid'),
  color: colorSchema,
  opacity: z.number().min(0).max(1).optional(),
  visible: z.boolean().optional(),
  style: z.string().min(1).optional(),
}).strict();

export const GradientPaintSchema = z.object({
  type: z.literal('linear-gradient'),
  angle: finiteNumber.optional(),
  stops: z.array(z.object({
    position: z.number().min(0).max(1),
    color: colorSchema,
  }).strict()).min(2),
  opacity: z.number().min(0).max(1).optional(),
  visible: z.boolean().optional(),
  style: z.string().min(1).optional(),
}).strict();

export const PaintSchema = z.discriminatedUnion('type', [SolidPaintSchema, GradientPaintSchema]);

export const EffectSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.enum(['drop-shadow', 'inner-shadow']),
    color: colorSchema,
    offset: z.object({ x: finiteNumber, y: finiteNumber }).strict(),
    radius: z.number().min(0),
    spread: z.number().min(0).optional(),
    visible: z.boolean().optional(),
    blendMode: z.string().optional(),
    style: z.string().min(1).optional(),
  }).strict(),
  z.object({
    type: z.enum(['layer-blur', 'background-blur']),
    radius: z.number().min(0),
    visible: z.boolean().optional(),
    style: z.string().min(1).optional(),
  }).strict(),
]);

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() => z.union([
  z.string(), z.number(), z.boolean(), z.null(),
  z.array(jsonValueSchema),
  z.record(z.string(), jsonValueSchema),
]));

export const DtcgTokenSchema = z.object({
  $type: z.enum([
    'color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier',
    'number', 'strokeStyle', 'border', 'transition', 'shadow', 'gradient', 'typography',
  ]),
  $value: jsonValueSchema,
  $description: z.string().optional(),
  $extensions: z.record(z.string(), jsonValueSchema).optional(),
}).strict().superRefine((token, context) => {
  if (token.$type === 'color' && (typeof token.$value !== 'string' || !colorSchema.safeParse(token.$value).success)) {
    context.addIssue({ code: 'custom', path: ['$value'], message: 'Color tokens must use #RRGGBB or #RRGGBBAA' });
  }
  if (token.$type === 'number' && typeof token.$value !== 'number') {
    context.addIssue({ code: 'custom', path: ['$value'], message: 'Number tokens must contain a number' });
  }
});

const nodeBase = {
  id: z.string().min(1),
  name: z.string().min(1),
  x: finiteNumber.optional(),
  y: finiteNumber.optional(),
  width: positiveNumber.optional(),
  height: positiveNumber.optional(),
  opacity: z.number().min(0).max(1).optional(),
  visible: z.boolean().optional(),
  rotation: finiteNumber.optional(),
  fills: z.array(PaintSchema).optional(),
  strokes: z.array(PaintSchema).optional(),
  strokeWeight: z.number().min(0).optional(),
  cornerRadius: z.number().min(0).optional(),
  effects: z.array(EffectSchema).optional(),
  description: z.string().optional(),
};

const containerFields = {
  layoutMode: z.enum(['none', 'horizontal', 'vertical']).optional(),
  itemSpacing: finiteNumber.optional(),
  padding: z.object({ top: finiteNumber, right: finiteNumber, bottom: finiteNumber, left: finiteNumber }).strict().optional(),
  clipsContent: z.boolean().optional(),
};

const leafNodeSchema = z.discriminatedUnion('type', [
  z.object({ ...nodeBase, type: z.literal('rectangle') }).strict(),
  z.object({ ...nodeBase, type: z.literal('ellipse') }).strict(),
  z.object({ ...nodeBase, type: z.literal('line') }).strict(),
  z.object({
    ...nodeBase,
    type: z.literal('text'),
    characters: z.string(),
    fontFamily: z.string().min(1).optional(),
    fontStyle: z.string().min(1).optional(),
    fontSize: positiveNumber.optional(),
    textAlignHorizontal: z.enum(['left', 'center', 'right', 'justified']).optional(),
    textAlignVertical: z.enum(['top', 'center', 'bottom']).optional(),
    lineHeight: positiveNumber.optional(),
    letterSpacing: finiteNumber.optional(),
  }).strict(),
  z.object({
    ...nodeBase,
    type: z.literal('instance'),
    componentId: z.string().min(1),
    textOverrides: z.record(z.string(), z.string()).optional(),
  }).strict(),
]);

export interface FigmaInterchangeNode {
  id: string;
  name: string;
  type: 'frame' | 'rectangle' | 'ellipse' | 'line' | 'text' | 'component' | 'instance';
  componentId?: string;
  children?: FigmaInterchangeNode[];
  [key: string]: unknown;
}

export const FigmaNodeSchema: z.ZodType<FigmaInterchangeNode> = z.lazy(() => z.union([
  leafNodeSchema,
  z.object({
    ...nodeBase,
    ...containerFields,
    type: z.literal('frame'),
    children: z.array(FigmaNodeSchema).default([]),
  }).strict(),
  z.object({
    ...nodeBase,
    ...containerFields,
    type: z.literal('component'),
    children: z.array(FigmaNodeSchema).default([]),
  }).strict(),
])) as z.ZodType<FigmaInterchangeNode>;

export const PrototypeConnectionSchema = z.object({
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  trigger: z.enum(['click', 'hover', 'press', 'drag']).default('click'),
  navigation: z.enum(['navigate', 'swap', 'overlay', 'back']).default('navigate'),
  transition: z.object({
    type: z.enum(['instant', 'dissolve', 'smart-animate', 'move-in', 'move-out', 'push', 'slide-in', 'slide-out']),
    duration: z.number().min(0).max(10).optional(),
    easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']).optional(),
    direction: z.enum(['left', 'right', 'top', 'bottom']).optional(),
  }).strict().optional(),
  preserveScrollPosition: z.boolean().optional(),
}).strict();

export const FigmaInterchangeSchema = z.object({
  format: z.literal(FIGMA_INTERCHANGE_FORMAT),
  version: z.literal(FIGMA_INTERCHANGE_VERSION),
  name: z.string().min(1),
  generatedAt: z.string().datetime(),
  generator: z.object({ name: z.string().min(1), version: z.string().min(1) }).strict(),
  tokens: z.record(z.string(), DtcgTokenSchema).default({}),
  pages: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    children: z.array(FigmaNodeSchema),
  }).strict()).min(1),
  prototypeConnections: z.array(PrototypeConnectionSchema).default([]),
}).strict().superRefine((document, context) => {
  const nodes = new Map<string, FigmaInterchangeNode>();
  const pages = new Set<string>();
  const visit = (node: FigmaInterchangeNode) => {
    if (nodes.has(node.id) || pages.has(node.id)) {
      context.addIssue({ code: 'custom', path: ['pages'], message: `Duplicate interchange id: ${node.id}` });
    }
    nodes.set(node.id, node);
    node.children?.forEach(visit);
  };
  document.pages.forEach((page) => {
    if (pages.has(page.id) || nodes.has(page.id)) {
      context.addIssue({ code: 'custom', path: ['pages'], message: `Duplicate interchange id: ${page.id}` });
    }
    pages.add(page.id);
    page.children.forEach(visit);
  });
  nodes.forEach((node) => {
    const componentId = node.componentId;
    if (node.type === 'instance' && (typeof componentId !== 'string' || !nodes.has(componentId) || nodes.get(componentId)?.type !== 'component')) {
      context.addIssue({ code: 'custom', path: ['pages'], message: `Instance ${node.id} references missing component ${String(componentId)}` });
    }
  });
  document.prototypeConnections.forEach((connection, index) => {
    if (!nodes.has(connection.sourceNodeId)) {
      context.addIssue({ code: 'custom', path: ['prototypeConnections', index, 'sourceNodeId'], message: 'Prototype source node does not exist' });
    }
    if (!nodes.has(connection.targetNodeId)) {
      context.addIssue({ code: 'custom', path: ['prototypeConnections', index, 'targetNodeId'], message: 'Prototype target node does not exist' });
    }
  });
});

export type FigmaInterchangeDocument = z.infer<typeof FigmaInterchangeSchema>;

export function parseFigmaInterchange(input: unknown): FigmaInterchangeDocument {
  return FigmaInterchangeSchema.parse(input);
}
