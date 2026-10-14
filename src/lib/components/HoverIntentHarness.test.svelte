<script lang="ts">
	// Harness for `hover-intent.svelte.test.ts`: two hover popovers, two hover cards (the first
	// holding a tooltip trigger) and a page tooltip, all sharing the Theme's hover warm-up group.
	import Theme from './Theme/Theme.svelte';
	import Popover from './Popover/Popover.svelte';
	import HoverCard from './HoverCard/HoverCard.svelte';
	import { tooltip } from './Tooltip/tooltip.attachment.svelte.js';

	let {
		closeDelay,
		popoverDelay = 300,
		tooltipDelay = 300
	}: {
		/** Set to make popover A close on mouse leave after this many ms outside its safe area. */
		closeDelay?: number;
		popoverDelay?: number;
		tooltipDelay?: number;
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<input aria-label="Elsewhere" />
	<Popover
		openOnHover
		delay={popoverDelay}
		closeOnMouseLeave={closeDelay !== undefined}
		{closeDelay}
		lockScroll={false}
		transition={zero}
		trigger={{ content: 'Popover A' }}
	>
		<p>Popover A body</p>
	</Popover>
	<Popover
		openOnHover
		delay={popoverDelay}
		lockScroll={false}
		transition={zero}
		trigger={{ content: 'Popover B' }}
	>
		<p>Popover B body</p>
	</Popover>
	<HoverCard trigger="Card A" transition={zero}>
		<p>Card A body</p>
		<button
			type="button"
			{@attach tooltip({ content: 'Inner tip', delay: tooltipDelay, transition: zero })}
			>Inner tooltip</button
		>
	</HoverCard>
	<HoverCard trigger="Card B" transition={zero}>
		<p>Card B body</p>
	</HoverCard>
	<button
		type="button"
		{@attach tooltip({ content: 'Page tip', delay: tooltipDelay, transition: zero })}
		>Page tooltip</button
	>
	<button
		type="button"
		{@attach tooltip({ content: 'Second tip', delay: tooltipDelay, transition: zero })}
		>Second tooltip</button
	>
</Theme>
