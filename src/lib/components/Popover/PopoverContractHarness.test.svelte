<script lang="ts">
	// Harness for `popover.contract.svelte.test.ts`: how a popover was opened (MN-4), which
	// trigger owns it and where focus returns (CX-4), handler composition, and the wrapper of a
	// non-dialog popup (MN-10). Zero-length transitions throughout.
	import Theme from '../Theme/Theme.svelte';
	import Button from '../Button/Button.svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import Popover from './Popover.svelte';
	import type { OpenChangeHandler } from '$lib/utils/openChange.js';

	type Scenario =
		| 'hover'
		| 'hover-open-call'
		| 'wrapper-trigger'
		| 'programmatic'
		| 'loading-trigger'
		| 'prevented-snippet'
		| 'two-triggers'
		| 'menu'
		| 'popup-menu';

	let {
		scenario,
		onOpenChange,
		secondPresent = true,
		firstPresent = true
	}: {
		scenario: Scenario;
		onOpenChange?: OpenChangeHandler;
		/** `two-triggers`: whether each trigger is still rendered. */
		firstPresent?: boolean;
		secondPresent?: boolean;
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	let programmaticOpen = $state(false);
</script>

<Theme>
	<p data-testid="outside">Outside</p>

	{#if scenario === 'hover'}
		<Popover
			openOnHover
			delay={0}
			closeOnMouseLeave
			transition={zero}
			trigger={{ content: 'Hover trigger' }}
			{onOpenChange}
		>
			{#snippet children(popover)}
				<p data-testid="reason">{popover.openReason}</p>
			{/snippet}
		</Popover>
	{:else if scenario === 'hover-open-call'}
		<!-- A submenu trigger: its click calls open(), never toggle(). -->
		<Popover openOnHover delay={0} closeOnMouseLeave transition={zero} {onOpenChange}>
			{#snippet trigger(popover)}
				<button type="button" onclick={() => popover.open()} {@attach popover.reference}
					>Submenu trigger</button
				>
			{/snippet}
			{#snippet children(popover)}
				<p data-testid="reason">{popover.openReason}</p>
			{/snippet}
		</Popover>
	{:else if scenario === 'wrapper-trigger'}
		<!-- A field wrapper anchors the panel; the control inside it toggles (PhoneInput's country
		     picker). -->
		<Popover transition={zero} focusOnOpen="first" {onOpenChange}>
			{#snippet trigger(popover)}
				<div data-testid="wrapper" {@attach popover.reference}>
					<button type="button" onclick={popover.toggle}>Country</button>
					<input aria-label="Phone" />
				</div>
			{/snippet}
			<input aria-label="Search countries" />
		</Popover>
	{:else if scenario === 'programmatic'}
		<button type="button" onclick={() => (programmaticOpen = true)}>Open from elsewhere</button>
		<Popover
			bind:open={programmaticOpen}
			transition={zero}
			focusOnOpen="first"
			trigger={{ content: 'Anchor' }}
			{onOpenChange}
		>
			{#snippet children(popover)}
				<button type="button">Inside programmatic</button>
				<p data-testid="reason">{popover.openReason}</p>
			{/snippet}
		</Popover>
	{:else if scenario === 'loading-trigger'}
		<Popover transition={zero} {onOpenChange}>
			{#snippet trigger(popover)}
				<Button loading {@attach popover.trigger}>Share</Button>
			{/snippet}
			<button type="button">Inside loading</button>
		</Popover>
	{:else if scenario === 'prevented-snippet'}
		<Popover transition={zero} {onOpenChange}>
			{#snippet trigger(popover)}
				<button type="button" onclick={(event) => event.preventDefault()} {@attach popover.trigger}
					>Guarded</button
				>
			{/snippet}
			<button type="button">Inside guarded</button>
		</Popover>
	{:else if scenario === 'two-triggers'}
		<Popover transition={zero} {onOpenChange}>
			{#snippet trigger(popover)}
				{#if firstPresent}
					<button type="button" {@attach popover.trigger}>First</button>
				{/if}
				{#if secondPresent}
					<button type="button" {@attach popover.trigger}>Second</button>
				{/if}
			{/snippet}
			{#snippet children(popover)}
				<p data-testid="anchor">{popover.activeTrigger?.textContent}</p>
			{/snippet}
		</Popover>
	{:else if scenario === 'menu'}
		<Popover haspopup="menu" transition={zero} trigger={{ content: 'Actions' }}>
			<div role="menu">
				<button type="button" role="menuitem">Rename</button>
			</div>
		</Popover>
	{:else}
		<PopupMenu
			transition={zero}
			trigger={{ content: 'File' }}
			menu={{ items: [{ type: 'option', title: 'New file' }] }}
		/>
	{/if}
</Theme>
