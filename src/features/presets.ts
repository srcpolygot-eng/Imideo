/** One-click style presets for product mockups */

import type { LogoTransform } from '../types';

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  emoji: string;
  transform: Partial<LogoTransform>;
  suggestedColor?: string;
  tags: string[];
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'clean-center',
    name: 'Clean Center',
    description: 'Balanced, centered print for everyday merch',
    emoji: '\u25ce',
    transform: { x: 0, y: 0, scale: 0.55, rotation: 0, opacity: 100, blendMode: 'multiply' },
    tags: ['default', 'print'],
  },
  {
    id: 'bold-hero',
    name: 'Bold Hero',
    description: 'Large logo, high impact for streetwear',
    emoji: '\u26a1',
    transform: { x: 0, y: -4, scale: 0.78, rotation: 0, opacity: 100, blendMode: 'normal' },
    tags: ['streetwear', 'bold'],
  },
  {
    id: 'subtle-watermark',
    name: 'Subtle Mark',
    description: 'Soft watermark-style placement',
    emoji: '\u25c7',
    transform: { x: 8, y: 12, scale: 0.32, rotation: -6, opacity: 55, blendMode: 'screen' },
    tags: ['minimal', 'luxury'],
  },
  {
    id: 'vintage-tilt',
    name: 'Vintage Tilt',
    description: 'Slight rotation for retro vibes',
    emoji: '\ud83c\udf9e',
    transform: { x: -2, y: 2, scale: 0.5, rotation: -12, opacity: 92, blendMode: 'multiply' },
    tags: ['retro', 'vintage'],
  },
  {
    id: 'pocket-print',
    name: 'Pocket Print',
    description: 'Small left-chest style placement',
    emoji: '\ud83d\udc55',
    transform: { x: -18, y: -22, scale: 0.28, rotation: 0, opacity: 100, blendMode: 'multiply' },
    tags: ['apparel', 'pocket'],
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    description: 'Edge-to-edge graphic fill',
    emoji: '\u25a6',
    transform: { x: 0, y: 0, scale: 0.95, rotation: 0, opacity: 100, blendMode: 'normal' },
    tags: ['graphic', 'all-over'],
  },
  {
    id: 'duotone-pop',
    name: 'White Pop',
    description: 'High contrast white print on dark products',
    emoji: '\ud83c\udfa8',
    transform: {
      x: 0, y: 0, scale: 0.6, rotation: 0, opacity: 100,
      blendMode: 'overlay', colorFilter: 'white',
    },
    tags: ['color', 'pop'],
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Black mark, refined look',
    emoji: '\u25d0',
    transform: {
      x: 0, y: 0, scale: 0.52, rotation: 0, opacity: 100,
      blendMode: 'multiply', colorFilter: 'black',
    },
    tags: ['minimal', 'bw'],
  },
];

export function applyPreset(
  current: LogoTransform,
  preset: StylePreset
): LogoTransform {
  return { ...current, ...preset.transform };
}
