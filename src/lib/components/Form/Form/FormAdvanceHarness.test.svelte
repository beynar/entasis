<script lang="ts">
	// A Form with a custom choice control whose Enter key moves on like a text field: inside an
	// entasis Form through FormState.advanceFrom, inside a plain <form> through requestNativeSubmit.
	import { requestNativeSubmit } from '$lib/utils/requestNativeSubmit.js';
	import Theme from '../../Theme/Theme.svelte';
	import type { FieldState } from '../Field/field.state.svelte.js';
	import Form from './Form.svelte';
	import type { FormState } from './form.state.svelte.js';

	let {
		form = $bindable(),
		notesDisabled = false,
		onSubmit,
		onNativeSubmit
	}: {
		form?: FormState;
		notesDisabled?: boolean;
		onSubmit?: (value: unknown) => void;
		onNativeSubmit?: () => void;
	} = $props();

	const onEnter = (event: KeyboardEvent, field: FieldState<'checkbox'>) => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		if (!field.form?.advanceFrom(field)) requestNativeSubmit(event.currentTarget as Element);
	};
</script>

{#snippet choice(field: FieldState<'checkbox'>)}
	<button
		type="button"
		role="checkbox"
		aria-checked={Boolean(field.value)}
		{@attach field.control}
		onclick={() => field.setValue(!field.value)}
		onkeydown={(event) => onEnter(event, field)}
	>
		Subscribe
	</button>
{/snippet}

<Theme>
	<Form
		bind:form
		inputs={{
			name: { type: 'text', label: 'Name', required: true },
			subscribe: { type: 'field', fieldType: 'checkbox', label: 'Subscribe', snippet: choice },
			notes: { type: 'text', label: 'Notes', disabled: notesDisabled },
			hidden: { type: 'text', label: 'Hidden', visible: false }
		}}
		{onSubmit}
	/>
	<form
		data-testid="native-form"
		onsubmit={(event) => {
			event.preventDefault();
			onNativeSubmit?.();
		}}
	>
		<button
			type="button"
			role="checkbox"
			aria-checked="false"
			onkeydown={(event) => {
				if (event.key !== 'Enter') return;
				event.preventDefault();
				requestNativeSubmit(event.currentTarget);
			}}
		>
			Native choice
		</button>
		<button type="submit">Send</button>
	</form>
</Theme>
