// The palette generator without the Tailwind plugin around it, so runtime theming does not need
// `tailwindcss` installed.
import { generateColorPalette } from './colors.js';

export { generateColorPalette };
export type { ColorPaletteOptions, ColorTheme } from './colors.js';

/** What {@link generateColorPalette} returns. */
export type ColorPalette = ReturnType<typeof generateColorPalette>;
