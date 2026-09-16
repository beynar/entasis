export const tabsDescription = `
# Tabs Component

Tabs combines Tabbar navigation with Stepper-powered animated panels.

## Usage

Use items for the tab collection and a single children snippet for the repeated panel content. The snippet receives the instance handle as api, the current item, and the zero-based index. The active tab is addressed by its string value (an item's \`value\`, else its string label).

<script lang="ts">
	import { Tabs } from '$lib/components/Tabs';

	const items = [
		{ value: 'overview', label: 'Overview', title: 'Overview', body: 'A summary of the current workspace.' },
		{ value: 'activity', label: 'Activity', title: 'Activity', body: 'Recent events and changes.' },
		{ value: 'settings', label: 'Settings', title: 'Settings', body: 'Configuration for this resource.' }
	];
	let value = $state('overview');
</script>

<Tabs {items} bind:value tabbar={{ size: 'small', color: 'secondary', fullWidth: true }}>
	{#snippet children({ item, index, api })}
		<section class="space-y-3 p-6">
			<p class="text-sm text-neutral/70">Panel {index + 1}</p>
			<h2>{item.title}</h2>
			<p>{item.body}</p>
			<button onclick={() => api.goTo(0)}>Back to overview</button>
		</section>
	{/snippet}
</Tabs>

## Props

- items: required array of TabItem values. Each item is used by Tabbar and passed to children as item. A string item is its own value; an object item resolves to its \`value\`, else its string label, else its index as a string.
- children: repeated panel renderer called with { api, item, index }.
- value: bindable string value of the active tab (defaults to the first tab's value).
- defaultValue: initial active tab value when value is omitted.
- onValueChange: called once per change with { value, item, index }; not called when the current tab is re-selected or when value is changed externally.
- placement: top, bottom, left, or right. Also drives the default tabbar orientation.
- api: bindable TabsApi (a StepperState) for next(), previous(), and goTo(index).
- transition: panel swap timing override (\`duration\` in ms, \`easing\`); responsive, and it beats the \`motion\` theme slot.
- tabbar: props forwarded to the inner Tabbar as one object — \`{ size, orientation, color, alignment, fullWidth, variant, scrollFade, label, class, theme }\`. \`orientation\` overrides the placement-derived default.
- mount: when a panel's content is created — \`lazy\` (default) on first activation and destroyed when the tab is left, \`once\` on first activation and kept, \`eager\` for every panel up front. Inactive panels are \`hidden\` and \`inert\` in every mode.
- class: extra classes for the root.
- theme: theme overrides for the Tabs wrapper.

## Composition Rules

- Render panel content through children.
- Put per-panel differences in the item data and branch inside children when needed.
- Use value (a string) as the public controlled state; compare against item values, not indexes.
- Use api only when external controls need programmatic navigation.

## Structure

Tabs renders a Tabbar next to a Stepper. Tabbar owns the clickable tab controls; Stepper owns the animated panel track.

## Accessibility

Tabs wires the tablist to its panels: every tab has an id (\`{id}-tabs-tab-{index}\`), \`aria-selected\`, and \`aria-controls\`; every panel renders with role="tabpanel", id \`{id}-tabs-panel-{index}\`, and \`aria-labelledby\` pointing back at its tab. Inactive panels are \`hidden\`, inert and out of the tab order, so only the active panel reaches the text and accessibility layers.

## Theme Parts

- root: wrapper around the Tabbar and panel content.
- content: Stepper wrapper for tab panels.

The theme supports the placement variant on root and content.

## Motion

- **motion** theme slot: one preset (no variants) for the panel swap; the resolved
  \`{ in, out }\` is forwarded to the inner Stepper's \`transition\`, where it wins.
- Ladder: \`<Theme components={{ tabs: { motion } }}>\` → \`setTabsTheme({ motion })\` →
  \`theme.motion\` → the \`transition\` prop. Reduced motion snaps between panels.
`;
