<script lang="ts">
	import type { FormInputComponentProps } from 'entasis/form';

	let { field, currencies = ['EUR', 'USD', 'GBP'] }: FormInputComponentProps<'money'> = $props();
	const currency = $derived(field.value?.currency ?? currencies[0] ?? 'EUR');
	const control =
		'h-control-md rounded-md border border-neutral-muted bg-surface px-md text-sm text-neutral outline-none focus-visible:ring-2 focus-visible:ring-focus/50 disabled:opacity-50';
</script>

<input
	type="number"
	inputmode="decimal"
	min="0"
	step="0.01"
	class="{control} min-w-0 flex-1"
	{...field.controlAttrs}
	{@attach field.control}
	value={field.value?.amount ?? ''}
	oninput={(event) => {
		const raw = event.currentTarget.value;
		field.setValue(raw === '' ? null : { amount: Number(raw), currency });
	}}
/>
<select
	aria-label="Currency"
	class={control}
	disabled={field.disabled}
	value={currency}
	onchange={(event) =>
		field.setValue({ amount: field.value?.amount ?? 0, currency: event.currentTarget.value })}
>
	{#each currencies as option (option)}
		<option value={option}>{option}</option>
	{/each}
</select>
