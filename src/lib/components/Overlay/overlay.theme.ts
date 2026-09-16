import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultOverlayRoot = cva({
	base: 'pointer-events-none absolute inset-0 z-10 flex overflow-hidden rounded-[inherit] text-white opacity-100 transition-opacity duration-normal ease-standard motion-reduce:transition-none',
	variants: {
		position: {
			fill: 'items-center',
			top: 'items-start',
			bottom: 'items-end'
		},
		open: {
			true: null,
			false: 'opacity-0'
		},
		showOn: {
			always: null,
			hover: null,
			focus: null
		}
	},
	compoundVariants: [
		{ open: true, showOn: 'hover', class: 'opacity-0' },
		{ open: true, showOn: 'focus', class: 'opacity-0' }
	],
	defaultVariants: {
		position: 'fill',
		open: true,
		showOn: 'always'
	}
});

const defaultOverlayScrim = cva({
	base: 'pointer-events-none absolute inset-0',
	variants: {
		position: {
			fill: 'bg-black/55',
			top: '-z-[1] bg-linear-to-b from-black/80 via-black/40 to-transparent',
			bottom: '-z-[1] bg-linear-to-t from-black/80 via-black/40 to-transparent'
		}
	},
	defaultVariants: {
		position: 'fill'
	}
});

const defaultOverlayContent = cva({
	base: 'relative z-[1] isolate flex w-full min-w-0 flex-col will-change-transform transition-transform duration-normal ease-standard motion-reduce:transition-none',
	variants: {
		size: {
			small: 'gap-md p-xl',
			normal: 'gap-lg p-layout-md',
			large: 'gap-xl p-layout-lg'
		},
		align: {
			start: 'items-start text-left',
			center: 'items-center text-center',
			end: 'items-end text-right'
		},
		position: {
			fill: null,
			top: null,
			bottom: null
		},
		open: {
			true: null,
			false: 'pointer-events-none'
		},
		showOn: {
			always: 'pointer-events-auto',
			hover: 'pointer-events-none',
			focus: 'pointer-events-none'
		}
	},
	compoundVariants: [
		{ position: 'top', open: false, class: '-translate-y-2' },
		{ position: 'bottom', open: false, class: 'translate-y-2' },
		{ position: 'top', open: true, showOn: 'hover', class: '-translate-y-2' },
		{ position: 'bottom', open: true, showOn: 'hover', class: 'translate-y-2' },
		{ position: 'top', open: true, showOn: 'focus', class: '-translate-y-2' },
		{ position: 'bottom', open: true, showOn: 'focus', class: 'translate-y-2' }
	],
	defaultVariants: {
		size: 'normal',
		align: 'center',
		position: 'fill',
		open: true,
		showOn: 'always'
	}
});

const defaultOverlayHeader = cva({
	base: 'flex max-w-xl flex-col',
	variants: {
		size: {
			small: 'gap-micro',
			normal: 'gap-xs',
			large: 'gap-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultOverlayTitle = cva({
	base: 'font-semibold text-balance',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultOverlayDescription = cva({
	base: 'max-w-xl text-white/70 text-balance',
	variants: {
		size: {
			small: 'text-xs/relaxed',
			normal: 'text-xs/relaxed',
			large: 'text-sm/relaxed'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultOverlayBody = cva({
	base: 'max-w-xl text-white',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultOverlayActions = cva({
	base: 'flex w-full max-w-sm flex-wrap items-center',
	variants: {
		size: {
			small: 'gap-sm',
			normal: 'gap-md',
			large: 'gap-md'
		},
		align: {
			start: 'justify-start',
			center: 'justify-center',
			end: 'justify-end'
		}
	},
	defaultVariants: {
		size: 'normal',
		align: 'center'
	}
});

export const overlayTheme = {
	root: defaultOverlayRoot,
	scrim: defaultOverlayScrim,
	content: defaultOverlayContent,
	header: defaultOverlayHeader,
	title: defaultOverlayTitle,
	description: defaultOverlayDescription,
	body: defaultOverlayBody,
	actions: defaultOverlayActions
};

export type OverlayTheme = typeof overlayTheme;
export type OverlayThemeProps = InferComponentTheme<OverlayTheme>;
export const setOverlayTheme = setComponentTheme<OverlayTheme>('overlay');
export const useOverlayTheme = useComponentTheme<OverlayTheme>('overlay', overlayTheme);
