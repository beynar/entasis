<script lang="ts">
	// Harness for multiStepForm.svelte.test.ts: two steps inside a Theme, with the step and
	// submit handlers and the first step's validator supplied by the test.
	import Theme from '../../Theme/Theme.svelte';
	import MultiStepForm from './MultiStepForm.svelte';

	let {
		onValidate,
		onSubmitStep,
		onSubmitForm
	}: {
		onValidate?: (value: string) => string | null | Promise<string | null>;
		onSubmitStep?: () => void | boolean | Promise<void | boolean>;
		onSubmitForm?: () => void | Promise<void>;
	} = $props();
</script>

<Theme>
	<MultiStepForm
		showMeter={false}
		items={[
			{
				title: 'Account',
				inputs: { name: { type: 'text', label: 'Name', required: true, onValidate } }
			},
			{ title: 'Contact', inputs: { email: { type: 'email', label: 'Email' } } }
		]}
		{onSubmitStep}
		{onSubmitForm}
	/>
</Theme>
