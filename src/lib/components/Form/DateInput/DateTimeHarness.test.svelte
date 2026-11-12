<script lang="ts">
	import Theme from '../../Theme/Theme.svelte';
	import Form from '../Form/Form.svelte';
	import DateInput from './DateInput.svelte';

	let {
		value = null,
		timeZone,
		type = 'datetime',
		onValueChange,
		inForm = false,
		onFormValue
	}: {
		value?: Date | null;
		timeZone?: string;
		type?: 'date' | 'datetime';
		onValueChange?: (value: Date | null) => void;
		inForm?: boolean;
		onFormValue?: (value: unknown) => void;
	} = $props();

	const inputs = { when: { type: 'datetime', label: 'When', timeZone: 'Europe/Paris' } } as const;
</script>

<Theme>
	{#if inForm}
		<Form {inputs} onValueChange={onFormValue} />
	{:else}
		<DateInput label="When" {type} {value} {timeZone} {onValueChange} />
	{/if}
</Theme>
