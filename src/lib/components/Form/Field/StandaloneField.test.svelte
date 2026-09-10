<script lang="ts">
	import { Field, createFieldState } from './index.js';

	const field = createFieldState({
		id: 'standalone-control',
		type: 'text',
		required: true,
		value: '',
		errors: [],
		focused: false
	});
</script>

<Field {field} label="Standalone name">
	<input {...field.controlAttrs} {@attach field.control} bind:value={field.value} />
</Field>
<button type="button" onclick={() => field.validate()}>Validate</button>
