import type { Snippet } from 'svelte';
import type { SvelteThemeProps } from 'svelte-themes';
import type { SpinnerVariant } from '../Spinner/spinner.props.js';
import type { ThemeState } from './theme.state.svelte.js';
import type { ThemeTransition } from './themeTransition.js';
import type { ThemeDesignTokenMap } from './theme.designTokens.js';
import type { DeepPartial, MotionTokens } from '$lib/tailwind/scales.js';
import type { ComponentThemeRegistry } from '$lib/utils/cva/theme.js';

export type ThemeProps<T extends readonly string[] = readonly string[]> = Omit<
	SvelteThemeProps<T>,
	'children' | 'enableSystem' | 'enableColorScheme' | 'disableTransitionOnChange'
> & {
	/** App content. The snippet receives the shared ThemeState instance. */
	children: Snippet<[ThemeState]>;
	/**
	 * Follows `prefers-color-scheme` and appends `'system'` to `themes`.
	 * Maps to svelte-themes' `enableSystem`. @default true
	 */
	systemTheme?: boolean;
	/**
	 * Writes the resolved scheme to the document `color-scheme` so built-in browser UI
	 * (inputs, scrollbars) matches. Maps to svelte-themes' `enableColorScheme`. @default true
	 */
	syncColorScheme?: boolean;
	/**
	 * Keeps CSS transitions running while the theme changes. Set false to suppress them for
	 * the swap. Maps to svelte-themes' `disableTransitionOnChange`. @default true
	 */
	transitionOnChange?: boolean;
	/** Global default animation for loading indicators. */
	spinnerVariant?: SpinnerVariant;
	/** Runtime design tokens keyed by logical theme name. */
	designTokens?: ThemeDesignTokenMap<T>;
	/** View transition used when ThemeState.theme changes. Omit for an instant change. */
	transition?: ThemeTransition;
	/**
	 * Forces reduced motion on (`true`) or off (`false`) for every entasis animation.
	 * Omit to follow the user's OS reduced-motion setting.
	 */
	reduceMotion?: boolean;
	/**
	 * Global motion scale: `duration` steps in ms (`instant` … `slower`) and `easing`
	 * roles (`standard`, `enter`, `exit`, `emphasized`). Retunes every component preset
	 * that resolves its tokens through the Theme; omitted tokens keep their default.
	 */
	motion?: DeepPartial<MotionTokens>;
	/**
	 * App-wide component theme defaults, keyed by theme name (`dialog`, `button`, ...).
	 * Each entry takes the same slots as the component's `theme` prop, motion included.
	 * A `set<Component>Theme` call or an instance `theme` prop still wins.
	 */
	components?: ComponentThemeRegistry;
};
