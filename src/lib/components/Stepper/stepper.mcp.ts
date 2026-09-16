export const stepperDescription = `
# Stepper Component

Stepper renders an ordered collection of panels with animated transitions, measured height changes, and programmatic navigation through StepperState.

## Usage

Use items for the collection and a single children snippet for the repeated panel content. The snippet receives the instance handle as api, the current item, and the zero-based index.

<script lang="ts">
	import { Stepper, type StepperApi } from '$lib/components/Stepper';
	import { Button } from '$lib/components/Button';

	type Step = {
		title: string;
		description: string;
	};

	let activeStep = $state(0);
	let api = $state<StepperApi<Step>>();

	const items: Step[] = [
		{ title: 'Account', description: 'Create the account.' },
		{ title: 'Profile', description: 'Complete the profile.' },
		{ title: 'Review', description: 'Confirm the details.' }
	];
</script>

<Stepper {items} bind:value={activeStep} bind:api>
	{#snippet children({ api, item, index })}
		<section class="space-y-4 p-6">
			<h2>{item.title}</h2>
			<p>{item.description}</p>
			<div class="flex gap-2">
				<Button disabled={index === 0} onclick={() => api.previous()}>
					Previous
				</Button>
				<Button disabled={index === items.length - 1} onclick={() => api.next()}>
					Next
				</Button>
			</div>
		</section>
	{/snippet}
</Stepper>

## Props

- items: required array of step data. Each item is passed to children as item.
- children: repeated snippet called for each panel with { api, item, index }.
- value: bindable zero-based active index. Use this as the public source of truth when syncing steppers.
- defaultValue: initial active index when value is omitted.
- api: bindable StepperApi (a StepperState) for next(), previous(), and goTo(index).
- onValueChange: called once with { value, item, index } when the active step changes. Same payload shape as Tabs; value and index are both the zero-based step index.
- transition: step translation timing override (\`duration\` in ms, \`easing\`); responsive, and it beats the \`motion\` theme slot. The default is the \`slow\` duration token (300ms).
- theme: theme overrides for the stepper parts, including its \`motion\` slot.
- mode: classic or vertical.
- panelRole: "tabpanel", "group", or null. Defaults to "tabpanel"; use "group" for labelled question flows.
- panelAriaLabelledby: aria-labelledby value, callback, or false. Defaults to stepper-{index} when panelRole is "tabpanel".
- panelAriaLabel: aria-label value or callback for each panel.
- panelId: (index) => string giving each panel a DOM id so a tab can reference it with aria-controls. Tabs uses it to link Tabbar tabs to their panels.
- mount: when a step's content is created — \`eager\` (default) for every step up front, \`lazy\` on first activation and destroyed once the slide away from it finishes, \`once\` on first activation and kept. Inactive panels are \`inert\` and \`aria-hidden\` at once and \`hidden\` as soon as the slide settles, so at rest exactly one panel is not \`hidden\`. Tabs forwards its own \`mount\`, which defaults to \`lazy\`.
- class: extra classes applied to the root container.

## StepperApi (StepperState)

- next(): move to the next item when one exists.
- previous(): move to the previous item when one exists.
- goTo(index): request a specific zero-based step.
- syncActiveStep(index): internal synchronization path used by the component when value changes.
- value: current public active index.
- items: current item array.
- stepHeights: measured panel heights used for smooth height transitions.

## Composition Rules

- Render repeated step content through the children snippet.
- Put per-step differences in the item data and branch inside children when needed.
- Bind value when the parent or another Stepper controls the current step.
- Bind api when external controls need to call next(), previous(), or goTo(index).

## Accessibility

Stepper renders each panel with role="tabpanel" by default, marks inactive panels inert and \`aria-hidden\` (and \`hidden\` once the slide settles), disables pointer events on inactive panels, and keeps inactive panels out of the tab order, so only the active panel reaches the text and accessibility layers. Use \`panelRole={null}\` with \`panelAriaLabelledby={false}\` when another primitive owns the semantics inside each panel.

## Theme Parts

- root: outer stepper container.
- container: animated grid that holds all panels.
- step: individual panel.

The theme supports the mode variant on root, container, and step.

## Motion

- **motion** theme slot: one preset (no variants) whose \`duration\` / \`easing\` drive the Web
  Animations step translation and the matching CSS height/opacity transitions.
- Ladder: \`<Theme components={{ stepper: { motion } }}>\` → \`setStepperTheme({ motion })\` →
  \`theme.motion\` → the \`transition\` prop (how Tabs forwards its own preset).
- A resolved duration of 0 (reduced motion, or \`duration: 'instant'\`) snaps between steps.
`;
