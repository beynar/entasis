<script lang="ts">
	import Theme from '../../Theme/Theme.svelte';
	import CheckboxesInput from '../CheckboxesInput/CheckboxesInput.svelte';
	import RadioInput from './RadioInput.svelte';

	// Two instances of each control share a name, and the values hold spaces: the case that used
	// to produce duplicate and invalid option ids.
	const items = [
		{ value: 'north america', label: 'North America' },
		{ value: 'europe', label: 'Europe' }
	];
</script>

<Theme>
	<section data-testid="radios">
		<RadioInput name="region" label="Billing region" {items} />
		<RadioInput name="region" label="Shipping region" {items} />
	</section>
	<section data-testid="checkboxes">
		<CheckboxesInput name="regions" label="Sales regions" {items} />
		<CheckboxesInput name="regions" label="Support regions" {items} />
	</section>
</Theme>
