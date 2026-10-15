<script lang="ts">
	// Harness for `popover.session.svelte.test.ts` and `popover.session.browser.test.ts` (CX-10):
	// closed popovers, a popover nested in another's panel, one popover with several triggers,
	// and one with a slow closing transition. Each popover reports its API through `onApi`.
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import type { PopoverApi } from './popover.api.js';

	let {
		scenario,
		triggers = 2,
		onApi
	}: {
		scenario: 'many' | 'nested' | 'triggers' | 'slow';
		triggers?: number;
		onApi?: (name: string, popover: PopoverApi) => void;
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	const slow = { in: { duration: 0 }, out: { duration: 400 } };
	const report = (name: string, popover: PopoverApi) => {
		onApi?.(name, popover);
		return '';
	};
</script>

<Theme>
	<button type="button">Outside</button>
	{#if scenario === 'many'}
		{#each ['First', 'Second', 'Third'] as name (name)}
			<Popover transition={zero}>
				{#snippet trigger(popover: PopoverApi)}
					{report(name, popover)}
					<button type="button" {@attach popover.trigger}>{name}</button>
				{/snippet}
				<button type="button">Inside {name}</button>
			</Popover>
		{/each}
	{:else if scenario === 'nested'}
		<Popover transition={zero}>
			{#snippet trigger(outer: PopoverApi)}
				{report('outer', outer)}
				<button type="button" {@attach outer.trigger}>Outer</button>
			{/snippet}
			<Popover transition={zero}>
				{#snippet trigger(inner: PopoverApi)}
					{report('inner', inner)}
					<button type="button" {@attach inner.trigger}>Inner</button>
				{/snippet}
				<button type="button">Inside inner</button>
			</Popover>
		</Popover>
	{:else if scenario === 'triggers'}
		<Popover transition={zero}>
			{#snippet trigger(popover: PopoverApi)}
				{report('shared', popover)}
				{#each Array.from({ length: triggers }, (_, index) => index + 1) as row (row)}
					<button type="button" {@attach popover.triggerFor(() => row)}>Row {row}</button>
				{/each}
			{/snippet}
			<p>Row panel</p>
		</Popover>
	{:else if scenario === 'slow'}
		<Popover transition={slow}>
			{#snippet trigger(popover: PopoverApi)}
				{report('slow', popover)}
				<button type="button" {@attach popover.trigger}>Slow</button>
			{/snippet}
			<button type="button">Inside slow</button>
		</Popover>
	{/if}
</Theme>
