import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
const defaultRoot = cva({ base: 'relative flex min-h-0 min-w-0 flex-1 flex-col' });
const defaultHeader = cva({ base: 'shrink-0' });
const defaultBody = cva({ base: 'relative flex min-h-0 min-w-0 flex-1' });
const defaultViewport = cva({
	base: 'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		tocSide: {
			left: 'pl-layout-lg',
			right: 'pr-layout-lg'
		}
	}
});
const defaultList = cva({ base: 'relative w-full' });
const defaultItem = cva({
	base: 'absolute top-0 left-0 z-0 w-full has-[[data-actions-visibility=always]]:z-10 hover:!z-20 focus-within:!z-20',
	variants: {
		density: {
			compact: 'px-lg py-micro',
			normal: 'px-xl py-md',
			comfortable: 'px-layout-sm py-lg'
		}
	},
	defaultVariants: { density: 'normal' }
});
const defaultScrollButton = cva({
	base: 'absolute bottom-4 z-10',
	variants: {
		position: {
			left: 'left-4',
			center: 'left-1/2 -translate-x-1/2',
			right: 'right-4'
		}
	},
	defaultVariants: { position: 'right' }
});
const defaultAskQuestion = cva({
	base: 'shrink-0 border-t border-neutral-muted p-lg'
});
const defaultTocOverlay = cva({
	base: 'pointer-events-none absolute inset-y-0 z-10 flex items-center py-lg',
	variants: {
		side: {
			left: 'left-0',
			right: 'right-0'
		}
	},
	defaultVariants: { side: 'left' }
});
const defaultFooter = cva({ base: 'shrink-0' });
export const aiThreadTheme = {
	root: defaultRoot,
	header: defaultHeader,
	body: defaultBody,
	viewport: defaultViewport,
	list: defaultList,
	item: defaultItem,
	scrollButton: defaultScrollButton,
	askQuestion: defaultAskQuestion,
	tocOverlay: defaultTocOverlay,
	footer: defaultFooter
};
export type AIThreadTheme = typeof aiThreadTheme;
export type AIThreadThemeProps = InferComponentTheme<AIThreadTheme>;
export const setAIThreadTheme = setComponentTheme<AIThreadTheme>('ai-thread');
export const useAIThreadTheme = useComponentTheme<AIThreadTheme>('ai-thread', aiThreadTheme);
