import type { AestheticBible } from '../types';
import {
  FIGMA_INTERCHANGE_FORMAT,
  FIGMA_INTERCHANGE_VERSION,
  FigmaInterchangeSchema,
  type FigmaInterchangeDocument,
} from './figmaInterchange';

const swatchRoles = ['primary', 'secondary', 'accent', 'neutralDark', 'neutralLight', 'specularGlow'] as const;

export interface FigmaExportOptions {
  generatedAt?: string;
}

export function serializeAestheticBibleToFigma(
  bible: AestheticBible,
  options: FigmaExportOptions = {},
): FigmaInterchangeDocument {
  const tokens: FigmaInterchangeDocument['tokens'] = {};
  for (const role of swatchRoles) {
    const swatch = bible.colorSystem[role];
    tokens[`color/${role}`] = {
      $type: 'color',
      $value: swatch.hex,
      $description: `${swatch.name}: ${swatch.usage}`,
    };
  }
  tokens['font/display'] = { $type: 'fontFamily', $value: bible.typographySystem.displayFont.name };
  tokens['font/heading'] = { $type: 'fontFamily', $value: bible.typographySystem.headingFont.name };
  tokens['font/body'] = { $type: 'fontFamily', $value: bible.typographySystem.bodyFont.name };
  tokens['spacing/base'] = { $type: 'dimension', $value: { value: 8, unit: 'px' } };
  tokens['effect/card'] = {
    $type: 'shadow',
    $value: { color: '#00000066', offsetX: 0, offsetY: 12, blur: 32, spread: 0 },
  };

  const paletteChildren = swatchRoles.flatMap((role, index) => {
    const swatch = bible.colorSystem[role];
    return [
      {
        id: `palette-${role}-swatch`, name: `${swatch.name} swatch`, type: 'rectangle' as const,
        x: index * 126, y: 0, width: 110, height: 76, cornerRadius: 10,
        fills: [{ type: 'solid' as const, color: swatch.hex, style: `color/${role}` }],
      },
      {
        id: `palette-${role}-label`, name: `${swatch.name} label`, type: 'text' as const,
        x: index * 126, y: 84, width: 110, height: 36,
        characters: `${swatch.name}\n${swatch.hex}`, fontSize: 11,
        fills: [{ type: 'solid' as const, color: bible.colorSystem.neutralLight.hex, style: 'color/neutralLight' }],
      },
    ];
  });

  const document = {
    format: FIGMA_INTERCHANGE_FORMAT,
    version: FIGMA_INTERCHANGE_VERSION,
    name: bible.title,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    generator: { name: 'Aesthetic Bible Flow Generator', version: '1.0.0' },
    tokens,
    pages: [{
      id: 'page-aesthetic-bible',
      name: bible.title,
      children: [
        {
          id: 'frame-overview', name: 'Overview', type: 'frame' as const,
          x: 0, y: 0, width: 960, height: 720, cornerRadius: 20, clipsContent: true,
          fills: [{ type: 'solid' as const, color: bible.colorSystem.neutralDark.hex, style: 'color/neutralDark' }],
          effects: [{ type: 'drop-shadow' as const, color: '#00000066', offset: { x: 0, y: 12 }, radius: 32, style: 'effect/card' }],
          children: [
            {
              id: 'overview-title', name: 'Title', type: 'text' as const, x: 64, y: 56, width: 832, height: 80,
              characters: bible.title, fontFamily: bible.typographySystem.displayFont.name, fontSize: 56,
              fills: [{ type: 'solid' as const, color: bible.colorSystem.neutralLight.hex, style: 'color/neutralLight' }],
            },
            {
              id: 'overview-tagline', name: 'Tagline', type: 'text' as const, x: 64, y: 146, width: 760, height: 64,
              characters: bible.tagline, fontFamily: bible.typographySystem.bodyFont.name, fontSize: 20,
              fills: [{ type: 'solid' as const, color: bible.colorSystem.secondary.hex, style: 'color/secondary' }],
            },
            {
              id: 'overview-palette', name: 'Palette', type: 'frame' as const, x: 64, y: 260, width: 760, height: 130,
              children: paletteChildren,
            },
            {
              id: 'overview-manifesto', name: 'Core thesis', type: 'text' as const, x: 64, y: 440, width: 720, height: 110,
              characters: bible.manifesto.coreThesis, fontFamily: bible.typographySystem.bodyFont.name, fontSize: 22,
              fills: [{ type: 'solid' as const, color: bible.colorSystem.neutralLight.hex, style: 'color/neutralLight' }],
            },
            {
              id: 'overview-details-button', name: 'View principles', type: 'instance' as const,
              componentId: 'component-primary-button', x: 64, y: 590, width: 220, height: 52,
            },
          ],
        },
        {
          id: 'frame-principles', name: 'Principles', type: 'frame' as const,
          x: 1040, y: 0, width: 960, height: 720, cornerRadius: 20,
          fills: [{ type: 'solid' as const, color: bible.colorSystem.neutralDark.hex, style: 'color/neutralDark' }],
          children: [
            {
              id: 'principles-heading', name: 'Principles heading', type: 'text' as const, x: 64, y: 56, width: 820, height: 64,
              characters: 'Design principles', fontFamily: bible.typographySystem.headingFont.name, fontSize: 42,
              fills: [{ type: 'solid' as const, color: bible.colorSystem.accent.hex, style: 'color/accent' }],
            },
            {
              id: 'principles-body', name: 'Do and do not', type: 'text' as const, x: 64, y: 150, width: 820, height: 460,
              characters: `DO\n${bible.manifesto.doList.map((item) => `• ${item}`).join('\n')}\n\nDO NOT\n${bible.manifesto.dontList.map((item) => `• ${item}`).join('\n')}`,
              fontFamily: bible.typographySystem.bodyFont.name, fontSize: 18, lineHeight: 28,
              fills: [{ type: 'solid' as const, color: bible.colorSystem.neutralLight.hex, style: 'color/neutralLight' }],
            },
          ],
        },
        {
          id: 'frame-components', name: 'Local components', type: 'frame' as const,
          x: 0, y: 800, width: 960, height: 240,
          fills: [{ type: 'solid' as const, color: '#FFFFFF00' }],
          children: [{
            id: 'component-primary-button', name: 'Button/Primary', type: 'component' as const,
            x: 64, y: 64, width: 220, height: 52, cornerRadius: 10,
            fills: [{ type: 'solid' as const, color: bible.colorSystem.primary.hex, style: 'color/primary' }],
            children: [{
              id: 'component-primary-button-label', name: 'Label', type: 'text' as const,
              x: 20, y: 15, width: 180, height: 22, characters: 'View principles',
              fontFamily: bible.typographySystem.headingFont.name, fontSize: 16, textAlignHorizontal: 'center' as const,
              fills: [{ type: 'solid' as const, color: bible.colorSystem.neutralLight.hex, style: 'color/neutralLight' }],
            }],
          }],
        },
      ],
    }],
    prototypeConnections: [{
      sourceNodeId: 'overview-details-button', targetNodeId: 'frame-principles',
      trigger: 'click' as const, navigation: 'navigate' as const,
      transition: { type: 'smart-animate' as const, duration: 0.3, easing: 'ease-out' as const },
    }],
  };

  return FigmaInterchangeSchema.parse(document);
}

export function stringifyFigmaInterchange(bible: AestheticBible, options?: FigmaExportOptions): string {
  return JSON.stringify(serializeAestheticBibleToFigma(bible, options), null, 2);
}
