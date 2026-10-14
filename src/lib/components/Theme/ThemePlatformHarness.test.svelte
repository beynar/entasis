<script lang="ts">
	// Harness for `theme.platform.svelte.test.ts`: a Theme with the platform props under test
	// (`nonce`, `portalContainer`, `transitionOnChange`) that hands its state to the test.
	import Theme from './Theme.svelte';
	import type { ThemeState } from './theme.state.svelte.js';
	import type { ThemeProps } from './theme.props.js';
	import type { Component } from 'svelte';

	let {
		onTheme,
		child,
		childProps = {},
		...props
	}: Omit<ThemeProps, 'children'> & {
		onTheme?: (theme: ThemeState) => void;
		/** A component to mount inside the Theme, with `childProps`. */
		child?: Component<Record<string, unknown>>;
		childProps?: Record<string, unknown>;
	} = $props();
</script>

<Theme {...props}>
	{#snippet children(theme)}
		<p {@attach () => onTheme?.(theme)}>Page</p>
		{#if child}
			{@const Child = child}
			<Child {...childProps} />
		{/if}
	{/snippet}
</Theme>
