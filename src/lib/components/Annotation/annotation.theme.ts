import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

// `--annotation-color` is the one colour of the marker, the arrow and the note. `color` sets it
// to a role; a class on the root sets it to anything else (`[--annotation-color:#ff1493]`).
//
// The marker is the root's `::before`, behind the target: it runs a little past it on both sides
// and takes no room, so the line of text does not move. `draw` sweeps it in.
const defaultRoot = cva({
	base: 'relative isolate overflow-visible rounded-sm forced-colors:outline forced-colors:outline-[CanvasText]',
	variants: {
		color: {
			primary: '[--annotation-color:var(--color-primary-readable)]',
			secondary: '[--annotation-color:var(--color-secondary-readable)]',
			danger: '[--annotation-color:var(--color-danger-readable)]',
			success: '[--annotation-color:var(--color-success-readable)]',
			warning: '[--annotation-color:var(--color-warning-readable)]',
			info: '[--annotation-color:var(--color-info-readable)]',
			neutral: '[--annotation-color:var(--color-neutral-readable)]',
			// The turning hue is set by the component's own styles.
			rainbow: ''
		},
		highlight: {
			true: 'before:pointer-events-none before:absolute before:inset-y-0 before:[inset-inline:-0.3em] before:-z-1 before:rounded-sm before:bg-(--annotation-color)/15 forced-colors:before:hidden',
			false: ''
		},
		block: {
			true: 'block',
			false: 'inline-block leading-tight'
		}
	},
	defaultVariants: {
		color: 'neutral',
		highlight: true,
		block: false
	}
});

// Placed by the component's own styles, which follow `placement`.
const defaultArrow = cva({
	base: 'pointer-events-none absolute h-[38px] w-[46px] max-w-none fill-none stroke-current text-(--annotation-color) opacity-90 select-none forced-colors:text-[CanvasText]'
});

// Placed, sized and set in its handwriting by the component's own styles.
const defaultLabel = cva({
	base: 'pointer-events-none absolute w-max font-normal leading-none whitespace-normal text-(--annotation-color) opacity-90 select-none [overflow-wrap:anywhere] forced-colors:text-[CanvasText]'
});

export const annotationTheme = {
	root: defaultRoot,
	arrow: defaultArrow,
	label: defaultLabel
};

export type AnnotationTheme = typeof annotationTheme;
export type AnnotationThemeProps = InferComponentTheme<AnnotationTheme>;
export const setAnnotationTheme = setComponentTheme<AnnotationTheme>('annotation');
export const useAnnotationTheme = useComponentTheme<AnnotationTheme>('annotation', annotationTheme);
