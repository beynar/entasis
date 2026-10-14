<script lang="ts">
	// Harness for `hoverCard.svelte.test.ts`: one card, and a card with another card in its content.
	import Theme from '../Theme/Theme.svelte';
	import HoverCard from './HoverCard.svelte';
	import type { HoverCardProps } from './hoverCard.props.js';

	let {
		scenario,
		card = {},
		innerCard = {}
	}: {
		scenario: 'single' | 'nested' | 'sibling' | 'wrap';
		card?: Partial<HoverCardProps>;
		innerCard?: Partial<HoverCardProps>;
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<input aria-label="Elsewhere" />
	{#if scenario === 'single'}
		<HoverCard trigger="Card trigger" transition={zero} {...card}>
			<p>Card body</p>
		</HoverCard>
	{:else if scenario === 'wrap'}
		{#snippet wrapped()}
			<a href="#wrapped">documentation about wrapping cards in paragraphs</a>
		{/snippet}
		<p style="width: 220px; font: 16px/24px sans-serif; margin: 160px 40px">
			Read the
			<HoverCard
				trigger={wrapped}
				delay={0}
				closeDelay={0}
				position="bottom"
				offset={4}
				transition={zero}
				{...card}
			>
				<p>Card body</p>
			</HoverCard>
			and keep reading afterwards.
		</p>
	{:else if scenario === 'sibling'}
		<HoverCard trigger="First card" transition={zero} {...card}>
			<p>First body</p>
		</HoverCard>
		<HoverCard trigger="Second card" transition={zero} {...card}>
			<p>Second body</p>
		</HoverCard>
	{:else}
		<HoverCard trigger="Outer trigger" transition={zero} {...card}>
			<p>Outer body</p>
			<HoverCard trigger="Inner trigger" transition={zero} {...innerCard}>
				<p>Inner body</p>
			</HoverCard>
		</HoverCard>
	{/if}
</Theme>
