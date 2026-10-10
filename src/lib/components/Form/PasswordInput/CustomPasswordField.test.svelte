<script lang="ts">
	// A Form entry with its own password control (`type: 'field', fieldType: 'password'`), so tests
	// can check that the built-in password schema still applies outside PasswordInput.
	import Theme from '../../Theme/Theme.svelte';
	import type { FieldState } from '../Field/field.state.svelte.js';
	import Form from '../Form/Form.svelte';
	import type { FormState } from '../Form/form.state.svelte.js';

	let {
		onSubmit,
		onForm
	}: {
		onSubmit: (value: { secret?: string | null }) => void;
		onForm?: (form: FormState) => void;
	} = $props();
</script>

{#snippet control(field: FieldState<'password'>)}
	<input type="password" {...field.controlAttrs} {@attach field.control} bind:value={field.value} />
{/snippet}

<Theme>
	<Form
		inputs={{
			secret: {
				type: 'field',
				fieldType: 'password',
				label: 'Secret',
				required: true,
				snippet: control
			}
		}}
		{onSubmit}
	>
		{#snippet children(form)}
			<button
				type="button"
				{@attach () => onForm?.(form as FormState)}
				onclick={() => form.submit()}>Submit</button
			>
		{/snippet}
	</Form>
</Theme>
