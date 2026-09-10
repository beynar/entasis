export const multiStepFormDescription = `
# MultiStepForm

MultiStepForm owns one Form per step, displays them through Stepper, validates visited steps before navigation, and validates every step before final submission. Field names must be unique across steps.

## Basic usage

\`\`\`svelte
<script lang="ts">
	import {
		MultiStepForm,
		type FormStep,
		type MergedMultiStepFormInputs
	} from 'svelai/multi-step-form';
	import type { FormInputs, InferFormValue, LiveFormValue } from 'svelai/form';

	const accountInputs = {
		name: { type: 'text', label: 'Name', required: true },
		email: { type: 'email', label: 'Email', required: true }
	} satisfies FormInputs;
	const preferenceInputs = {
		newsletter: { type: 'switch', label: 'Newsletter' }
	} satisfies FormInputs;

	const items: [
		FormStep<typeof accountInputs>,
		FormStep<typeof preferenceInputs>
	] = [
		{
			title: 'Account',
			inputs: accountInputs
		},
		{
			title: 'Preferences',
			inputs: preferenceInputs
		}
	];

	type Inputs = MergedMultiStepFormInputs<typeof items>;
	let value = $state<LiveFormValue<Inputs>>({});
	let submitted = $state<InferFormValue<Inputs> | null>(null);
</script>

<MultiStepForm
	{items}
	bind:value
	onSubmitForm={(validatedValue) => {
		submitted = validatedValue;
	}}
/>
\`\`\`

## Props

- **items** (required): ordered FormStep array. Duplicate field names across steps throw.
- **value** (bindable): controlled partial values merged across all steps, synchronized in both directions.
- **defaultValue**: initial merged values when value is omitted.
- **onValueChange**: called when the merged live value changes.
- **onSubmitForm**: called with the validated merged payload on the final step only.
- **onSubmitStep**: receives one \`{ value, step, index }\` payload after the step's onBeforeChange. \`value\` contains validated values from visited steps; unvisited keys remain optional. Return false to block advancing.
- **showMeter**: whether to render the progress meter. Defaults to true.
- **meterColor**: meter color token. Defaults to neutral.
- **previousText**, **nextText**, **submitText**: navigation labels.
- **variant**: visual presentation of the multi-step shell. Card renders one shared Card surface around the fixed meter, transitioning step content, and navigation footer. Each step reuses Form's card spacing and edge-to-edge separator rules without creating another Card surface. Supports plain, sectioned, and card; defaults to plain.
- **previousButtonProps**, **nextButtonProps**, **submitButtonProps**: Button props. Custom click handlers are composed with internal behavior; disabled and loading protection cannot be overridden.
- **class**: additional classes on the root.
- **theme**: MultiStepForm theme overrides plus optional nested form theme overrides.

The **header**, **children**, and **footer** snippets receive the MultiStepFormState instance directly. Supplying a header or footer replaces that region's default meter or controls. In the card variant, header and footer content remains inside the shared card while only the active step content transitions.

## FormStep

\`\`\`ts
type FormStep<I extends FormInputs> = {
	title?: string;
	description?: string;
	inputs: I;
	onBeforeChange?: (context: {
		value: InferFormValue<I>;
		form: FormState<I>;
		next: () => void;
	}) => void | Promise<void>;
};
\`\`\`

When onBeforeChange is present, navigation remains blocked unless the hook calls next(). After permission is granted, onSubmitStep may still block by returning false.

## Submission behavior

- Next validates every visited step. Hooks do not run and the active step does not change when validation fails.
- Final submission validates every step before calling onSubmitForm; partial invalid data is never submitted.
- Enter follows Form's field-navigation behavior. A terminal Enter validates the current and visited steps, advances when permitted, and submits from the final step.
- Rejected hooks and submit handlers propagate their errors, while loading always resets.
- Concurrent calls to submit() share one active promise.

## MultiStepFormState

- **steps**: current step definitions.
- **stepper**: bound Stepper state, including value, next(), and previous().
- **value**: merged live partial value.
- **loading**: true while a navigation or final-submit hook is pending.
- **isLastStep**: whether the current step is final.
- **progress** and **meterSteps**: values used by the default meter.
- **submit()**: validates and advances or submits, returning the validated visited-step payload or false. The final-step result is the complete validated payload.
`;
