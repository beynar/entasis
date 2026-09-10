import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultEmpty = cva({
	base: 'flex w-full min-w-0 flex-1 flex-col items-center justify-center rounded-lg text-center text-balance',
	variants: {
		size: {
			small: 'gap-lg p-xl',
			normal: 'gap-xl p-layout-md',
			large: 'gap-layout-md p-layout-lg'
		},
		// normal: transparent placeholder (current behavior). card: a raised surface matching Card.
		mode: {
			normal: '',
			card: 'bg-surface-raised raised-sm'
		},
		bordered: {
			true: 'border border-dashed border-neutral-muted',
			false: null
		}
	},
	defaultVariants: {
		size: 'normal',
		mode: 'normal',
		bordered: false
	}
});

const defaultEmptyHeader = cva({
	base: 'flex max-w-sm flex-col items-center',
	variants: {
		size: {
			small: 'gap-sm',
			normal: 'gap-md',
			large: 'gap-md'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultEmptyMedia = cva({
	base: 'flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
	variants: {
		size: {
			small: 'mb-sm',
			normal: 'mb-md',
			large: 'mb-lg'
		},
		mediaVariant: {
			default: 'bg-transparent',
			icon: 'bg-neutral-muted text-neutral-muted-readable rounded-md'
		}
	},
	compoundVariants: [
		{
			mediaVariant: 'icon',
			size: 'small',
			class: 'size-6 [&_svg:not([class*=size-])]:size-3.5'
		},
		{
			mediaVariant: 'icon',
			size: 'normal',
			class: 'size-8 [&_svg:not([class*=size-])]:size-4'
		},
		{
			mediaVariant: 'icon',
			size: 'large',
			class: 'size-10 [&_svg:not([class*=size-])]:size-5'
		}
	],
	defaultVariants: {
		size: 'normal',
		mediaVariant: 'default'
	}
});

const defaultEmptyTitle = cva({
	base: 'text-neutral font-medium tracking-tight',
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

const defaultEmptyDescription = cva({
	base: 'text-neutral/60 [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary-readable',
	variants: {
		size: {
			small: 'text-xs/relaxed',
			normal: 'text-sm/relaxed',
			large: 'text-base/relaxed'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultEmptyContent = cva({
	base: 'flex w-full max-w-sm min-w-0 flex-col items-center text-balance',
	variants: {
		size: {
			small: 'gap-md text-xs',
			normal: 'gap-md text-sm',
			large: 'gap-lg text-base'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// Row of action buttons rendered from the `actions` prop.
const defaultEmptyActions = cva({
	base: 'flex flex-wrap items-center justify-center',
	variants: {
		size: {
			small: 'gap-sm',
			normal: 'gap-md',
			large: 'gap-md'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// Trailing slot below the content — typically a "Learn more" link. Muted by default; link styling
// matches the description part so an anchor reads the same.
const defaultEmptyFooter = cva({
	base: 'text-neutral/60 flex items-center justify-center [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary-readable',
	variants: {
		size: {
			small: 'text-[0.6875rem]',
			normal: 'text-xs',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const emptyTheme = {
	root: defaultEmpty,
	header: defaultEmptyHeader,
	media: defaultEmptyMedia,
	title: defaultEmptyTitle,
	description: defaultEmptyDescription,
	content: defaultEmptyContent,
	actions: defaultEmptyActions,
	footer: defaultEmptyFooter
};

export type EmptyTheme = typeof emptyTheme;
export type EmptyThemeProps = InferComponentTheme<EmptyTheme>;
export const setEmptyTheme = setComponentTheme<EmptyTheme>('empty');
export const useEmptyTheme = useComponentTheme<EmptyTheme>('empty', emptyTheme);
