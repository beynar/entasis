<script lang="ts" generics="const T extends readonly string[]">
	import BeforeHydratation from '../Utils/BeforeHydratation.svelte';
	import { Theme as SvelteTheme } from 'svelte-themes';
	import { ThemeState } from './theme.state.svelte.js';
	import { compileThemeBlockingScript } from './helper.js';
	import Tooltip from '../Tooltip/Tooltip.svelte';
	import DialogBackdrop from '../Dialog/DialogBackdrop.svelte';
	import type { ThemeProps } from './theme.props.js';
	import { portal } from '$lib/attachments/portal.js';
	import { FLOATING_WINDOW_LAYER_Z_INDEX } from './theme.layers.js';
	import { compileThemeDesignTokens } from './theme.designTokens.js';

	let {
		children,
		forcedTheme = undefined,
		disableTransitionOnChange = false,
		enableSystem = true,
		enableColorScheme = true,
		storageKey = 'theme',
		themes,
		defaultTheme = enableSystem ? 'system' : 'light',
		attribute = 'data-theme',
		value = undefined,
		spinnerVariant = 'default',
		designTokens,
		transition,
		colorScheme
	}: ThemeProps<T> = $props();

	const validatedDefaultTheme = (() => {
		const defaultThemes = ['light', 'dark'];
		const currentThemes = (themes && themes.length > 0 ? themes : defaultThemes) as string[];
		const finalThemes =
			enableSystem && !currentThemes.includes('system')
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
			if (enableSystem && !currentThemes.includes('system')) {
				return currentThemes.concat('system');
			}
			return currentThemes;
		},
		get enableSystem() {
			return enableSystem;
		},

		get enableColorScheme() {
			return enableColorScheme;
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
		get disableTransitionOnChange() {
			return disableTransitionOnChange;
		}
	});

	const sveltaiTheme = new ThemeState(
		{
			get spinnerVariant() {
				return spinnerVariant;
			},
			get themeTransition() {
				return transition;
			}
		},
		theme
	);

	const designTokenCss = $derived(
		compileThemeDesignTokens({
			designTokens,
			attribute,
			value,
			colorScheme
		})
	);

	const themeScript = $derived(
		compileThemeBlockingScript({
			value,
			colorScheme,
			themes,
			validThemes: theme.themes,
			storageKey,
			enableSystem,
			enableColorScheme,
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
`
	]}
	css={[designTokenCss]}
/>

<svelte:head>
	{@html themeScript}
</svelte:head>

<div
	{@attach portal()}
	{@attach sveltaiTheme.floatingWindows.layer}
	data-slot="floating-window-layer"
	class="pointer-events-none fixed inset-0"
	style:z-index={FLOATING_WINDOW_LAYER_Z_INDEX}
></div>

{@render children(sveltaiTheme)}

<DialogBackdrop />
<Tooltip />

<style>
	:global(html[data-svelai-theme-transition]::view-transition-old(root)),
	:global(html[data-svelai-theme-transition]::view-transition-new(root)) {
		animation: none;
		mix-blend-mode: normal;
	}

	:global(html[data-svelai-theme-transition]::view-transition-old(root)) {
		z-index: 0;
	}

	:global(html[data-svelai-theme-transition]::view-transition-new(root)) {
		z-index: 1;
	}
</style>
