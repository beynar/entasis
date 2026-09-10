export const stepperDescription = `
# Stepper Component

Stepper renders an ordered collection of panels with animated transitions, measured height changes, and programmatic navigation through StepperState.

## Usage

Use items for the collection and a single children snippet for the repeated panel content. The snippet receives the stepper state, the current item, and the zero-based index.

<script lang="ts">
	import { Stepper, type StepperState } from '$lib/components/Stepper';
	import { Button } from '$lib/components/Button';

	type Step = {
		title: string;
		description: string;
	};

	let activeStep = $state(0);
	let stepper = $state<StepperState<Step>>();

	const items: Step[] = [
		{ title: 'Account', description: 'Create the account.' },
		{ title: 'Profile', description: 'Complete the profile.' },
		{ title: 'Review', description: 'Confirm the details.' }
	];
</script>

<Stepper {items} bind:value={activeStep} bind:stepper>
	{#snippet children({ stepper, item, index })}
		<section class="space-y-4 p-6">
			<h2>{item.title}</h2>
			<p>{item.description}</p>
			<div class="flex gap-2">
				<Button disabled={index === 0} onclick={() => stepper.previous()}>
					Previous
				</Button>
				<Button disabled={index === items.length - 1} onclick={() => stepper.next()}>
					Next
				</Button>
			</div>
		</section>
	{/snippet}
</Stepper>

## Props

- items: required array of step data. Each item is passed to children as item.
- children: repeated snippet called for each panel with { stepper, item, index }.
- value: bindable zero-based active index. Use this as the public source of truth when syncing steppers.
- defaultValue: initial active index when value is omitted.
- stepper: bindable StepperState reference for next(), previous(), and goTo(index).
- onValueChange: called once with { value, item } when the active step changes.
- keyFramesOptions: Web Animations options used for the slide transition and timing. Default duration is 300ms.
- mode: classic or vertical.
- panelRole: "tabpanel", "group", or null. Defaults to "tabpanel"; use "group" for labelled question flows.
- panelAriaLabelledby: aria-labelledby value, callback, or false. Defaults to stepper-{index} when panelRole is "tabpanel".
- panelAriaLabel: aria-label value or callback for each panel.
- class: extra classes applied to the root container.

## StepperState

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
- Bind stepper when external controls need to call next(), previous(), or goTo(index).

## Accessibility

Stepper renders each panel with role="tabpanel" by default, marks inactive panels inert, disables pointer events on inactive panels, and keeps inactive panels out of the tab order. Use \`panelRole={null}\` with \`panelAriaLabelledby={false}\` when another primitive owns the semantics inside each panel.

## Theme Parts

- root: outer stepper container.
- container: animated grid that holds all panels.
- step: individual panel.

The theme supports the mode variant on root, container, and step.
`;
