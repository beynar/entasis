<script lang="ts">
	import type { Sizes } from '$lib/types/theme.js';
	import type { PinInputState } from './pinInput.state.svelte.js';
	import type { usePinInputTheme } from './pinInput.theme.js';

	type PinInputClasses = ReturnType<typeof usePinInputTheme>;

	let {
		state,
		classes,
		size,
		disabled,
		mask = false,
		groups
	}: {
		state: PinInputState;
		classes: PinInputClasses;
		size?: Sizes;
		disabled?: boolean;
		mask?: boolean;
		groups?: number[];
	} = $props();

	// Indexes of the cells a separator follows: the end of every group but the last cell's.
	const separatorAfter = $derived.by(() => {
		const after: number[] = [];
		let end = 0;
		for (const group of groups ?? []) {
			if (!Number.isFinite(group) || group < 1) continue;
			end += Math.floor(group);
			if (end < state.length) after.push(end - 1);
		}
		return after;
	});

	const displayValue = (char: string | null) => (mask && char ? '•' : char);
</script>

{#each state.cells as cell (cell.index)}
	<div
		data-slot="pin-input-cell"
		data-active={cell.isActive}
		data-empty={cell.char === null}
		aria-hidden="true"
		class={classes.cell({
			size,
			active: cell.isActive,
			disabled
		})}
	>
		{#if cell.hasFakeCaret}
			<span data-slot="pin-input-caret" class={classes.caret()}></span>
		{:else}
			<span data-slot="pin-input-character" class={classes.character()}>
				{displayValue(cell.char)}
			</span>
		{/if}
	</div>
	{#if separatorAfter.includes(cell.index)}
		<div
			data-slot="pin-input-separator"
			aria-hidden="true"
			class={classes.separator({ size })}
		></div>
	{/if}
{/each}
