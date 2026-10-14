<script lang="ts">
	// Compile-time contract (checked by svelte-check, not run): `value`, `defaultValue` and
	// `onValueChange` follow the literal `value`s of `items`.
	import CheckboxesInput from '../CheckboxesInput/CheckboxesInput.svelte';
	import RadioInput from './RadioInput.svelte';

	type Plan = 'free' | 'pro';
	let plan = $state<Plan | null>('free');
	let plans = $state<Plan[]>([]);
	let wide = $state<string | null>(null);
	let notAPlan = $state<'enterprise' | null>(null);
	let notPlans = $state<'enterprise'[]>([]);
</script>

<RadioInput
	bind:value={plan}
	items={[{ value: 'free' }, { value: 'pro' }]}
	onValueChange={(value) => {
		const narrowed: Plan | null = value;
		void narrowed;
	}}
/>
<RadioInput bind:value={wide} items={[{ value: 'free' }, { value: 'pro' }]} />
<!-- @ts-expect-error a value no item offers -->
<RadioInput bind:value={notAPlan} items={[{ value: 'free' }, { value: 'pro' }]} />

<CheckboxesInput
	bind:value={plans}
	items={[{ value: 'free' }, { value: 'pro' }]}
	onValueChange={(value) => {
		const narrowed: Plan[] = value;
		void narrowed;
	}}
/>
<!-- @ts-expect-error a value no item offers -->
<CheckboxesInput bind:value={notPlans} items={[{ value: 'free' }, { value: 'pro' }]} />
