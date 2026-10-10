<script lang="ts">
	// Harness for `proposed-laws.svelte.test.ts`: one scenario per proposed accessibility and
	// overlay law (decisions.md, written into AGENTS.md at release). Wrapped in <Theme> so
	// overlays get their layer and focus context.
	import Theme from './Theme/Theme.svelte';
	import Dialog from './Dialog/Dialog.svelte';
	import Menu from './Menu/Menu.svelte';
	import Popover from './Popover/Popover.svelte';
	import type { MenuItem } from './Menu/menu.props.js';

	type Scenario =
		| 'dialog-trigger'
		| 'dialog-default-open'
		| 'popover-inline-default-open'
		| 'popover-prevented-trigger'
		| 'removed-opener'
		| 'menu';

	type OpenChange = (open: boolean, details?: { reason?: string; cancel?: () => void }) => void;

	let {
		scenario,
		onOpenChange,
		onAfterOpen
	}: { scenario: Scenario; onOpenChange?: OpenChange; onAfterOpen?: () => void } = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	const menuItems: MenuItem[] = [
		{ type: 'option', title: 'Archive' },
		{ type: 'option', title: 'Copy' },
		{ type: 'option', title: 'Cut' },
		{ type: 'option', title: 'Delete' }
	];

	let removedOpenerDialog = $state(false);
	let openerPresent = $state(true);
</script>

<Theme>
	<p data-testid="outside">Page content outside every overlay.</p>

	{#if scenario === 'dialog-trigger'}
		<Dialog
			responsive={false}
			transition={zero}
			title="Triggered dialog"
			trigger={{ content: 'Open dialog' }}
			{onOpenChange}
		>
			<input aria-label="Dialog field" />
		</Dialog>
	{:else if scenario === 'dialog-default-open'}
		<Dialog defaultOpen responsive={false} title="Open at creation" {onOpenChange} {onAfterOpen}>
			<input aria-label="Dialog field" />
		</Dialog>
	{:else if scenario === 'popover-inline-default-open'}
		<Popover
			inline
			defaultOpen
			trigger={{ content: 'Inline trigger' }}
			{onOpenChange}
			{onAfterOpen}
		>
			<button type="button">Inside inline popover</button>
		</Popover>
	{:else if scenario === 'popover-prevented-trigger'}
		<Popover
			transition={zero}
			trigger={{ content: 'Guarded trigger', onclick: (event) => event.preventDefault() }}
		>
			<button type="button">Inside guarded popover</button>
		</Popover>
	{:else if scenario === 'removed-opener'}
		<input aria-label="Notes" />
		{#if openerPresent}
			<button
				type="button"
				onclick={() => {
					removedOpenerDialog = true;
					openerPresent = false;
				}}>Open and remove</button
			>
		{/if}
		<Dialog
			responsive={false}
			transition={zero}
			title="Opened by a removed button"
			bind:open={removedOpenerDialog}
		>
			<button type="button">Inside</button>
		</Dialog>
	{:else if scenario === 'menu'}
		<Menu items={menuItems} />
	{/if}
</Theme>
