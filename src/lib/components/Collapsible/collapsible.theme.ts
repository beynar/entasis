import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultCollapsibleContainer = cva({
	base: 'flex w-full flex-col',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCollapsibleTrigger = cva({
	base: 'state-layer flex items-center justify-between cursor-pointer transition-all bg-transparent border-0 text-left w-full gap-md rounded-sm',
	variants: {
		size: {
			small: 'px-sm py-sm text-sm ',
			normal: 'px-md py-md text-sm ',
			large: 'px-lg py-lg text-base'
		},
		disabled: {
			true: 'opacity-55 cursor-not-allowed pointer-events-none',
			false: null
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

const defaultCollapsibleContent = cva({
	base: 'overflow-hidden flex flex-col',
	variants: {
		size: {
			small: 'gap-sm mt-xs',
			normal: 'gap-md mt-md',
			large: 'gap-lg mt-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCollapsibleIcon = cva({
	base: 'size-4 transition-transform flex-shrink-0',
	variants: {
		size: {
			small: 'size-3',
			normal: 'size-4',
			large: 'size-5'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const collapsibleTheme = {
	root: defaultCollapsibleContainer,
	trigger: defaultCollapsibleTrigger,
	content: defaultCollapsibleContent,
	icon: defaultCollapsibleIcon
};

export type CollapsibleTheme = typeof collapsibleTheme;
export type CollapsibleThemeProps = InferComponentTheme<CollapsibleTheme>;
export const setCollapsibleTheme = setComponentTheme<CollapsibleTheme>('collapsible');
export const useCollapsibleTheme = useComponentTheme<CollapsibleTheme>(
	'collapsible',
	collapsibleTheme
);
