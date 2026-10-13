import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

const defaultTabs = cva({
	base: 'flex w-full',
	variants: {
		placement: {
			top: 'flex-col',
			bottom: 'flex-col-reverse',
			left: 'flex-row',
			right: 'flex-row-reverse'
		}
	},
	defaultVariants: {
		placement: 'top'
	}
});

// `my-md` keeps panel content off the tab list. It is a margin, not padding: the Stepper positions
// its panel track from the padding box, so padding on it would offset the panels.
const defaultTabsContent = cva({
	base: 'my-md w-full flex-full',
	variants: {
		placement: {
			top: 'w-full',
			bottom: 'w-full',
			left: 'h-full',
			right: 'h-full'
		}
	},
	defaultVariants: {
		placement: 'top'
	}
});

// Panel swap timing. Tabs owns its own preset (so `setTabsTheme({ motion })` retunes
// tabs without touching every Stepper) and forwards the resolved `{ in, out }` to the
// Stepper it renders, where it wins over the stepper preset.
export const defaultTabsMotion = motion({
	base: {
		in: {},
		out: {},
		duration: 'slow',
		easing: 'standard'
	}
});

export const tabsTheme = {
	motion: defaultTabsMotion,
	root: defaultTabs,
	content: defaultTabsContent
};

export type TabsTheme = typeof tabsTheme;
export type TabsThemeProps = InferComponentTheme<TabsTheme>;
export const setTabsTheme = setComponentTheme<TabsTheme>('tabs');
export const useTabsTheme = useComponentTheme<TabsTheme>('tabs', tabsTheme);
export const useTabsMotion = () => useComponentMotion('tabs', defaultTabsMotion);
