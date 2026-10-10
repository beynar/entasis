<script lang="ts">
	// A Form holding one password entry, so tests can run the field's validation through submit.
	import Theme from '../../Theme/Theme.svelte';
	import Form from '../Form/Form.svelte';
	import { setI18n } from '$lib/i18n/context.svelte.js';
	import type { Messages } from '$lib/i18n/en.js';
	import type { PasswordInputAutocomplete } from './passwordInput.props.js';

	let {
		autocomplete,
		minLength,
		required = true,
		messages,
		onValidate,
		onSubmit
	}: {
		autocomplete?: PasswordInputAutocomplete;
		minLength?: number;
		required?: boolean;
		messages?: Partial<Messages>;
		onValidate?: (value: string) => string | null | undefined;
		onSubmit: (value: { password?: string | null }) => void;
	} = $props();

	setI18n(() => messages ?? {});
</script>

<Theme>
	<Form
		inputs={{
			password: {
				type: 'password',
				label: 'Password',
				required,
				autocomplete,
				minLength,
				onValidate
			}
		}}
		{onSubmit}
	>
		{#snippet children(form)}
			<button type="button" onclick={() => form.submit()}>Submit</button>
		{/snippet}
	</Form>
</Theme>
