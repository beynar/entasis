<script lang="ts">
	// An app's own mention, as an `mdxComponents` entry: a chip that opens a card on hover.
	import Chip from '../Chip/Chip.svelte';
	import HoverCard from '../HoverCard/HoverCard.svelte';
	let { props = {} }: { props?: Record<string, unknown> } = $props();
	const CARD = { card: { base: 'w-72' }, trigger: { base: 'inline-flex align-middle' } };
</script>

{#snippet chip()}
	<Chip size="small" variant="soft" onclick={() => {}}>@{String(props.label)}</Chip>
{/snippet}

<HoverCard openOnClick position="top-start" theme={CARD} trigger={chip}>
	<div>Card</div>
</HoverCard>
