<script lang="ts">
	// Harness for the open-change and lifecycle tests in `floatingWindow.svelte.test.ts`.
	import Theme from '../Theme/Theme.svelte';
	import FloatingWindow from './FloatingWindow.svelte';
	import type { FloatingWindowProps } from './floatingWindow.props.js';

	let {
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		defaultOpen = true
	}: Pick<
		FloatingWindowProps,
		'onOpenChange' | 'onAfterOpen' | 'onAfterClose' | 'defaultOpen'
	> = $props();
</script>

<Theme>
	<FloatingWindow title="Notes" {defaultOpen} {onOpenChange} {onAfterOpen} {onAfterClose}>
		<p>Window body</p>
	</FloatingWindow>
</Theme>
