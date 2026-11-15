<script lang="ts">
	// Harness for `motion-principles.browser.test.ts`: one of each surface the library's motion
	// rules shape, at their default motion.
	import Theme from './Theme/Theme.svelte';
	import Button from './Button/Button.svelte';
	import Switch from './Form/Switch/Switch.svelte';
	import PopupMenu from './PopupMenu/PopupMenu.svelte';
	import Popover from './Popover/Popover.svelte';
	import FloatingWindow from './FloatingWindow/FloatingWindow.svelte';
	import IconSwap from '$lib/transitions/IconSwap.svelte';
	import type { MenuItem } from './Menu/menu.props.js';

	let { reduceMotion = false }: { reduceMotion?: boolean } = $props();

	let swapped = $state(false);
	let minimized = $state(false);
	const items: MenuItem[] = Array.from({ length: 10 }, (_, index) => ({
		type: 'option',
		title: `Row ${index + 1}`
	}));
</script>

<Theme {reduceMotion}>
	<div class="flex flex-col items-start gap-4 p-4">
		<Button data-testid="press">Press</Button>
		<Switch label="Wifi" />
		<PopupMenu trigger={{ content: 'File' }} menu={{ items }} position="bottom-start" />
		<Popover trigger={{ content: 'Details' }} position="bottom-start">
			<div data-testid="popover-body" class="h-20 w-40">Details</div>
		</Popover>
		<button type="button" onclick={() => (swapped = !swapped)}>Swap</button>
		<IconSwap {swapped} pulse>
			{#snippet from()}<span data-testid="icon-from">A</span>{/snippet}
			{#snippet to()}<span data-testid="icon-to">B</span>{/snippet}
		</IconSwap>
		<button type="button" onclick={() => (minimized = !minimized)}>Toggle dock</button>
	</div>
	<FloatingWindow title="Notes" defaultOpen bind:minimized>
		<p>Window body</p>
	</FloatingWindow>
</Theme>
