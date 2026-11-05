<script lang="ts">
	// Test-only: a TimeInput whose value also moves from outside, alone and inside a Form.
	import Theme from '../../Theme/Theme.svelte';
	import Form from '../Form/Form.svelte';
	import type { TimeInputProps } from './timeInput.props.js';
	import TimeInput from './TimeInput.svelte';

	let {
		value: initial = null,
		formStart,
		as,
		format
	}: Pick<TimeInputProps, 'as' | 'format'> & {
		value?: number | null;
		formStart?: number;
	} = $props();
	// svelte-ignore state_referenced_locally
	let value = $state<number | null | undefined>(initial);
	// svelte-ignore state_referenced_locally
	let form = $state<{ start?: number | null; title?: string | null }>(
		formStart === undefined ? {} : { start: formStart }
	);
	const inputs = {
		start: { type: 'time' as const, label: 'Form field' },
		title: { type: 'text' as const, label: 'Title' }
	};
</script>

<Theme>
	<button type="button" data-testid="noon" onclick={() => (value = 12 * 3600000)}>Noon</button>
	<button type="button" data-testid="midnight" onclick={() => (value = 0)}>Midnight</button>
	<button type="button" data-testid="clear" onclick={() => (value = null)}>Clear</button>
	<button
		type="button"
		data-testid="form-now"
		onclick={() => (form = { start: 9.5 * 3600000, title: 'Set' })}
	>
		Now
	</button>
	<output data-testid="value">{String(value)}</output>
	<TimeInput label="Field" bind:value {as} {format} />
	<Form {inputs} bind:value={form} />
</Theme>
