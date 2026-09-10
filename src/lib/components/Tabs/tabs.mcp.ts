export const tabsDescription = `
# Tabs Component

Tabs combines Tabbar navigation with Stepper-powered animated panels.

## Usage

Use items for the tab collection and a single children snippet for the repeated panel content. The snippet receives the internal stepper state, the current item, and the zero-based index.

<script lang="ts">
	import { Tabs } from '$lib/components/Tabs';

	const items = [
		{ label: 'Overview', title: 'Overview', body: 'A summary of the current workspace.' },
		{ label: 'Activity', title: 'Activity', body: 'Recent events and changes.' },
		{ label: 'Settings', title: 'Settings', body: 'Configuration for this resource.' }
	];
</script>

<Tabs {items} bind:value>
	{#snippet children({ item, index, stepper })}
		<section class="space-y-3 p-6">
			<p class="text-sm text-neutral/60">Panel {index + 1}</p>
			<h2>{item.title}</h2>
			<p>{item.body}</p>
			<button onclick={() => stepper.goTo(0)}>Back to overview</button>
		</section>
	{/snippet}
</Tabs>

## Props

- items: required array of TabItem values. Each item is used by Tabbar and passed to children as item.
- children: repeated panel renderer called with { stepper, item, index }.
- value: bindable zero-based active tab index.
- defaultValue: initial active tab index when value is omitted.
- onValueChange: called once with the new active tab index.
- placement: top, bottom, left, or right. Also drives the default tabbar orientation.
- stepper: bindable StepperState reference for next(), previous(), and goTo(index).
- keyFramesOptions: Web Animations timing for the panel transition.
- tabbarSize: small, normal, or large.
- tabbarOrientation: horizontal or vertical. Overrides the placement-derived default.
- tabbarColor: color token for the tabbar.
- tabbarAlignment: start, center, or end.
- tabbarFullWidth: expand tabs across the available width.
- tabbarClass: extra classes for the Tabbar.
- tabbarTheme: theme overrides for the Tabbar.
- class: extra classes for the root.
- theme: theme overrides for the Tabs wrapper.

## Composition Rules

- Render panel content through children.
- Put per-panel differences in the item data and branch inside children when needed.
- Use value as the public controlled state.
- Use stepper only when external controls need programmatic navigation.

## Structure

Tabs renders a Tabbar next to a Stepper. Tabbar owns the clickable tab controls; Stepper owns the animated panel track.

## Theme Parts

- root: wrapper around the Tabbar and panel content.
- content: Stepper wrapper for tab panels.

The theme supports the placement variant on root and content.
`;
