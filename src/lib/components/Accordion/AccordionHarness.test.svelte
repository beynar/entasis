<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Accordion from './Accordion.svelte';
	import type { AccordionProps } from './accordion.props.js';

	type Item = Record<string, unknown>;
	let {
		nested = false,
		anchors = false,
		...props
	}: Omit<AccordionProps<Item>, 'items'> & {
		items?: Item[];
		/** Put a second accordion in the first item's panel. */
		nested?: boolean;
		/** Render each body with an anchor id and a link, for find-in-page and tab order checks. */
		anchors?: boolean;
	} = $props();

	const defaults: Item[] = [
		{ id: 'one', title: 'First', content: 'First body' },
		{ id: 'two', title: 'Second', content: 'Second body' },
		{ id: 'three', title: 'Third', content: 'Third body' }
	];
</script>

<Theme>
	{#snippet body({ item }: { item: Item })}
		<p id={`body-${item.id}`}>{item.title} body</p>
		<a href={`#link-${item.id}`}>{item.title} link</a>
	{/snippet}
	{#snippet innerContent()}
		<Accordion
			items={[
				{ id: 'inner-a', title: 'Inner A', content: 'Inner A body' },
				{ id: 'inner-b', title: 'Inner B', content: 'Inner B body' }
			]}
		/>
	{/snippet}
	<Accordion
		{...props}
		content={anchors ? body : undefined}
		items={nested
			? [{ id: 'outer', title: 'Outer', content: innerContent }, ...defaults.slice(1)]
			: (props.items ?? defaults)}
	/>
</Theme>
