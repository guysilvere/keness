/**
 * Keness design palette — single source of truth for all color tokens.
 * Consumed by the web dashboard (packages/web) and the docs site (docs/).
 * CSS custom properties mirror of this file lives in tokens.css.
 */

export const palette = {
  emerald: {
    hex: '#48bf84',
    rgb: [72, 191, 132] as const,
    hsl: [150, 48, 52] as const,
  },
  coffeBean: {
    hex: '#6d4c3d',
    rgb: [109, 76, 61] as const,
    hsl: [19, 28, 33] as const,
  },
  lilacAsh: {
    hex: '#afaab9',
    rgb: [175, 170, 185] as const,
    hsl: [260, 10, 70] as const,
  },
  parchment: {
    hex: '#ede6e3',
    rgb: [237, 230, 227] as const,
    hsl: [18, 22, 91] as const,
  },
  emeraldDepths: {
    hex: '#00664d',
    rgb: [0, 102, 77] as const,
    hsl: [165, 100, 20] as const,
  },
} as const;

/**
 * Semantic aliases — map palette colors to their design role.
 * Prefer these over the raw palette in component code.
 */
export const tokens = {
  // Brand
  brand: palette.emerald.hex,
  brandDark: palette.emeraldDepths.hex,

  // Text
  textPrimary: palette.coffeBean.hex,
  textMuted: palette.lilacAsh.hex,

  // Surfaces
  surfaceBase: palette.parchment.hex,
  surfaceOverlay: palette.lilacAsh.hex,

  // Accents
  accentPrimary: palette.emerald.hex,
  accentDeep: palette.emeraldDepths.hex,
} as const;

export type PaletteKey = keyof typeof palette;
export type TokenKey = keyof typeof tokens;
