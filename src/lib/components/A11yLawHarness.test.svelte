<script lang="ts">
	import Theme from './Theme/Theme.svelte';
	import Dialog from './Dialog/Dialog.svelte';
	import Popover from './Popover/Popover.svelte';
	import PopupMenu from './PopupMenu/PopupMenu.svelte';
	import Tabs from './Tabs/Tabs.svelte';
	import Select from './Form/Select/Select.svelte';
	import type { MenuItem } from './Menu/menu.props.js';

	type Scenario =
		'dialog' | 'popover' | 'popover-snippet' | 'siblings' | 'tabs' | 'menu' | 'select';
	let {
		scenario,
		closeOnEscape = true,
		onAfterClose
	}: { scenario: Scenario; closeOnEscape?: boolean; onAfterClose?: () => void } = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	const menuItems: MenuItem[] = [
		{ type: 'option', title: 'Archive' },
		{ type: 'option', title: 'Copy' },
		{ type: 'option', title: 'Cut' },
		{ type: 'option', title: 'Delete' }
	];
</script>

<Theme>
	<p data-testid="outside">Page content that must become inert behind a modal.</p>

	{#if scenario === 'dialog'}
		<Dialog
			responsive={false}
			transition={zero}
			{closeOnEscape}
			{onAfterClose}
			title="Law dialog"
			description="Explains the law"
		>
			{#snippet trigger(dialog)}
				<button type="button" onclick={dialog.open}>Open dialog</button>
			{/snippet}
			{#snippet children(dialog)}
				<input aria-label="First field" />
				<button type="button" onclick={dialog.close}>Close dialog</button>
			{/snippet}
		</Dialog>
	{:else if scenario === 'popover'}
		<Popover transition={zero} trigger={{ content: 'Open popover' }} {onAfterClose}>
			<button type="button">Inside popover</button>
		</Popover>
	{:else if scenario === 'popover-snippet'}
		<Popover transition={zero} {onAfterClose}>
			{#snippet trigger(popover)}
				<button type="button" onclick={popover.toggle} {@attach popover.reference}>
					Snippet trigger
				</button>
			{/snippet}
			<button type="button">Inside popover</button>
		</Popover>
	{:else if scenario === 'siblings'}
		<Popover transition={zero} trigger={{ content: 'Open A' }}>
			<button type="button">Inside A</button>
		</Popover>
		<Popover transition={zero} trigger={{ content: 'Open B' }}>
			<button type="button">Inside B</button>
		</Popover>
	{:else if scenario === 'tabs'}
		<Tabs
			items={[
				{ value: 'overview', label: 'Overview' },
				{ value: 'settings', label: 'Settings' }
			]}
		>
			{#snippet children({ item })}
				<p>{typeof item === 'string' ? item : item.label} panel</p>
			{/snippet}
		</Tabs>
	{:else if scenario === 'menu'}
		<PopupMenu menu={{ items: menuItems }} transition={zero}>
			{#snippet trigger(popover)}
				<button type="button" onclick={popover.toggle} {@attach popover.reference}>
					Open menu
				</button>
			{/snippet}
		</PopupMenu>
	{:else if scenario === 'select'}
		<Select
			label="Fruit"
			items={[
				{ value: 'apple', label: 'Apple' },
				{ value: 'banana', label: 'Banana' },
				{ value: 'cherry', label: 'Cherry' }
			]}
		/>
	{/if}
</Theme>
