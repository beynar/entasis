import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultTagGroupRoot = cva({
	base: 'w-full'
});

const defaultTagGroupInputContainer = cva({
	base: 'w-full justify-start',
	variants: {
		disabled: {
			true: 'opacity-60',
			false: ''
		}
	},
	defaultVariants: {
		disabled: false
	}
});

const defaultTagGroupList = cva({
	base: 'flex w-full flex-wrap items-center justify-start',
	variants: {
		size: {
			small: 'gap-xs',
			normal: 'gap-sm',
			large: 'gap-md'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultTagGroupItem = cva({
	base: 'outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
	variants: {
		selected: {
			true: '',
			false: ''
		}
	},
	defaultVariants: {
		selected: false
	}
});

const defaultTagGroupChip = cva({
	base: 'select-none'
});

export const tagGroupTheme = {
	root: defaultTagGroupRoot,
	inputContainer: defaultTagGroupInputContainer,
	list: defaultTagGroupList,
	item: defaultTagGroupItem,
	chip: defaultTagGroupChip
};

export type TagGroupTheme = typeof tagGroupTheme;
export type TagGroupThemeProps = InferComponentTheme<TagGroupTheme>;
export const setTagGroupTheme = setComponentTheme<TagGroupTheme>('tag-group');
export const useTagGroupTheme = useComponentTheme<TagGroupTheme>('tag-group', tagGroupTheme);
