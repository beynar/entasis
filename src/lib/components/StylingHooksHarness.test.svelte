<script lang="ts">
	// Harness for `styling-hooks-law.svelte.test.ts` (proposed law 12): one scenario per component
	// that documents styling hooks, each with the parts the law test reads in both states.
	import Theme from './Theme/Theme.svelte';
	import Accordion from './Accordion/Accordion.svelte';
	import Collapsible from './Collapsible/Collapsible.svelte';
	import Combobox from './Form/Combobox/Combobox.svelte';
	import Dialog from './Dialog/Dialog.svelte';
	import HoverCard from './HoverCard/HoverCard.svelte';
	import Overlay from './Overlay/Overlay.svelte';
	import Popover from './Popover/Popover.svelte';
	import PopupMenu from './PopupMenu/PopupMenu.svelte';
	import Select from './Form/Select/Select.svelte';
	import Tooltip from './Tooltip/Tooltip.svelte';
	import type { MenuItem } from './Menu/menu.props.js';

	type Scenario =
		| 'popover'
		| 'dialog'
		| 'tooltip'
		| 'hover-card'
		| 'popup-menu'
		| 'select'
		| 'combobox'
		| 'collapsible'
		| 'accordion'
		| 'overlay';

	let {
		scenario,
		open = false,
		duration = 0
	}: {
		scenario: Scenario;
		open?: boolean;
		/** Transition length in ms; above 0 the exit phase lasts until the next macrotask. */
		duration?: number;
	} = $props();

	const zero = $derived({ in: { duration }, out: { duration } });
	const options = [
		{ value: 'free', label: 'Free' },
		{ value: 'pro', label: 'Pro' },
		{ value: 'team', label: 'Team', disabled: true }
	];
	const menuItems: MenuItem[] = [
		{ type: 'option', title: 'Archive' },
		{ type: 'option', title: 'Delete', disabled: true },
		{ type: 'checkbox', title: 'Pinned', defaultValue: true },
		{ type: 'submenu', title: 'Move to', menu: [{ type: 'option', title: 'Inbox' }] }
	];
</script>

<Theme>
	<p data-testid="outside">Outside every overlay.</p>
	{#if scenario === 'popover'}
		<Popover transition={zero} arrow trigger={{ content: 'Open popover' }}>
			<button type="button">Inside popover</button>
		</Popover>
	{:else if scenario === 'dialog'}
		<Dialog
			responsive={false}
			transition={zero}
			title="Hooked dialog"
			trigger={{ content: 'Open dialog' }}
		>
			<button type="button">Inside dialog</button>
		</Dialog>
	{:else if scenario === 'tooltip'}
		<Tooltip {open} content="Tooltip content" transition={zero} trigger={{ content: 'Hint' }} />
	{:else if scenario === 'hover-card'}
		<HoverCard {open} trigger="Card trigger" transition={zero}>
			<p>Card body</p>
		</HoverCard>
	{:else if scenario === 'popup-menu'}
		<PopupMenu menu={{ items: menuItems }} transition={zero} trigger={{ content: 'Actions' }} />
	{:else if scenario === 'select'}
		<Select label="Plan" items={options} defaultValue="pro" {open} />
	{:else if scenario === 'combobox'}
		<Combobox label="Plan" items={options} defaultValue="pro" {open} />
	{:else if scenario === 'collapsible'}
		<Collapsible trigger="Details">
			<p>Collapsible body</p>
		</Collapsible>
	{:else if scenario === 'accordion'}
		<Accordion
			items={[
				{ id: 'one', title: 'First', content: 'First body' },
				{ id: 'two', title: 'Second', content: 'Second body', disabled: true }
			]}
		/>
	{:else if scenario === 'overlay'}
		<div>
			<Overlay {open} title="Overlay title" />
		</div>
	{/if}
</Theme>
