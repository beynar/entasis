import type { PluginAPI } from 'tailwindcss/plugin';

const radiusVariables = {
	'--radius': '0.25rem',
	'--radius-xs': '0.25rem',
	'--radius-sm': '0.25rem',
	'--radius-md': '0.5rem',
	'--radius-lg': '0.75rem',
	'--radius-xl': '0.75rem',
	'--radius-2xl': '0.75rem',
	'--radius-3xl': '0.75rem',
	'--radius-4xl': '0.75rem'
} as const;

export const applyRadiusEngine = ({ addBase }: PluginAPI) => {
	addBase({ html: radiusVariables });
};
