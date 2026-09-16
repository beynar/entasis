import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultScrollArea = cva({
	base: 'relative isolate'
});

const defaultScrollAreaViewport = cva({
	// Native scrolling: `overflow: scroll` is set inline in the component (always a scroll
	// container for stable measurement); native bars are hidden via scoped CSS. Do not add
	// `overflow-hidden` here — it would defeat native scrolling. Focus ring shows when the
	// viewport is the focusable scroll region (keyboard scrolling).
	base: 'relative outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus/50',
	variants: {
		scrollFade: {
			none: '',
			y: 'scroll-fade',
			x: 'scroll-fade-x'
		}
	},
	defaultVariants: {
		scrollFade: 'none'
	}
});

const defaultScrollAreaContent = cva({
	// Sizing (min-width/width/position) is set inline in the component; keep this minimal.
	base: 'relative'
});

const defaultScrollAreaScrollbar = cva({
	base: 'absolute top-0 right-0 z-30 w-1.5 cursor-pointer'
});

const defaultScrollAreaScrollbarX = cva({
	base: 'absolute bottom-0 left-0 z-30 h-1.5 cursor-pointer'
});

const defaultScrollAreaScrollbarThumb = cva({
	base: "relative bg-neutral-muted after:absolute after:-inset-1 after:content-['']"
});

export const scrollAreaTheme = {
	root: defaultScrollArea,
	viewport: defaultScrollAreaViewport,
	content: defaultScrollAreaContent,
	scrollbar: defaultScrollAreaScrollbar,
	scrollbarX: defaultScrollAreaScrollbarX,
	scrollbarThumb: defaultScrollAreaScrollbarThumb
};

export type ScrollAreaTheme = typeof scrollAreaTheme;
export type ScrollAreaThemeProps = InferComponentTheme<ScrollAreaTheme>;
export const setScrollAreaTheme = setComponentTheme<ScrollAreaTheme>('scrollArea');
export const useScrollAreaTheme = useComponentTheme<ScrollAreaTheme>('scrollArea', scrollAreaTheme);
