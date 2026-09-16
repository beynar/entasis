import type { PluginAPI } from 'tailwindcss/plugin';
import { radiusVariables, type ThemeRadius } from './scales.js';

export const applyRadiusEngine = ({ addBase }: PluginAPI, radius: ThemeRadius = 'normal') => {
	addBase({ html: radiusVariables(radius) });
};
