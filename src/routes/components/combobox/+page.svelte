<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import Combobox from '$lib/components/Form/Combobox/Combobox.svelte';
	import type { ComboboxOption } from '$lib/components/Form/Combobox/combobox.props.js';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	// Example data sets
	const countries = [
		{ value: 'us', label: 'United States', description: 'North America' },
		{ value: 'uk', label: 'United Kingdom', description: 'Europe' },
		{ value: 'ca', label: 'Canada', description: 'North America' },
		{ value: 'fr', label: 'France', description: 'Europe' },
		{ value: 'de', label: 'Germany', description: 'Europe' },
		{ value: 'it', label: 'Italy', description: 'Europe' },
		{ value: 'es', label: 'Spain', description: 'Europe' },
		{ value: 'jp', label: 'Japan', description: 'Asia' },
		{ value: 'cn', label: 'China', description: 'Asia' },
		{ value: 'in', label: 'India', description: 'Asia' },
		{ value: 'au', label: 'Australia', description: 'Oceania' },
		{ value: 'br', label: 'Brazil', description: 'South America' },
		{ value: 'mx', label: 'Mexico', description: 'North America' },
		{ value: 'ru', label: 'Russia', description: 'Europe/Asia' },
		{ value: 'za', label: 'South Africa', description: 'Africa' },
		{ value: 'eg', label: 'Egypt', description: 'Africa' },
		{ value: 'ar', label: 'Argentina', description: 'South America' },
		{ value: 'kr', label: 'South Korea', description: 'Asia' },
		{ value: 'sa', label: 'Saudi Arabia', description: 'Asia' },
		{ value: 'tr', label: 'Turkey', description: 'Europe/Asia' },
		{ value: 'se', label: 'Sweden', description: 'Europe' },
		{ value: 'no', label: 'Norway', description: 'Europe' },
		{ value: 'fi', label: 'Finland', description: 'Europe' }
	];

	// Example 1: Array options (non-async, filtered client-side)
	const arrayOptions = countries;

	// Example 2: Async function with simulated delay
	const getAsyncOptions = async (searchValue?: string): Promise<ComboboxOption[]> => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 300));

		console.log('searchValue', searchValue);
		// If no search value, return all options
		if (!searchValue) return countries;
		console.log(
			countries.filter((option) => option.label.toLowerCase().includes(searchValue.toLowerCase()))
		);
		return countries.filter((option) =>
			option.label.toLowerCase().includes(searchValue.toLowerCase())
		);
	};

	// Example 3: Non-async function (synchronous)
	const getSyncOptions = (searchValue?: string): ComboboxOption[] => {
		if (!searchValue) return [];
		return countries.filter((option) =>
			option.label.toLowerCase().includes(searchValue?.toLowerCase() || '')
		);
	};

	// Example 4: Async function with error simulation
	const getAsyncOptionsWithError = async (searchValue?: string): Promise<ComboboxOption[]> => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Simulate error for demonstration (uncomment to test)
		if (searchValue === 'error') {
			throw new Error('Failed to fetch options');
		}

		// If no search value, return all options
		if (!searchValue) return countries;

		return countries.filter((option) =>
			option.label.toLowerCase().includes(searchValue.toLowerCase())
		);
	};

	// State for each example
	let value1 = $state<string | null>('fr');
	let value2 = $state<string | null>(null);
	let value3 = $state<string | null>(null);
	let value4 = $state<string | null>(null);
	let value5 = $state<string | null>(null);
	let value6 = $state<string | null>(null);
	let value7 = $state<string | null>('fr'); // Pre-selected value for demo
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: densities
		},
		{
			name: 'labelPosition',
			type: 'segmented',
			label: 'Label',
			value: 'top',
			options: ['top', 'left']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

<DocPage
	title="Combobox"
	subtitle="A text input with a filterable dropdown of options."
	component="Combobox"
	features={[
		{ label: 'role=combobox with aria-autocomplete=list', test: 'a11y:combobox.aria' },
		'Debounced search, async or static',
		{ label: 'Arrow keys, Enter, Escape navigation', test: 'a11y:combobox.keyboard' },
		'Bindable value & searchValue',
		'Loading, error & empty states'
	]}
>
	<ComponentCard
		{controls}
		description="Search and pick a country"
		code={`<Combobox
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Country"
	description="Used to localize dates and currency"
	showAllOnFocus
	placeholder="Search countries..."
	items={[
		{ value: 'us', label: 'United States', description: 'North America' },
		{ value: 'uk', label: 'United Kingdom', description: 'Europe' },
		{ value: 'fr', label: 'France', description: 'Europe' }
	]}
	bind:value
/>`}
	>
		<div class="w-full max-w-md">
			<Combobox
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Country"
				description="Used to localize dates and currency"
				showAllOnFocus
				placeholder="Search countries..."
				items={arrayOptions}
				bind:value={value1}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<!-- Example 1: Array Options -->
		<ComponentCard description="Static array, filtered client-side">
			<div class="w-full max-w-md">
				<Combobox
					showAllOnFocus
					placeholder="Search countries..."
					items={arrayOptions}
					bind:value={value1}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large combobox inputs."
			code={`<div class="grid w-full max-w-md gap-6">
	<Combobox
		size="small"
		label="Small"
		placeholder="Search countries..."
		items={arrayOptions}
		showAllOnFocus
	/>
	<Combobox
		size="normal"
		label="Normal"
		placeholder="Search countries..."
		items={arrayOptions}
		showAllOnFocus
	/>
	<Combobox
		size="large"
		label="Large"
		placeholder="Search countries..."
		items={arrayOptions}
		showAllOnFocus
	/>
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<Combobox
					size="small"
					label="Small"
					placeholder="Search countries..."
					items={arrayOptions}
					showAllOnFocus
				/>
				<Combobox
					size="normal"
					label="Normal"
					placeholder="Search countries..."
					items={arrayOptions}
					showAllOnFocus
				/>
				<Combobox
					size="large"
					label="Large"
					placeholder="Search countries..."
					items={arrayOptions}
					showAllOnFocus
				/>
			</div>
		</ComponentCard>

		<!-- Example 2: Async Function Options -->
		<ComponentCard description="Simulated API call with 300ms delay">
			<div class="w-full max-w-md">
				<Combobox placeholder="Search async..." items={getAsyncOptions} bind:value={value2} />
				{#if value2}
					<p class="text-neutral/70 mt-2 text-xs">Selected: {value2}</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 3: Non-Async Function Options -->
		<ComponentCard description="Non-async function, instant filtering">
			<div class="w-full max-w-md">
				<Combobox placeholder="Search languages..." items={getSyncOptions} bind:value={value3} />
				{#if value3}
					<p class="text-neutral/70 mt-2 text-xs">Selected: {value3}</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 4: Async with Error Handling -->
		<ComponentCard description="Shows error state if API fails">
			<div class="w-full max-w-md">
				<Combobox
					placeholder="Search countries..."
					items={getAsyncOptionsWithError}
					bind:value={value4}
				/>
				{#if value4}
					<p class="text-neutral/70 mt-2 text-xs">Selected: {value4}</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 5: Array Options (No Prefix) -->
		<ComponentCard description="Prefix set to false to hide the default magnifying glass icon">
			<div class="w-full max-w-md">
				<Combobox
					placeholder="Search countries..."
					items={countries}
					prefix={false}
					bind:value={value5}
				/>
				{#if value5}
					<p class="text-neutral/70 mt-2 text-xs">Selected: {value5}</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 6: Show All Options on Focus -->
		<ComponentCard description="Displays all options when focused, even without typing">
			<div class="w-full max-w-md">
				<Combobox
					placeholder="Search countries..."
					items={arrayOptions}
					showAllOnFocus={true}
					bind:value={value6}
				/>
				{#if value6}
					<p class="text-neutral/70 mt-2 text-xs">Selected: {value6}</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 7: Default Value with getValueLabel -->
		<ComponentCard description="Shows label for default value even when options haven't loaded yet">
			<div class="w-full max-w-md">
				<Combobox
					placeholder="Search async..."
					items={getAsyncOptions}
					bind:value={value7}
					getValueOption={(value) => {
						return countries.find((option) => option.value === value) || null;
					}}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
