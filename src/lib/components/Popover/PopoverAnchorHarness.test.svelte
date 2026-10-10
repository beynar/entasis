<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import type { PopoverProps } from './popover.props.js';

	let {
		defaultOpen = false,
		openOnHover = false,
		delay,
		mobileSheet = false,
		inline = false,
		showTrigger = true,
		triggerKey = 0,
		showPopover = true,
		externalRef = false,
		boundRef = false,
		showAnchor = true,
		onOpenChange
	}: Pick<
		PopoverProps,
		'defaultOpen' | 'openOnHover' | 'delay' | 'mobileSheet' | 'inline' | 'onOpenChange'
	> & {
		/** Render the snippet trigger; false unmounts it while the popover lives on. */
		showTrigger?: boolean;
		/** Changing it re-creates the trigger element in the same flush. */
		triggerKey?: number;
		/** Render the Popover component itself. */
		showPopover?: boolean;
		/** Anchor to a separate `ref` element instead of a trigger snippet. */
		externalRef?: boolean;
		/**
		 * Anchor to a `bind:this` ref the popover outlives: `showAnchor` unmounts the element, and
		 * Svelte resets the bound ref to null.
		 */
		boundRef?: boolean;
		showAnchor?: boolean;
	} = $props();

	let anchor = $state<HTMLElement | null>(null);
	let boundAnchor = $state<HTMLElement | null>(null);
	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	{#if boundRef}
		{#if showAnchor}
			<span data-testid="bound-anchor" bind:this={boundAnchor}>Bound anchor</span>
		{/if}
		<Popover trigger={false} defaultOpen ref={boundAnchor} transition={zero} {onOpenChange}>
			<button type="button">Inside bound popover</button>
		</Popover>
	{:else if externalRef}
		<span data-testid="anchor" bind:this={anchor}>Anchor</span>
		{#if anchor}
			<Popover trigger={false} open ref={anchor} transition={zero} {onOpenChange}>
				<button type="button">Inside anchored popover</button>
			</Popover>
		{/if}
	{:else if showPopover}
		<Popover
			{defaultOpen}
			{openOnHover}
			{delay}
			{mobileSheet}
			{inline}
			{onOpenChange}
			transition={zero}
		>
			{#snippet trigger(popover)}
				{#if showTrigger}
					{#key triggerKey}
						<button type="button" onclick={popover.toggle} {@attach popover.reference}>
							Anchor trigger
						</button>
					{/key}
				{/if}
			{/snippet}
			<button type="button">Inside popover</button>
		</Popover>
	{/if}
</Theme>
