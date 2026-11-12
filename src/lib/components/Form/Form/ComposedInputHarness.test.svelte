<script lang="ts">
	import Theme from '../../Theme/Theme.svelte';
	import TextInput from '../TextInput/TextInput.svelte';
	import Form from './Form.svelte';
	import FormBoundary from './FormBoundary.svelte';
	import type { FormState } from './form.state.svelte.js';

	const inputs = { when: { type: 'test-composed', label: 'When' } } as const;

	let { onForm }: { onForm: (form: FormState<typeof inputs>) => void } = $props();
	let form = $state<FormState<typeof inputs>>();
	$effect(() => {
		if (form) onForm(form);
	});
</script>

<Theme>
	<Form {inputs} defaultValue={{ when: 'start' }} bind:form>
		<FormBoundary>
			<TextInput name="outside" inputAttrs={{ 'data-testid': 'outside' }} />
		</FormBoundary>
	</Form>
</Theme>
