<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import TagsInput from '$lib/components/Form/TagsInput/TagsInput.svelte';
	import type { ComboboxOption } from '$lib/components/Form/Combobox/combobox.props.js';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	// Example data set
	const technologies = [
		{ value: 'js', label: 'JavaScript', description: 'Language' },
		{ value: 'ts', label: 'TypeScript', description: 'Language' },
		{ value: 'svelte', label: 'Svelte', description: 'Framework' },
		{ value: 'react', label: 'React', description: 'Library' },
		{ value: 'vue', label: 'Vue', description: 'Framework' },
		{ value: 'angular', label: 'Angular', description: 'Framework' },
		{ value: 'solid', label: 'SolidJS', description: 'Library' },
		{ value: 'qwik', label: 'Qwik', description: 'Framework' },
		{ value: 'node', label: 'Node.js', description: 'Runtime' },
		{ value: 'deno', label: 'Deno', description: 'Runtime' },
		{ value: 'bun', label: 'Bun', description: 'Runtime' },
		{ value: 'go', label: 'Go', description: 'Language' },
		{ value: 'rust', label: 'Rust', description: 'Language' },
		{ value: 'python', label: 'Python', description: 'Language' }
	];

	// Static array options (filtered client-side)
	const arrayOptions = technologies;

	// Async function with simulated delay
	const getAsyncOptions = async (searchValue?: string): Promise<ComboboxOption[]> => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 300));

		// If no search value, return all options
		if (!searchValue) return technologies;

		return technologies.filter((option) =>
			option.label.toLowerCase().includes(searchValue.toLowerCase())
		);
	};

	// State for each example
	let skills = $state<string[] | null>(null);
	let value1 = $state<string[] | null>(null);
	let value2 = $state<string[] | null>(null);
	let value3 = $state<string[] | null>(null);
	let value4 = $state<string[] | null>(null);
	let value5 = $state<string[] | null>(null);
	let value6 = $state<string[] | null>(['svelte', 'ts']); // Pre-filled values for demo
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
	title="Tags Input"
	subtitle="A multi-tag input for free text or a searchable option list."
	component="TagsInput"
	features={[
		'Free-text or restricted to an option list',
		'Debounced search, async or static items',
		'Animated tag add/remove with Chip',
		'Bindable value (string[]) & searchValue',
		'Backspace removes the last tag'
	]}
>
	<ComponentCard
		{controls}
		description="Free mode — type and press Enter to add a tag"
		code={`<TagsInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Skills"
	description="Press Enter to add each skill."
	placeholder="Add a skill..."
	bind:value={skills}
/>`}
	>
		<div class="w-full max-w-md">
			<TagsInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Skills"
				description="Press Enter to add each skill."
				placeholder="Add a skill..."
				bind:value={skills}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<!-- Example 1: Free mode -->
		<ComponentCard description="Free mode — type and press Enter to add a tag">
			<div class="w-full max-w-md">
				<TagsInput placeholder="Add tags..." bind:value={value1} />
				{#if value1?.length}
					<p class="text-neutral/70 mt-2 text-xs">Tags: {value1.join(', ')}</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 2: Static items with showAllOnFocus -->
		<ComponentCard description="Restricted to a static list, shows all options on focus">
			<div class="w-full max-w-md">
				<TagsInput
					showAllOnFocus
					placeholder="Search technologies..."
					items={arrayOptions}
					bind:value={value2}
				/>
				{#if value2?.length}
					<p class="text-neutral/70 mt-2 text-xs">Tags: {value2.join(', ')}</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 3: Async items -->
		<ComponentCard description="Simulated API call with 300ms delay">
			<div class="w-full max-w-md">
				<TagsInput placeholder="Search async..." items={getAsyncOptions} bind:value={value3} />
				{#if value3?.length}
					<p class="text-neutral/70 mt-2 text-xs">Tags: {value3.join(', ')}</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 4: Items + customTags -->
		<ComponentCard description="Restricted list, but also allows custom free-text tags">
			<div class="w-full max-w-md">
				<TagsInput
					customTags
					showAllOnFocus
					placeholder="Pick or type your own..."
					items={arrayOptions}
					bind:value={value4}
				/>
				{#if value4?.length}
					<p class="text-neutral/70 mt-2 text-xs">Tags: {value4.join(', ')}</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 5: maxTags of 3 -->
		<ComponentCard description="Limited to a maximum of 3 tags">
			<div class="w-full max-w-md">
				<TagsInput maxTags={3} placeholder="Up to 3 tags..." bind:value={value5} />
				{#if value5?.length}
					<p class="text-neutral/70 mt-2 text-xs">Tags: {value5.join(', ')}</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 6: Pre-filled value with labels via getValueOption -->
		<ComponentCard description="Pre-filled values resolve their labels via getValueOption">
			<div class="w-full max-w-md">
				<TagsInput
					placeholder="Search technologies..."
					items={getAsyncOptions}
					bind:value={value6}
					getValueOption={(value) => {
						return technologies.find((option) => option.value === value) || null;
					}}
				/>
			</div>
		</ComponentCard>

		<!-- Example 7: Sizes -->
		<ComponentCard
			title="Sizes"
			description="Small, normal, and large tag inputs."
			code={`<div class="grid w-full max-w-md gap-6">
	<TagsInput size="small" label="Small" placeholder="Add tags..." />
	<TagsInput size="normal" label="Normal" placeholder="Add tags..." />
	<TagsInput size="large" label="Large" placeholder="Add tags..." />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<TagsInput size="small" label="Small" placeholder="Add tags..." />
				<TagsInput size="normal" label="Normal" placeholder="Add tags..." />
				<TagsInput size="large" label="Large" placeholder="Add tags..." />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
