<script lang="ts">
	// Harness for `proposed-laws.svelte.test.ts` and `proposed-laws.browser.test.ts`: scenarios for
	// the proposed accessibility and overlay laws (decisions.md, written into AGENTS.md at
	// release). Wrapped in <Theme> so overlays get their layer and focus context.
	import Theme from './Theme/Theme.svelte';
	import Dialog from './Dialog/Dialog.svelte';
	import Menu from './Menu/Menu.svelte';
	import Popover from './Popover/Popover.svelte';
	import PopupMenu from './PopupMenu/PopupMenu.svelte';
	import RatingInput from './Form/RatingInput/RatingInput.svelte';
	import Select from './Form/Select/Select.svelte';
	import SegmentedControl from './SegmentedControl/SegmentedControl.svelte';
	import type { SegmentedControlItem } from './SegmentedControl/segmentedControl.props.js';
	import { tooltip } from './Tooltip/tooltip.attachment.svelte.js';
	import type { MenuItem } from './Menu/menu.props.js';

	type Scenario =
		| 'dialog-trigger'
		| 'dialog-default-open'
		| 'popover'
		| 'popover-inline-default-open'
		| 'popover-prevented-trigger'
		| 'popover-two-triggers'
		| 'popover-removable-trigger'
		| 'popover-hover'
		| 'removed-opener'
		| 'menu'
		| 'popup-menu'
		| 'segmented'
		| 'tooltip'
		| 'rating-read-only'
		| 'select-read-only'
		| 'select-disabled';

	type OpenChange = (open: boolean, details?: { reason?: string; cancel?: () => void }) => void;

	let {
		scenario,
		onOpenChange,
		onAfterOpen,
		triggerPresent = true,
		triggerDisabled = false,
		menuItems = [
			{ type: 'option', title: 'Archive' },
			{ type: 'option', title: 'Copy' },
			{ type: 'option', title: 'Cut' },
			{ type: 'option', title: 'Delete' }
		],
		segments = ['Archive', 'Copy', 'Cut', 'Delete'].map((label) => ({ value: label, label }))
	}: {
		scenario: Scenario;
		onOpenChange?: OpenChange;
		onAfterOpen?: () => void;
		/** `popover-removable-trigger`: whether the trigger is still rendered. */
		triggerPresent?: boolean;
		/** `popover-hover`: whether the trigger is disabled. */
		triggerDisabled?: boolean;
		/** `menu`: the items, replaced through `rerender` to insert or remove some. */
		menuItems?: MenuItem[];
		/** `segmented`: a keyed list, replaced through `rerender` to insert or remove some. */
		segments?: SegmentedControlItem[];
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	const plans = [
		{ value: 'free', label: 'Free' },
		{ value: 'pro', label: 'Pro' },
		{ value: 'team', label: 'Team' }
	];
	// Props a law adds before the component declares them go through a spread, so the harness
	// type-checks today and exercises the prop as soon as the owning lane adds it.
	const undeclared = (props: Record<string, unknown>) => props as object;

	let removedOpenerDialog = $state(false);
	let openerPresent = $state(true);
</script>

<Theme>
	<p data-testid="outside">Page content outside every overlay.</p>
	<button type="button">Before</button>

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
	{:else if scenario === 'popover'}
		<Popover
			transition={zero}
			focusOnOpen="first"
			trigger={{ content: 'Open popover' }}
			{onOpenChange}
		>
			<button type="button">Inside popover</button>
		</Popover>
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
	{:else if scenario === 'popover-two-triggers'}
		<Popover transition={zero} focusOnOpen="first">
			{#snippet trigger(popover)}
				<button type="button" {@attach popover.trigger}>First trigger</button>
				<button type="button" {@attach popover.trigger}>Second trigger</button>
			{/snippet}
			<button type="button">Inside shared popover</button>
		</Popover>
	{:else if scenario === 'popover-removable-trigger'}
		<Popover transition={zero} {onOpenChange}>
			{#snippet trigger(popover)}
				{#if triggerPresent}
					<button type="button" {@attach popover.trigger}>Removable trigger</button>
				{/if}
			{/snippet}
			<button type="button">Inside removable popover</button>
		</Popover>
	{:else if scenario === 'popover-hover'}
		<Popover
			openOnHover
			delay={0}
			transition={zero}
			trigger={{ content: 'Hover trigger', disabled: triggerDisabled }}
		>
			<button type="button">Inside hover popover</button>
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
	{:else if scenario === 'segmented'}
		<SegmentedControl label="Action" items={segments} defaultValue="Archive" />
	{:else if scenario === 'popup-menu'}
		<PopupMenu menu={{ items: menuItems }} transition={zero} trigger={{ content: 'Actions' }} />
	{:else if scenario === 'tooltip'}
		<button
			type="button"
			{@attach tooltip({ content: 'Tooltip content', delay: 0, transition: zero })}
			>Tooltip trigger</button
		>
	{:else if scenario === 'rating-read-only'}
		<RatingInput label="Score" name="score" defaultValue={3} {...undeclared({ readOnly: true })} />
	{:else if scenario === 'select-read-only'}
		<form data-testid="form">
			<Select
				label="Plan"
				name="plan"
				items={plans}
				defaultValue="pro"
				{...undeclared({ readOnly: true })}
			/>
		</form>
	{:else if scenario === 'select-disabled'}
		<form data-testid="form">
			<Select label="Plan" name="plan" items={plans} defaultValue="pro" disabled />
		</form>
	{/if}
</Theme>
