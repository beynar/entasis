import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

// `size` scales typography and icons only; `density` owns every gap (section,
// row, label/value, chip-list). 'normal' density matches the previous
// normal-size spacing, 'small' the previous small, 'large' the
// previous large — defaults render identically to before the split.
const defaultRoot = cva({
	base: 'flex flex-col',
	variants: {
		density: {
			small: 'gap-md',
			normal: 'gap-lg',
			large: 'gap-xl'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultHeader = cva({
	base: 'flex flex-col',
	variants: {
		density: {
			small: 'gap-micro',
			normal: 'gap-xs',
			large: 'gap-xs'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultTitle = cva({
	base: 'font-medium text-neutral',
	variants: {
		size: {
			small: 'text-sm',
			normal: 'text-base',
			large: 'text-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultDescription = cva({
	base: 'text-neutral/60',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultList = cva({
	base: 'grid',
	variants: {
		density: {
			small: 'gap-x-xl gap-y-md',
			normal: 'gap-x-layout-md gap-y-md',
			large: 'gap-x-layout-lg gap-y-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultItem = cva({
	base: 'flex items-start',
	variants: {
		density: {
			small: 'gap-md',
			normal: 'gap-lg',
			large: 'gap-xl'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultKey = cva({
	base: 'flex items-center w-[35%] min-w-24 shrink-0 text-neutral/60',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		density: {
			small: 'gap-sm',
			normal: 'gap-md',
			large: 'gap-md'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal'
	}
});

const defaultKeyIcon = cva({
	base: 'shrink-0 [&>svg]:size-full',
	variants: {
		size: {
			small: 'size-3.5',
			normal: 'size-4',
			large: 'size-5'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultValue = cva({
	base: 'flex-1 min-w-0 text-neutral',
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

const defaultLink = cva({
	base: 'underline decoration-neutral-muted/40 underline-offset-2 hover:decoration-current transition-colors'
});

const defaultChips = cva({
	base: 'flex flex-wrap',
	variants: {
		density: {
			small: 'gap-xs',
			normal: 'gap-sm',
			large: 'gap-md'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultToggle = cva({
	base: 'inline-flex items-center self-start cursor-pointer rounded-sm text-neutral/60 outline-none transition-colors hover:text-neutral focus-visible:ring-2 focus-visible:ring-primary/50',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		density: {
			small: 'gap-xs',
			normal: 'gap-sm',
			large: 'gap-md'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal'
	}
});

const defaultToggleIcon = cva({
	base: 'inline-flex transition-transform duration-200',
	variants: {
		expanded: {
			true: 'rotate-180',
			false: ''
		}
	},
	defaultVariants: {
		expanded: false
	}
});

export const metadataListTheme = {
	root: defaultRoot,
	header: defaultHeader,
	title: defaultTitle,
	description: defaultDescription,
	list: defaultList,
	item: defaultItem,
	key: defaultKey,
	keyIcon: defaultKeyIcon,
	value: defaultValue,
	link: defaultLink,
	chips: defaultChips,
	toggle: defaultToggle,
	toggleIcon: defaultToggleIcon
};

export type MetadataListTheme = typeof metadataListTheme;
export type MetadataListThemeProps = InferComponentTheme<MetadataListTheme>;
export const setMetadataListTheme = setComponentTheme<MetadataListTheme>('metadataList');
export const useMetadataListTheme = useComponentTheme('metadataList', metadataListTheme);
