import type { PluginAPI } from 'tailwindcss/plugin';

const geometryVariables = {
	'--control-height-sm': 'calc(var(--spacing) * 7)',
	'--control-height-md': 'calc(var(--spacing) * 8)',
	'--control-height-lg': 'calc(var(--spacing) * 9)',
	'--icon-size-sm': 'calc(var(--spacing) * 3.5)',
	'--icon-size-md': 'calc(var(--spacing) * 4)',
	'--icon-size-lg': 'calc(var(--spacing) * 5)',
	'--hit-area-sm': 'calc(var(--spacing) * 7)',
	'--hit-area-md': 'calc(var(--spacing) * 8)',
	'--hit-area-lg': 'calc(var(--spacing) * 9)',
	'--indent-sm': 'calc(var(--spacing) * 6)',
	'--indent-md': 'calc(var(--spacing) * 8)',
	'--indent-lg': 'calc(var(--spacing) * 10)',
	'--indent-xl': 'calc(var(--spacing) * 12)'
} as const;

const sizedUtilities = (prefix: string, property: string, values: Record<string, string>) =>
	Object.fromEntries(
		Object.entries(values).map(([size, value]) => [`.${prefix}-${size}`, { [property]: value }])
	);

export const applyGeometryEngine = ({ addBase, addUtilities }: PluginAPI) => {
	addBase({ html: geometryVariables });
	addUtilities({
		...sizedUtilities('h-control', 'height', {
			sm: 'var(--control-height-sm)',
			md: 'var(--control-height-md)',
			lg: 'var(--control-height-lg)'
		}),
		...Object.fromEntries(
			(['sm', 'md', 'lg'] as const).map((size) => [
				`.size-icon-${size}`,
				{
					width: `var(--icon-size-${size})`,
					height: `var(--icon-size-${size})`
				}
			])
		),
		...Object.fromEntries(
			(['sm', 'md', 'lg'] as const).map((size) => [
				`.min-size-hit-${size}`,
				{
					'min-width': `var(--hit-area-${size})`,
					'min-height': `var(--hit-area-${size})`
				}
			])
		),
		...sizedUtilities('ps-indent', 'padding-inline-start', {
			sm: 'var(--indent-sm)',
			md: 'var(--indent-md)',
			lg: 'var(--indent-lg)',
			xl: 'var(--indent-xl)'
		})
	});
};
