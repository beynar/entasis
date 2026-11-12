<script lang="ts">
	import TextInput from '../TextInput/TextInput.svelte';
	import type { FormInputComponentProps } from './form.js';

	// An app-defined control that composes an entasis input, as Pyxel's InstantInput does.
	let { field }: FormInputComponentProps<'test-composed'> = $props();
</script>

<TextInput
	name="inner"
	value={field.value ?? null}
	inputAttrs={{ 'data-testid': 'composed-inner' }}
	onValueChange={(next) => field.setValue(next || null)}
/>
