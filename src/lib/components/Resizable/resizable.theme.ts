import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultRoot = cva({
	base: 'flex h-full w-full',
	variants: {
		orientation: {
			horizontal: '',
			vertical: 'flex-col'
		},
		variant: {
			default: 'overflow-hidden',
			splitted: 'overflow-visible'
		},
		dragging: {
			true: 'select-none',
			false: null
		},
		disabled: {
			true: 'cursor-not-allowed',
			false: null
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		variant: 'default',
		dragging: false,
		disabled: false
	}
});

const defaultPanel = cva({
	base: 'min-h-0 min-w-0 overflow-hidden',
	variants: {
		variant: {
			default: null,
			splitted: 'border-neutral-muted bg-surface rounded-sm border shadow-sm'
		},
		animating: {
			true: 'motion-safe:will-change-[flex] motion-safe:transition-[flex] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
			false: null
		}
	},
	defaultVariants: {
		variant: 'default',
		animating: false
	}
});

const defaultHandle = cva({
	base: 'group/resizable-handle relative flex shrink-0 touch-none items-center justify-center outline-none transition-colors before:absolute after:absolute focus-visible:ring-2 focus-visible:ring-primary/40 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
	variants: {
		orientation: {
			horizontal: 'cursor-col-resize',
			vertical: 'cursor-row-resize'
		},
		variant: {
			default: 'bg-neutral-muted hover:bg-primary/30 data-[dragging=true]:bg-primary/45',
			splitted: 'bg-transparent hover:bg-transparent data-[dragging=true]:bg-transparent'
		},
		lines: {
			true: null,
			false: 'bg-transparent after:bg-transparent'
		},
		handleVariant: {
			grip: null,
			thumb: null
		}
	},
	compoundVariants: [
		{
			orientation: 'horizontal',
			variant: 'default',
			class:
				'h-full w-px before:inset-y-0 before:left-1/2 before:w-3 before:-translate-x-1/2 rtl:before:translate-x-1/2'
		},
		{
			orientation: 'vertical',
			variant: 'default',
			class: 'h-px w-full before:inset-x-0 before:top-1/2 before:h-3 before:-translate-y-1/2'
		},
		{
			orientation: 'horizontal',
			variant: 'splitted',
			class:
				'h-full w-2 before:inset-y-0 before:left-0 before:w-full after:inset-y-2 after:left-1/2 after:w-px after:-translate-x-1/2 after:rounded-full'
		},
		{
			orientation: 'vertical',
			variant: 'splitted',
			class:
				'h-2 w-full before:inset-x-0 before:top-0 before:h-full after:inset-x-2 after:top-1/2 after:h-px after:-translate-y-1/2 after:rounded-full'
		},
		{
			orientation: 'horizontal',
			variant: 'splitted',
			lines: true,
			class:
				'after:bg-neutral-muted hover:after:bg-primary/50 data-[dragging=true]:after:bg-primary'
		},
		{
			orientation: 'vertical',
			variant: 'splitted',
			lines: true,
			class:
				'after:bg-neutral-muted hover:after:bg-primary/50 data-[dragging=true]:after:bg-primary'
		},
		{
			orientation: 'horizontal',
			variant: 'splitted',
			lines: false,
			handleVariant: 'grip',
			class: 'hover:after:bg-primary/50 data-[dragging=true]:after:bg-primary'
		},
		{
			orientation: 'vertical',
			variant: 'splitted',
			lines: false,
			handleVariant: 'grip',
			class: 'hover:after:bg-primary/50 data-[dragging=true]:after:bg-primary'
		}
	],
	defaultVariants: {
		orientation: 'horizontal',
		variant: 'default',
		lines: true,
		handleVariant: 'grip'
	}
});

const defaultGrip = cva({
	base: 'z-10 shrink-0',
	variants: {
		orientation: {
			horizontal: null,
			vertical: null
		},
		handleVariant: {
			grip: 'border-neutral-muted/80 bg-surface/95 text-neutral/70 grid place-items-center rounded-full border shadow-[0_1px_2px_rgb(0_0_0/0.12)] transition-colors group-hover/resizable-handle:border-primary/40 group-hover/resizable-handle:text-primary-readable/80 group-data-[dragging=true]/resizable-handle:border-primary/55 group-data-[dragging=true]/resizable-handle:text-primary-readable',
			thumb:
				'bg-neutral/20 rounded-full transition-colors group-hover/resizable-handle:bg-primary/55 group-data-[dragging=true]/resizable-handle:bg-primary'
		}
	},
	compoundVariants: [
		{
			orientation: 'horizontal',
			handleVariant: 'grip',
			class: 'h-7 w-4 grid-cols-2 gap-x-micro gap-y-xs px-xs py-sm'
		},
		{
			orientation: 'vertical',
			handleVariant: 'grip',
			class: 'h-4 w-7 grid-cols-3 gap-x-xs gap-y-micro px-sm py-xs'
		},
		{
			orientation: 'horizontal',
			handleVariant: 'thumb',
			class: 'h-8 w-0.5'
		},
		{
			orientation: 'vertical',
			handleVariant: 'thumb',
			class: 'h-0.5 w-8'
		}
	],
	defaultVariants: {
		orientation: 'horizontal',
		handleVariant: 'grip'
	}
});

const defaultGripDot = cva({
	base: 'bg-current rounded-full opacity-75',
	variants: {
		orientation: {
			horizontal: 'size-0.5',
			vertical: 'size-0.5'
		}
	},
	defaultVariants: {
		orientation: 'horizontal'
	}
});

export const resizableTheme = {
	root: defaultRoot,
	panel: defaultPanel,
	handle: defaultHandle,
	grip: defaultGrip,
	gripDot: defaultGripDot
};

export type ResizableTheme = typeof resizableTheme;
export type ResizableThemeProps = InferComponentTheme<ResizableTheme>;
export const setResizableTheme = setComponentTheme<ResizableTheme>('resizable');
export const useResizableTheme = useComponentTheme('resizable', resizableTheme);
