<script lang="ts">
	// A Button beside a number field, whose stepper buttons are the field's own.
	import Button from './Button.svelte';
	import Form from '../Form/Form/Form.svelte';
	import Theme from '../Theme/Theme.svelte';
</script>

<Theme webmcp>
	<Form inputs={{ seats: { type: 'number', label: 'Seats' } }} />
	<Button>Outside</Button>
</Theme>
