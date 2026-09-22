<script
	lang="ts"
	generics="ThemeName extends string = string, T extends readonly ThemeName[] = readonly ThemeName[]"
>
	import BeforeHydratation from '../Utils/BeforeHydratation.svelte';
	import { Theme as SvelteTheme } from 'svelte-themes';
	import { ThemeState } from './theme.state.svelte.js';
	import { compileThemeBlockingScript } from './helper.js';
	import TooltipHost from '../Tooltip/TooltipHost.svelte';
	import DialogBackdrop from '../Dialog/DialogBackdrop.svelte';
	import type { ThemeProps } from './theme.props.js';
	import { portal } from '$lib/attachments/portal.js';
	import { FLOATING_WINDOW_LAYER_Z_INDEX } from './theme.layers.js';
	import { compileThemeDesignTokens, type ThemeDesignTokens } from './theme.designTokens.js';
	import { mergeMotionTokens } from '$lib/tailwind/scales.js';
	import { REDUCED_MOTION_ATTRIBUTE, REDUCED_MOTION_QUERY } from '$lib/utils/motion.svelte.js';

	let {
		children,
		forcedTheme = undefined,
		transitionOnChange = true,
		systemTheme = true,
		syncColorScheme = true,
		storageKey = 'theme',
		themes,
		defaultTheme = systemTheme ? 'system' : 'light',
		attribute = 'data-theme',
		value = undefined,
		spinnerVariant = 'default',
		designTokens,
		transition,
		colorScheme,
		reduceMotion,
		motion,
		components
	}: ThemeProps<T> = $props();

	const validatedDefaultTheme = (() => {
		const defaultThemes = ['light', 'dark'];
		const currentThemes = (themes && themes.length > 0 ? themes : defaultThemes) as string[];
		const finalThemes =
			systemTheme && !currentThemes.includes('system')
				? currentThemes.concat('system')
				: currentThemes;

		// If defaultTheme is not in the themes array, fall back to first theme
		return finalThemes.includes(defaultTheme) ? defaultTheme : finalThemes[0];
	})();
	const theme = new SvelteTheme({
		get forcedTheme() {
			return forcedTheme;
		},
		get themes() {
			const defaultThemes = ['light', 'dark'];
			const currentThemes = (themes && themes.length > 0 ? themes : defaultThemes) as string[];
			if (systemTheme && !currentThemes.includes('system')) {
				return currentThemes.concat('system');
			}
			return currentThemes;
		},
		// svelte-themes spells these `enableSystem` / `enableColorScheme`; entasis's prop
		// vocabulary bans the `enable` prefix, so the mapping lives here.
		get enableSystem() {
			return systemTheme;
		},

		get enableColorScheme() {
			return syncColorScheme;
		},
		get colorScheme() {
			return colorScheme;
		},

		get defaultTheme() {
			return validatedDefaultTheme;
		},
		get attribute() {
			return attribute;
		},
		get value() {
			return value;
		},
		get storageKey() {
			return storageKey;
		},
		// `transitionOnChange` is the positive form of svelte-themes' `disableTransitionOnChange`.
		get disableTransitionOnChange() {
			return !transitionOnChange;
		}
	});

	const entasisTheme = new ThemeState(
		{
			get spinnerVariant() {
				return spinnerVariant;
			},
			get themeTransition() {
				return transition;
			},
			get reduceMotion() {
				return reduceMotion;
			},
			get motionTokens() {
				// The active theme's `designTokens.motion` block layers over the `motion` prop,
				// so `ThemeState.motion` matches the `--duration-*` / `--ease-*` the same theme
				// emits — one scale for CSS utilities and Svelte/WAAPI transitions alike.
				const resolved = theme.resolvedTheme;
				const themeMotion =
					resolved && designTokens
						? (designTokens as Record<string, ThemeDesignTokens | undefined>)[resolved]?.motion
						: undefined;
				return mergeMotionTokens(motion, themeMotion);
			},
			get componentThemes() {
				return components;
			},
			get defaultColor() {
				const resolved = theme.resolvedTheme;
				if (!resolved || !designTokens) return 'neutral';
				return (
					(designTokens as Record<string, ThemeDesignTokens | undefined>)[resolved]?.defaultColor ??
					'neutral'
				);
			}
		},
		theme
	);

	// Mirror the resolved preference onto <html> so CSS-only animations (Marquee, Code)
	// can honour it. The blocking script below sets it before hydration so a
	// reduced-motion user never sees a first frame of animation.
	$effect(() => {
		document.documentElement.toggleAttribute(
			REDUCED_MOTION_ATTRIBUTE,
			entasisTheme.preferReducesMotion
		);
		return () => document.documentElement.removeAttribute(REDUCED_MOTION_ATTRIBUTE);
	});
	const reduceMotionScript = $derived(/* js */ `(() => {
			if (${reduceMotion === undefined ? `window.matchMedia(${JSON.stringify(REDUCED_MOTION_QUERY)}).matches` : String(reduceMotion)})
				document.documentElement.setAttribute(${JSON.stringify(REDUCED_MOTION_ATTRIBUTE)}, '');
		})();`);

	const designTokenCss = $derived(
		compileThemeDesignTokens({
			designTokens,
			attribute,
			value,
			colorScheme,
			motion
		})
	);

	const themeScript = $derived(
		compileThemeBlockingScript({
			value,
			colorScheme,
			themes,
			validThemes: theme.themes,
			storageKey,
			systemTheme,
			syncColorScheme,
			forcedTheme,
			defaultTheme: validatedDefaultTheme,
			attribute
		})
	);
</script>

<BeforeHydratation
	immediate
	once
	scripts={[
		/* js */ `
	(() => {
			const visualViewport = window.visualViewport;
			const setWindowHeight = () => {
				const height = visualViewport?.height ?? window.innerHeight;
				document.documentElement.style.setProperty('--window-height', height + 'px');
			};
			const setWindowWidth = () => {
				document.documentElement.style.setProperty('--window-width', window.innerWidth + 'px');
			};
			window.addEventListener('resize', setWindowHeight);
			window.addEventListener('resize', setWindowWidth);
			visualViewport?.addEventListener('resize', setWindowHeight);
			setWindowHeight();
			setWindowWidth();
	})();
`,
		reduceMotionScript
	]}
	css={[designTokenCss]}
/>

<svelte:head>
	<!-- The blocking no-flash boot script, serialized by `compileThemeBlockingScript` from this
	     component's own props; it must reach `<head>` as a real `<script>` element, which is the
	     one thing Svelte markup cannot express. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html themeScript}
</svelte:head>

<div
	{@attach portal()}
	{@attach entasisTheme.floatingWindows.layer}
	data-slot="floating-window-layer"
	class="pointer-events-none fixed inset-0"
	style:z-index={FLOATING_WINDOW_LAYER_Z_INDEX}
></div>

{@render children(entasisTheme)}

<DialogBackdrop />
<TooltipHost />

<style>
	:global(html[data-entasis-theme-transition]::view-transition-old(root)),
	:global(html[data-entasis-theme-transition]::view-transition-new(root)) {
		animation: none;
		mix-blend-mode: normal;
	}

	:global(html[data-entasis-theme-transition]::view-transition-old(root)) {
		z-index: 0;
	}

	:global(html[data-entasis-theme-transition]::view-transition-new(root)) {
		z-index: 1;
	}
</style>
