<script lang="ts">
	// Harness for `popover.features.svelte.test.ts`: modal, label, focus-out, arrow and shared-popup
	// scenarios of one Popover each.
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import type { PopoverProps } from './popover.props.js';
	import type { PopoverState } from './popover.state.svelte.js';

	type Row = { id: number; name: string };

	let {
		scenario,
		popover = {},
		label,
		onOpenChange
	}: {
		scenario: 'plain' | 'menu' | 'nested' | 'rows' | 'sheet';
		popover?: Partial<PopoverProps>;
		/** A name that can change while the popover is open (rerender it). */
		label?: string;
		onOpenChange?: PopoverProps['onOpenChange'];
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	let rows = $state<Row[]>([
		{ id: 1, name: 'Ada' },
		{ id: 2, name: 'Grace' },
		{ id: 3, name: 'Edsger' }
	]);
</script>

{#snippet rowTrigger(row: Row, shared: PopoverState<Row>)}
	<li>
		<button type="button" {@attach shared.triggerFor(() => row)}>Open {row.name}</button>
		<button type="button" onclick={() => (rows[row.id - 1] = { ...row, name: `${row.name}!` })}>
			Rename {row.name}
		</button>
	</li>
{/snippet}

<Theme>
	<button type="button">Before</button>
	{#if scenario === 'plain'}
		<Popover transition={zero} trigger={{ content: 'Open popover' }} {onOpenChange} {...popover}>
			<button type="button">First</button>
			<button type="button">Second</button>
		</Popover>
	{:else if scenario === 'menu'}
		<Popover
			transition={zero}
			haspopup="menu"
			{label}
			trigger={{ content: 'Open menu' }}
			{onOpenChange}
			{...popover}
		>
			<div role="menu">
				<button type="button" role="menuitem">Item</button>
			</div>
		</Popover>
	{:else if scenario === 'nested'}
		<Popover transition={zero} trigger={{ content: 'Open outer' }} {onOpenChange} {...popover}>
			<button type="button">Outer first</button>
			<Popover transition={zero} trigger={{ content: 'Open inner' }}>
				<button type="button">Inner first</button>
			</Popover>
		</Popover>
	{:else if scenario === 'sheet'}
		<Popover
			transition={zero}
			mobileSheet
			trigger={{ content: 'Open sheet' }}
			{onOpenChange}
			{...popover}
		>
			<button type="button">Sheet content</button>
		</Popover>
	{:else}
		<Popover transition={zero} {onOpenChange}>
			{#snippet children(shared: PopoverState<Row>)}
				<p data-testid="payload">{shared.payload?.name ?? 'none'}</p>
			{/snippet}
			{#snippet trigger(shared: PopoverState<Row>)}
				<ul>
					{#each rows as row (row.id)}
						{@render rowTrigger(row, shared)}
					{/each}
				</ul>
			{/snippet}
		</Popover>
	{/if}
	<button type="button">After</button>
</Theme>
