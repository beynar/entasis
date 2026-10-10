<script lang="ts">
	import type { FormInputComponentProps } from './form.js';

	// An app-defined control, written the way a consumer writes one: it renders the control alone
	// and reports edits through the field Form registered for it.
	let { field, currencies = ['EUR'] }: FormInputComponentProps<'test-money'> = $props();
	const currency = $derived(field.value?.currency ?? currencies[0] ?? 'EUR');
</script>

<input
	type="number"
	{...field.controlAttrs}
	{@attach field.control}
	data-testid="money-amount"
	value={field.value?.amount ?? ''}
	oninput={(event) => {
		const raw = event.currentTarget.value;
		field.setValue(raw === '' ? null : { amount: Number(raw), currency });
	}}
/>
<select
	aria-label="Currency"
	value={currency}
	onchange={(event) =>
		field.setValue({ amount: field.value?.amount ?? 0, currency: event.currentTarget.value })}
>
	{#each currencies as option (option)}
		<option value={option}>{option}</option>
	{/each}
</select>
