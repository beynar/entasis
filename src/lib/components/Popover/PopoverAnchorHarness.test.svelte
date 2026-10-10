<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import type { PopoverProps } from './popover.props.js';

	let {
		defaultOpen = false,
		openOnHover = false,
		delay,
		showTrigger = true,
		triggerKey = 0,
		showPopover = true,
		externalRef = false,
		onOpenChange
	}: Pick<PopoverProps, 'defaultOpen' | 'openOnHover' | 'delay' | 'onOpenChange'> & {
		/** Render the snippet trigger; false unmounts it while the popover lives on. */
		showTrigger?: boolean;
		/** Changing it re-creates the trigger element in the same flush. */
		triggerKey?: number;
		/** Render the Popover component itself. */
		showPopover?: boolean;
		/** Anchor to a separate `ref` element instead of a trigger snippet. */
		externalRef?: boolean;
	} = $props();

	let anchor = $state<HTMLElement | null>(null);
	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	{#if externalRef}
		<span data-testid="anchor" bind:this={anchor}>Anchor</span>
		{#if anchor}
			<Popover trigger={false} open ref={anchor} transition={zero} {onOpenChange}>
				<button type="button">Inside anchored popover</button>
			</Popover>
		{/if}
	{:else if showPopover}
		<Popover {defaultOpen} {openOnHover} {delay} {onOpenChange} transition={zero}>
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
