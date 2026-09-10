import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const defaultRoot = cva({
	base: 'relative min-w-0 overflow-hidden rounded-sm bg-surface',
	variants: {
		bordered: {
			true: 'border border-neutral-muted',
			false: 'rounded-none bg-transparent'
		}
	}
});
const defaultFrame = cva({ base: 'block min-h-32 w-full border-0 bg-transparent' });
const defaultState = cva({ base: 'grid min-h-32 place-items-center p-xl' });

export const aiMcpAppTheme = {
	root: defaultRoot,
	frame: defaultFrame,
	state: defaultState
};
export type AIMcpAppTheme = typeof aiMcpAppTheme;
export type AIMcpAppThemeProps = InferComponentTheme<AIMcpAppTheme>;
export const setAIMcpAppTheme = setComponentTheme<AIMcpAppTheme>('aiMcpApp');
export const useAIMcpAppTheme = useComponentTheme<AIMcpAppTheme>('aiMcpApp', aiMcpAppTheme);
