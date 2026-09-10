import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// The default (classic) variant is the nova/shadcn look: flat rows separated by
// a muted border, a plain trigger whose title underlines on hover, a small muted
// chevron, quiet content. `card` wraps the list in a raised surface, `outlined`
// in a muted border; `splitted` breaks the list into one surface per item.
// `size` scales typography (title/description/content text, icon) only;
// `density` owns paddings and gaps.
const defaultAccordion = cva({
	base: 'w-full h-fit',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		},
		density: {
			small: '',
			normal: '',
			large: ''
		},
		variant: {
			classic: '',
			card: '',
			outlined: ''
		},
		splitted: {
			true: 'flex flex-col',
			false: ''
		}
	},
	compoundVariants: [
		// One container surface holding all rows (same surface as the Card component).
		{ variant: 'card', splitted: false, class: 'raised rounded-md bg-surface-raised' },
		{ variant: 'outlined', splitted: false, class: 'rounded-md border border-neutral-muted' },
		// Gap between the per-item surfaces.
		{ splitted: true, density: 'small', class: 'gap-md' },
		{ splitted: true, density: 'normal', class: 'gap-lg' },
		{ splitted: true, density: 'large', class: 'gap-xl' }
	],
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		variant: 'classic',
		splitted: false
	}
});

const defaultAccordionItem = cva({
	base: 'w-full isolate relative',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		},
		density: {
			small: '',
			normal: '',
			large: ''
		},
		variant: {
			classic: '',
			card: '',
			outlined: ''
		},
		splitted: {
			true: '',
			false: ''
		},
		expanded: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		// Shared container (any variant): muted separator between rows.
		{ splitted: false, class: 'border-b border-neutral-muted last:border-b-0' },
		// One surface per item.
		{ variant: 'classic', splitted: true, class: 'border-b border-neutral-muted' },
		{ variant: 'card', splitted: true, class: 'raised rounded-md bg-surface-raised' },
		{ variant: 'outlined', splitted: true, class: 'rounded-md border border-neutral-muted' }
	],
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		variant: 'classic',
		splitted: false,
		expanded: false
	}
});

const defaultAccordionTrigger = cva({
	// items-start + the icon wrapper's slight downward nudge keep the chevron
	// aligned to the first title line when titles wrap or a description exists.
	base: 'group/accordion-trigger cursor-pointer w-full flex items-start justify-between gap-xl text-left transition-all outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		},
		density: {
			small: 'py-md',
			normal: 'py-md',
			large: 'py-lg'
		},
		variant: {
			classic: '',
			// Contained surfaces inset their rows (variant chrome, not density).
			card: 'px-xl',
			outlined: 'px-xl'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		variant: 'classic'
	}
});

const defaultAccordionHeader = cva({
	base: 'flex-1 flex flex-col items-start',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		},
		density: {
			small: 'gap-0',
			normal: 'gap-micro',
			large: 'gap-xs'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal'
	}
});

const defaultAccordionTitle = cva({
	base: 'text-neutral font-medium group-hover/accordion-trigger:underline',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultAccordionDescription = cva({
	base: 'text-neutral/60',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		}
	}
});

// Layout (shrink/nudge) and open-state rotation live on the span wrapper in the
// component — this part only styles the glyph itself.
const defaultAccordionIcon = cva({
	base: 'text-neutral/60 block',
	variants: {
		size: {
			small: 'size-3.5',
			normal: 'size-4',
			large: 'size-5'
		}
	}
});

const defaultAccordionIconWrapper = cva({
	base: 'shrink-0 translate-y-0.5 transition-transform',
	variants: {
		expanded: {
			true: 'rotate-180',
			false: ''
		}
	},
	defaultVariants: { expanded: false }
});

const defaultAccordionContent = cva({
	base: 'pt-0 origin-top w-full',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		density: {
			small: 'pb-md',
			normal: 'pb-md',
			large: 'pb-lg'
		},
		variant: {
			classic: '',
			card: 'px-xl',
			outlined: 'px-xl'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		variant: 'classic'
	}
});

export const accordionTheme = {
	root: defaultAccordion,
	item: defaultAccordionItem,
	header: defaultAccordionHeader,
	trigger: defaultAccordionTrigger,
	title: defaultAccordionTitle,
	description: defaultAccordionDescription,
	icon: defaultAccordionIcon,
	iconWrapper: defaultAccordionIconWrapper,
	content: defaultAccordionContent
};

export type AccordionTheme = typeof accordionTheme;
export type AccordionThemeProps = InferComponentTheme<AccordionTheme>;
export const setAccordionTheme = setComponentTheme<AccordionTheme>('accordion');
export const useAccordionTheme = useComponentTheme<AccordionTheme>('accordion', accordionTheme);
