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
- value: bindable string value of the active tab (defaults to the first enabled tab's value).
- defaultValue: initial active tab value when value is omitted.
- onValueChange: called once per change with { value, item, index, reason } (\`TabsValueChangePayload\`). \`reason\` (\`TabsValueChangeReason\`) is \`user\` for a click, arrow key, menu entry or api navigation, and \`initial\`, \`disabled\` or \`missing\` for an automatic fallback (see Selection fallback). Not called when the current tab is re-selected or when value is changed externally.
- placement: top, bottom, left, or right. Also drives the default tabbar orientation.
- api: bindable TabsApi (a StepperState) for next(), previous(), and goTo(index). next() and previous() step over disabled tabs, as the arrow keys do; goTo() a disabled tab does nothing.
- transition: panel swap timing override (\`duration\` in ms, \`easing\`); responsive, and it beats the \`motion\` theme slot.
- tabbar: props forwarded to the inner Tabbar as one object — \`{ size, orientation, color, alignment, fullWidth, variant, scrollFade, label, activateOnFocus, class, theme }\`. \`orientation\` overrides the placement-derived default. \`activateOnFocus: false\` switches to manual activation (see below).
- mount: when a panel's content is created — \`lazy\` (default) on first activation and destroyed when the tab is left, \`once\` on first activation and kept, \`eager\` for every panel up front. Inactive panels are \`hidden\` and \`inert\` in every mode.
- class: extra classes for the root.
- theme: theme overrides for the Tabs wrapper.

## Selection fallback

The tab list and the panels always show the same tab. Tabs moves the selection by itself only when the change is its own; it then renders the new tab (also during SSR), writes its value back to value and calls onValueChange with the reason:

- \`initial\`: on mount, defaultValue named a disabled or unknown tab; the first enabled tab is selected.
- \`disabled\`: the selected tab became disabled; the first enabled tab is selected.
- \`missing\`: the selected tab was removed from items; its nearest enabled neighbour is selected (the tab that moved into its place first, then the one before it).

Omitting value and defaultValue selects the first enabled tab and reports nothing, including when items arrive after mount. A value the parent sets (on mount or later, by binding or by another control) is never rewritten: a value naming a disabled tab shows that tab, and a value naming no tab selects no tab and shows no panel until a tab with that value appears. When every tab is disabled, nothing can be selected instead, so a value naming one of them stays selected and an unknown value shows no panel.

## Manual activation

By default the arrow keys select the tab they move to. With \`tabbar={{ activateOnFocus: false }}\` they only move focus, and Enter, Space or a click opens the tab. Since \`mount\` defaults to \`lazy\`, selecting on focus builds and destroys a whole panel on every keypress; manual activation builds only the panel you open (APG recommends it when panels are costly).

## Activation direction

Tabs sets \`data-activation-direction\` on its root and on the active panel: where the active tab sits relative to the previously active one, along the tab list's axis. The value is \`left\` or \`right\` for a horizontal list (mirrored in a right-to-left document), \`up\` or \`down\` for a vertical one (\`placement\` left or right), and \`none\` until the selection first changes. A click, a key, \`api\` navigation and a change of the bound \`value\` all set it, in the same render as the new panel. Use it to style direction-aware panel animations, for example \`[data-activation-direction='right'] [role='tabpanel']:not([hidden])\`. It stays until the next change.

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
