<script lang="ts" module>
	export type LeakKind =
		'dialog' | 'popover' | 'menu' | 'tooltip' | 'hover-card' | 'select' | 'combobox';

	/** What the test drives: the open state, whether the overlay is mounted, and its lifecycle. */
	export interface LeakController {
		setOpen?: (open: boolean) => void;
		setMounted?: (mounted: boolean) => void;
		afterOpen?: () => void;
		afterClose?: () => void;
	}
</script>

<script lang="ts">
	// Harness for `overlays.leak.browser.test.ts`: one overlay of each kind, its open state and its
	// presence driven from the test through `controller`, with zero-duration transitions where the
	// component takes one.
	import type { Attachment } from 'svelte/attachments';
	import Theme from './Theme/Theme.svelte';
	import Dialog from './Dialog/Dialog.svelte';
	import Popover from './Popover/Popover.svelte';
	import PopupMenu from './PopupMenu/PopupMenu.svelte';
	import Tooltip from './Tooltip/Tooltip.svelte';
	import HoverCard from './HoverCard/HoverCard.svelte';
	import Select from './Form/Select/Select.svelte';
	import Combobox from './Form/Combobox/Combobox.svelte';
	import type { MenuItem } from './Menu/menu.props.js';

	let { kind, controller }: { kind: LeakKind; controller: LeakController } = $props();

	let open = $state(false);
	let mounted = $state(true);
	// The test owns the controller object; the harness only fills in its setters.
	// svelte-ignore state_referenced_locally
	controller.setOpen = (next) => (open = next);
	// svelte-ignore state_referenced_locally
	controller.setMounted = (next) => (mounted = next);

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	const afterOpen = () => controller.afterOpen?.();
	const afterClose = () => controller.afterClose?.();
	const options = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry' }
	];
	const menuItems: MenuItem[] = [
		{ type: 'option', title: 'New file' },
		{
			type: 'submenu',
			title: 'Share',
			menu: [
				{ type: 'option', title: 'Email' },
				{ type: 'option', title: 'Link' }
			]
		},
		{ type: 'option', title: 'Quit' }
	];
</script>

{#snippet tooltipTrigger(attach: Attachment<HTMLElement>)}
	<button type="button" {@attach attach}>Tooltip trigger</button>
{/snippet}

<Theme reduceMotion>
	<button type="button">Before</button>
	{#if mounted}
		{#if kind === 'dialog'}
			<Dialog
				bind:open
				responsive={false}
				transition={zero}
				title="Leak dialog"
				trigger={{ content: 'Open dialog' }}
				onAfterOpen={afterOpen}
				onAfterClose={afterClose}
			>
				<button type="button">Inside dialog</button>
			</Dialog>
		{:else if kind === 'popover'}
			<Popover
				bind:open
				mobileSheet={false}
				transition={zero}
				trigger={{ content: 'Open popover' }}
				onAfterOpen={afterOpen}
				onAfterClose={afterClose}
			>
				<button type="button">Inside popover</button>
			</Popover>
		{:else if kind === 'menu'}
			<PopupMenu
				bind:open
				mobileSheet={false}
				transition={zero}
				trigger={{ content: 'File' }}
				menu={{ items: menuItems }}
				onAfterOpen={afterOpen}
				onAfterClose={afterClose}
			/>
		{:else if kind === 'tooltip'}
			<Tooltip
				bind:open
				content="Tooltip content"
				delay={0}
				transition={zero}
				trigger={tooltipTrigger}
				onAfterOpen={afterOpen}
				onAfterClose={afterClose}
			/>
		{:else if kind === 'hover-card'}
			<HoverCard
				bind:open
				trigger="Card trigger"
				transition={zero}
				onAfterOpen={afterOpen}
				onAfterClose={afterClose}
			>
				<p>Card body</p>
			</HoverCard>
		{:else if kind === 'select'}
			<Select
				bind:open
				label="Fruit"
				items={options}
				onAfterOpen={afterOpen}
				onAfterClose={afterClose}
			/>
		{:else if kind === 'combobox'}
			<Combobox
				bind:open
				label="Fruit"
				items={options}
				onAfterOpen={afterOpen}
				onAfterClose={afterClose}
			/>
		{/if}
	{/if}
	<button type="button">After</button>
	<!-- Where the pointer rests between tests, away from every hover trigger. -->
	<div data-testid="elsewhere" class="fixed right-0 bottom-0 size-4"></div>
</Theme>
