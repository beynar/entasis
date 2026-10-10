<script lang="ts">
	import type { FormInputComponentProps } from 'entasis/form';

	let { field, currencies = ['EUR'] }: FormInputComponentProps<'money'> = $props();
	const currency = $derived(field.value?.currency ?? currencies[0] ?? 'EUR');
</script>

<input
	type="number"
	{...field.controlAttrs}
	{@attach field.control}
	value={field.value?.amount ?? ''}
	oninput={(event) =>
		field.setValue({ amount: Number(event.currentTarget.value), currency })}
/>
