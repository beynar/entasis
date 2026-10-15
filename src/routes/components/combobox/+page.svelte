<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import Combobox from '$lib/components/Form/Combobox/Combobox.svelte';
	import type {
		ComboboxItems,
		ComboboxItemsRequest,
		ComboboxOption
	} from '$lib/components/Form/Combobox/combobox.props.js';
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

	// Waits `ms`, rejecting as soon as the request is aborted by a newer search.
	const delay = (ms: number, signal?: AbortSignal) =>
		new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, ms);
			signal?.addEventListener('abort', () => {
				clearTimeout(timer);
				reject(new DOMException('Aborted', 'AbortError'));
			});
		});

	// Example 2: Async function with simulated delay. `signal` is aborted when a newer search
	// replaces this request, so a slow answer never overwrites a newer list.
	const getAsyncOptions = async (
		searchValue: string | undefined,
		{ signal }: ComboboxItemsRequest
	): Promise<ComboboxOption[]> => {
		await delay(300, signal);
		// If no search value, return all options
		if (!searchValue) return countries;
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
	const getAsyncOptionsWithError = async (
		searchValue: string | undefined,
		{ signal }: ComboboxItemsRequest
	): Promise<ComboboxOption[]> => {
		// Simulate API delay
		await delay(200, signal);

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
	let value8 = $state<string | null>(null);
	let value9 = $state<string | null>(null);
	let value10 = $state<string | null>('de');
	let value11 = $state<string | null>(null);
	let open12 = $state(false);
	let submitted = $state('Nothing submitted yet');

	// Grouped example data: flat options and `{ label, items }` groups can be mixed.
	const groupedOptions: ComboboxItems = [
		{
			label: 'Europe',
			items: countries.filter((country) => country.description === 'Europe')
		},
		{
			label: 'Asia',
			items: countries
				.filter((country) => country.description === 'Asia')
				.map((country) => ({ ...country, disabled: country.value === 'cn' }))
		},
		{ value: 'au', label: 'Australia' }
	];
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
		'Styling hooks: data-popup-open on the input, data-highlighted, data-selected and data-disabled on options (comboboxDataAttributes)',
		{ label: 'role=combobox with aria-autocomplete=list', test: 'a11y:combobox.aria' },
		'Debounced search, async or static; stale responses are ignored',
		{
			label: 'Arrow keys open and browse, Escape closes and keeps focus',
			test: 'a11y:combobox.keyboard'
		},
		{ label: 'The listbox owns only options and groups', test: 'a11y:combobox.listbox-children' },
		{
			label: 'Status messages sit beside the listbox',
			test: 'a11y:combobox.status-outside-listbox'
		},
		{ label: 'Result counts announced politely', test: 'a11y:combobox.live-region' },
		{ label: 'Read-only: browse the list, keep the value', test: 'a11y:combobox.readonly' },
		'Bindable value, searchValue and open, with onOpenChange(open, details)',
		'Groups, disabled options and custom rows',
		'Loading, error & empty states',
		'Submits its value (not the search text) in native forms'
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
	openOnFocus
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
				openOnFocus
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
					openOnFocus
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
		openOnFocus
	/>
	<Combobox
		size="normal"
		label="Normal"
		placeholder="Search countries..."
		items={arrayOptions}
		openOnFocus
	/>
	<Combobox
		size="large"
		label="Large"
		placeholder="Search countries..."
		items={arrayOptions}
		openOnFocus
	/>
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<Combobox
					size="small"
					label="Small"
					placeholder="Search countries..."
					items={arrayOptions}
					openOnFocus
				/>
				<Combobox
					size="normal"
					label="Normal"
					placeholder="Search countries..."
					items={arrayOptions}
					openOnFocus
				/>
				<Combobox
					size="large"
					label="Large"
					placeholder="Search countries..."
					items={arrayOptions}
					openOnFocus
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
		<ComponentCard description="Opens with every option when focused, even before typing">
			<div class="w-full max-w-md">
				<Combobox
					placeholder="Search countries..."
					items={arrayOptions}
					openOnFocus
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

		<!-- Groups, separators and disabled options -->
		<ComponentCard
			title="Groups and disabled options"
			description="Groups follow Select: a labelled group, separators between groups, and disabled options that the keyboard skips."
			code={`<Combobox
	openOnFocus
	placeholder="Search by region..."
	items={[
		{ label: 'Europe', items: [{ value: 'fr', label: 'France' }, { value: 'de', label: 'Germany' }] },
		{
			label: 'Asia',
			items: [{ value: 'jp', label: 'Japan' }, { value: 'cn', label: 'China', disabled: true }]
		},
		{ value: 'au', label: 'Australia' }
	]}
	bind:value
/>`}
		>
			<div class="w-full max-w-md">
				<Combobox
					openOnFocus
					placeholder="Search by region..."
					items={groupedOptions}
					bind:value={value8}
				/>
			</div>
		</ComponentCard>

		<!-- item snippet -->
		<ComponentCard
			title="Custom rows"
			description="The item snippet replaces the title and description layout of every row."
			code={`<Combobox items={countries} openOnFocus bind:value>
	{#snippet item(option)}
		<span class="flex w-full items-center justify-between gap-md">
			<span>{option.label}</span>
			<span class="text-neutral/70 text-xs">{option.value.toUpperCase()}</span>
		</span>
	{/snippet}
</Combobox>`}
		>
			<div class="w-full max-w-md">
				<Combobox
					placeholder="Search countries..."
					items={countries}
					openOnFocus
					bind:value={value9}
				>
					{#snippet item(option)}
						<span class="gap-md flex w-full items-center justify-between">
							<span>{option.label}</span>
							<span class="text-neutral/70 text-xs">{option.value.toUpperCase()}</span>
						</span>
					{/snippet}
				</Combobox>
			</div>
		</ComponentCard>

		<!-- filter + limit -->
		<ComponentCard
			title="Filter and limit"
			description="A custom filter matches names that start with the text, and the list stops at five matches."
			code={`<Combobox
	items={countries}
	limit={5}
	filter={(option, search) => option.label.toLowerCase().startsWith(search.toLowerCase())}
	placeholder="Names starting with..."
	bind:value
/>`}
		>
			<div class="w-full max-w-md">
				<Combobox
					items={countries}
					limit={5}
					filter={(option, search) => option.label.toLowerCase().startsWith(search.toLowerCase())}
					placeholder="Names starting with..."
					bind:value={value11}
				/>
			</div>
		</ComponentCard>

		<!-- readOnly -->
		<ComponentCard
			title="Read-only"
			description="The list opens and can be browsed, but the value stays; the clear button is hidden."
			code={`<Combobox readOnly openOnFocus label="Country" items={countries} bind:value />`}
		>
			<div class="w-full max-w-md">
				<Combobox readOnly openOnFocus label="Country" items={countries} bind:value={value10} />
			</div>
		</ComponentCard>

		<!-- Controlled open state -->
		<ComponentCard
			title="Open state"
			description="open is bindable; onOpenChange runs before the change and can cancel it. This one cannot be dismissed with Escape."
			code={`<Combobox
	items={countries}
	openOnFocus
	bind:open
	onOpenChange={(next, details) => {
		if (!next && details.reason === 'escape-key') details.cancel();
	}}
/>`}
		>
			<div class="w-full max-w-md">
				<Combobox
					items={countries}
					openOnFocus
					placeholder="Escape does not close this list"
					bind:open={open12}
					onOpenChange={(next, details) => {
						if (!next && details.reason === 'escape-key') details.cancel();
					}}
				/>
				<p class="text-neutral/70 mt-2 text-xs">open: {open12}</p>
			</div>
		</ComponentCard>

		<!-- Native form -->
		<ComponentCard
			title="Native form"
			description="The search box holds a draft. A native form submits the selected value under the field's name."
			code={`<form onsubmit={(event) => { event.preventDefault(); console.log(new FormData(event.currentTarget).get('country')); }}>
	<Combobox name="country" items={countries} openOnFocus />
	<Button type="submit">Submit</Button>
</form>`}
		>
			<form
				class="grid w-full max-w-md gap-3"
				onsubmit={(event) => {
					event.preventDefault();
					submitted = `country = ${String(new FormData(event.currentTarget).get('country') ?? '(empty)')}`;
				}}
			>
				<Combobox name="country" label="Country" items={countries} openOnFocus />
				<Button type="submit" class="w-fit">Submit</Button>
				<p class="text-neutral/70 text-xs">{submitted}</p>
			</form>
		</ComponentCard>
	{/snippet}
</DocPage>
