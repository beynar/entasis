<script lang="ts">
	import { untrack } from 'svelte';
	import Theme from './Theme/Theme.svelte';
	import Dialog from './Dialog/Dialog.svelte';
	import { setDialogTheme, type DialogThemeProps } from './Dialog/dialog.theme.js';
	import type { DialogProps } from './Dialog/dialog.props.js';
	import { dialogInternals } from './Dialog/dialog.state.svelte.js';
	import type { ThemeProps } from './Theme/theme.props.js';

	let {
		motion,
		designTokens,
		forcedTheme,
		components,
		scopedMotion,
		theme,
		transition,
		reduceMotion,
		type
	}: {
		motion?: ThemeProps['motion'];
		designTokens?: ThemeProps['designTokens'];
		forcedTheme?: ThemeProps['forcedTheme'];
		components?: ThemeProps['components'];
		/** Applied through `setDialogTheme` from this component, i.e. for the subtree. */
		scopedMotion?: DialogThemeProps['motion'];
		theme?: DialogThemeProps;
		transition?: DialogProps['transition'];
		reduceMotion?: boolean;
		type?: DialogProps['type'];
	} = $props();

	// `setContext` must run while this component initialises; the Dialog below reads it.
	const scoped = untrack(() => scopedMotion);
	if (scoped) setDialogTheme({ motion: scoped });
</script>

<Theme {motion} {designTokens} {forcedTheme} {components} {reduceMotion}>
	<Dialog responsive={false} {type} {transition} {theme} title="Motion law">
		{#snippet trigger(dialog)}
			{@const { computedTransition } = dialogInternals(dialog)}
			<button type="button" onclick={dialog.open}>Open dialog</button>
			<span data-testid="in-duration">{computedTransition.in.duration}</span>
			<span data-testid="out-duration">{computedTransition.out.duration}</span>
			<span data-testid="in-easing">{computedTransition.in.easing}</span>
			<span data-testid="in-x">{computedTransition.in.x}</span>
			<span data-testid="in-scale">{computedTransition.in.scale}</span>
		{/snippet}
		<p>Body</p>
	</Dialog>
</Theme>
