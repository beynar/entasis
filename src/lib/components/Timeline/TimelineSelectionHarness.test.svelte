<script lang="ts">
	// A selectable timeline between two plain buttons, with its bound value and its changes written
	// out. `custom` swaps in an item snippet that renders its own title and a link.
	import Timeline from './Timeline.svelte';
	import type {
		TimelineItem,
		TimelineOrientation,
		TimelineValue,
		TimelineVariant
	} from './timeline.props.js';

	let {
		items,
		orientation = 'horizontal',
		variant = 'ghost',
		custom = false,
		dir,
		value = $bindable<TimelineValue | undefined>(undefined),
		changes = $bindable<string[]>([])
	}: {
		items: TimelineItem[];
		orientation?: TimelineOrientation;
		variant?: TimelineVariant;
		custom?: boolean;
		dir?: 'ltr' | 'rtl';
		value?: TimelineValue;
		changes?: string[];
	} = $props();
</script>

<button type="button">Before</button>
<div {dir}>
	{#if custom}
		<Timeline
			{items}
			{orientation}
			{variant}
			selectable
			bind:value
			onValueChange={({ value: next, index }) => changes.push(`${next}@${index}`)}
			aria-label="Steps"
		>
			{#snippet item({ item, titleId, selected, select })}
				<h3 id={titleId} data-testid="custom-title">{item.title}</h3>
				<a href="#details" data-testid="custom-link">Details</a>
				<span data-testid="custom-state">{selected ? 'selected' : 'idle'}</span>
				<button type="button" data-testid="custom-select" onclick={select}>Open</button>
			{/snippet}
		</Timeline>
	{:else}
		<Timeline
			{items}
			{orientation}
			{variant}
			selectable
			bind:value
			onValueChange={({ value: next, index }) => changes.push(`${next}@${index}`)}
			aria-label="Steps"
		/>
	{/if}
</div>
<button type="button">After</button>
<output data-testid="value">{value ?? ''}</output>
<output data-testid="changes">{changes.join(',')}</output>
