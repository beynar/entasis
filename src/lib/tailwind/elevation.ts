import type { PluginAPI } from 'tailwindcss/plugin';
import { elevationVariables, type ThemeElevation } from './scales.js';

/** Selectors the `dark` variant matches — elevation needs the same reach. */
const darkSelector = '[data-color-scheme="dark"], html[data-theme="dark"], .dark';

export const applyElevationEngine = (
	{ addBase }: PluginAPI,
	elevation: ThemeElevation = 'normal'
) => {
	addBase({ html: elevationVariables(elevation, 'light') });
	addBase({ [darkSelector]: elevationVariables(elevation, 'dark') });
};
