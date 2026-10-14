<script lang="ts">
	// Harness for `useFocusScope.svelte.test.ts` and `useFocusScope.browser.test.ts`: a Dialog
	// over a page, a Confirmation stacked above it, and a menu-like opener that leaves the page.
	import Theme from '../components/Theme/Theme.svelte';
	import Dialog from '../components/Dialog/Dialog.svelte';
	import Popover from '../components/Popover/Popover.svelte';
	import Confirmation from '../components/Confirmation/Confirmation.svelte';
	import { confirmation } from '../components/Confirmation/confirmation.state.svelte.js';
	import type { DialogProps } from '../components/Dialog/dialog.props.js';
	import type { PopoverProps } from '../components/Popover/popover.props.js';

	type Scenario =
		| 'stacked'
		| 'focus-on-close'
		| 'disabled-opener'
		| 'popover-focus-on-close'
		| 'bound-close'
		| 'trap';

	let {
		scenario,
		focusOnClose,
		popoverFocusOnClose
	}: {
		scenario: Scenario;
		focusOnClose?: DialogProps['focusOnClose'];
		popoverFocusOnClose?: PopoverProps['focusOnClose'];
	} = $props();

	const motion = { in: { duration: 20 }, out: { duration: 40 } };
	let openerDisabled = $state(false);
	let target = $state<HTMLButtonElement | null>(null);
	// Dialogs created open are handed their state through a bound flag.
	let open = $state(false);
</script>

<Theme>
	<button type="button">Before</button>
	<Confirmation />
	{#if scenario === 'stacked'}
		<Dialog
			responsive={false}
			transition={motion}
			title="Parent"
			trigger={{ content: 'Open parent' }}
		>
			<input aria-label="Name" />
			<button
				type="button"
				onclick={() =>
					confirmation({
						title: 'Delete it',
						description: 'Gone for good.',
						confirm: 'Remove',
						cancel: 'Keep'
					})}>Delete</button
			>
		</Dialog>
	{:else if scenario === 'disabled-opener'}
		<!-- The opener disables itself on press, as a "Delete" button does while it works. -->
		<input aria-label="Notes" />
		<button
			type="button"
			disabled={openerDisabled}
			onclick={() => {
				open = true;
				openerDisabled = true;
			}}>Open and disable</button
		>
		<Dialog bind:open responsive={false} transition={motion} title="Disabled opener">
			<input aria-label="Inside field" />
		</Dialog>
	{:else if scenario === 'trap'}
		<Dialog responsive={false} transition={motion} title="Trap" trigger={{ content: 'Open trap' }}>
			<button type="button">One</button>
			<button type="button">Two</button>
			<button type="button">Three</button>
		</Dialog>
	{:else if scenario === 'bound-close'}
		<Dialog
			bind:open
			responsive={false}
			transition={motion}
			title="Bound"
			{focusOnClose}
			trigger={{ content: 'Open bound' }}
		>
			<button type="button" onclick={() => (open = false)}>Cancel</button>
		</Dialog>
	{:else if scenario === 'focus-on-close'}
		<button bind:this={target} type="button">Elsewhere</button>
		<Dialog
			responsive={false}
			transition={motion}
			title="Focus on close"
			{focusOnClose}
			trigger={{ content: 'Open dialog' }}
		>
			<input aria-label="Inside field" />
		</Dialog>
	{:else}
		<Popover
			{...{ focusOnClose: popoverFocusOnClose } as object}
			transition={motion}
			focusOnOpen="first"
			trigger={{ content: 'Open popover' }}
		>
			<button type="button">Inside popover</button>
		</Popover>
	{/if}
</Theme>
