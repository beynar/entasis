import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

// The default (classic) variant is the nova/shadcn look: flat rows separated by
// a muted border, a plain trigger whose title underlines on hover, a small muted
// chevron, quiet content. `card` wraps the list in a raised surface, `outline`
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
			compact: '',
			normal: '',
			comfortable: ''
		},
		variant: {
			classic: '',
			card: '',
			outline: ''
		},
		splitted: {
			true: 'flex flex-col',
			false: ''
		}
	},
	compoundVariants: [
		// One container surface holding all rows (same surface as the Card component).
		{ variant: 'card', splitted: false, class: 'raised rounded-lg bg-surface-raised' },
		{ variant: 'outline', splitted: false, class: 'rounded-lg border border-neutral-muted' },
		// Gap between the per-item surfaces.
		{ splitted: true, density: 'compact', class: 'gap-md' },
		{ splitted: true, density: 'normal', class: 'gap-lg' },
		{ splitted: true, density: 'comfortable', class: 'gap-xl' }
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
			compact: '',
			normal: '',
			comfortable: ''
		},
		variant: {
			classic: '',
			card: '',
			outline: ''
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
		{ variant: 'card', splitted: true, class: 'raised rounded-lg bg-surface-raised' },
		{ variant: 'outline', splitted: true, class: 'rounded-lg border border-neutral-muted' }
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
	base: 'group/accordion-trigger cursor-pointer w-full flex items-start justify-between gap-xl text-left transition-[color,background-color,box-shadow,opacity] outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none disabled:opacity-50',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		},
		density: {
			compact: 'py-md',
			normal: 'py-md',
			comfortable: 'py-lg'
		},
		variant: {
			classic: '',
			// Contained surfaces inset their rows (variant chrome, not density).
			card: 'px-xl',
			outline: 'px-xl'
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
			compact: 'gap-0',
			normal: 'gap-micro',
			comfortable: 'gap-xs'
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
	base: 'text-neutral/70',
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
	base: 'text-neutral/70 block',
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
			compact: 'pb-md',
			normal: 'pb-md',
			comfortable: 'pb-lg'
		},
		variant: {
			classic: '',
			card: 'px-xl',
			outline: 'px-xl'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		variant: 'classic'
	}
});

// Expanded content slides open along the `axis` the panel grows on — `y` for the
// default vertical list — fading slightly as it collapses. `duration` / `easing`
// stay tokens so `<Theme motion>` and a reduced-motion preference reach every item.
export const defaultAccordionMotion = motion({
	base: {
		in: { axis: 'y', x: 0, y: 0, scale: 1, opacity: 0.2 },
		out: { axis: 'y', x: 0, y: 0, scale: 1, opacity: 0.2 }
	},
	variants: {
		axis: {
			y: {},
			x: { in: { axis: 'x' }, out: { axis: 'x' } }
		}
	},
	defaultVariants: {
		axis: 'y'
	}
});

export const accordionTheme = {
	motion: defaultAccordionMotion,
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
export const useAccordionMotion = () => useComponentMotion('accordion', defaultAccordionMotion);
