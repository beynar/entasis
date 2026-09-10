import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// The outer element: the panzoom "owner" viewport. `data-expanded="true"` (set by
// the panzoom controller) promotes it to a fixed fullscreen overlay.
const defaultMermaidRoot = cva({
	base: 'group/mermaid relative w-full overflow-hidden rounded-sm border border-neutral-muted bg-surface-raised data-[expanded=true]:fixed data-[expanded=true]:inset-4 data-[expanded=true]:z-[2147483647] data-[expanded=true]:m-0 data-[expanded=true]:h-[calc(100vh_-_2rem)] data-[expanded=true]:w-[calc(100vw_-_2rem)] data-[expanded=true]:min-h-0 data-[expanded=true]:rounded-md data-[expanded=true]:bg-surface-floating data-[expanded=true]:shadow-2xl',
	variants: {
		size: {
			small: 'h-64 min-h-48',
			normal: 'h-80 min-h-56',
			large: 'h-[28rem] min-h-72'
		}
	},
	defaultVariants: { size: 'normal' }
});

// The pannable/zoomable surface inside the root — the panzoom transform is
// applied to the <svg> host it wraps.
const defaultMermaidContainer = cva({
	base: 'absolute inset-0 flex items-start justify-start'
});

// The <svg> host the rendered diagram HTML is injected into.
const defaultMermaidSvg = cva({
	base: 'block max-w-none origin-top-left [&_svg]:block'
});

// Floating controls bar (top-right), revealed on hover.
const defaultMermaidButtons = cva({
	base: 'absolute right-2 top-2 z-10 flex items-center gap-xs rounded-sm border border-neutral-muted bg-surface-floating/80 p-xs opacity-0 backdrop-blur transition-opacity group-hover/mermaid:opacity-100 focus-within:opacity-100 data-[expanded=true]:opacity-100'
});

const defaultMermaidError = cva({
	base: 'absolute inset-0 z-20 flex items-center justify-center overflow-auto p-layout-md text-center text-sm rounded-sm border border-danger/40 bg-danger-muted text-danger-muted-readable'
});

const defaultMermaidSkeleton = cva({
	base: 'absolute inset-0 z-10 h-full w-full rounded-none'
});

export const mermaidTheme = {
	root: defaultMermaidRoot,
	container: defaultMermaidContainer,
	svg: defaultMermaidSvg,
	buttons: defaultMermaidButtons,
	error: defaultMermaidError,
	skeleton: defaultMermaidSkeleton
};

export type MermaidTheme = typeof mermaidTheme;
export type MermaidThemeProps = InferComponentTheme<MermaidTheme>;
export const setMermaidTheme = setComponentTheme<MermaidTheme>('mermaid');
export const useMermaidTheme = useComponentTheme('mermaid', mermaidTheme);
