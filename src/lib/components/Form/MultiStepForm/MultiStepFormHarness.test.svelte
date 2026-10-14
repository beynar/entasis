<script lang="ts">
	// Harness for multiStepForm.svelte.test.ts: two steps inside a Theme, with the step and
	// submit handlers and the first step's validator supplied by the test.
	import Theme from '../../Theme/Theme.svelte';
	import MultiStepForm from './MultiStepForm.svelte';

	let {
		onValidate,
		onSubmitStep,
		onSubmitForm,
		validationMode,
		roleDisabled = false
	}: {
		onValidate?: (value: string) => string | null | Promise<string | null>;
		onSubmitStep?: () => void | boolean | Promise<void | boolean>;
		onSubmitForm?: (value: unknown) => void | Promise<void>;
		validationMode?: 'submit' | 'blur' | 'change';
		/** Adds a disabled, required field to the first step. */
		roleDisabled?: boolean;
	} = $props();
</script>

<Theme>
	<MultiStepForm
		showMeter={false}
		items={[
			{
				title: 'Account',
				inputs: {
					name: { type: 'text', label: 'Name', required: true, onValidate },
					...(roleDisabled
						? { role: { type: 'text', label: 'Role', required: true, disabled: true } }
						: {})
				}
			},
			{ title: 'Contact', inputs: { email: { type: 'email', label: 'Email' } } }
		]}
		{onSubmitStep}
		{onSubmitForm}
		{validationMode}
	/>
</Theme>
