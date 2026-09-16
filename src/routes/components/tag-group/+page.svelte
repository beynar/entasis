<script lang="ts">
	import { articleIcon } from '$lib/components/Icons/article.js';
	import { gameControllerIcon } from '$lib/components/Icons/gameController.js';
	import { globeIcon } from '$lib/components/Icons/globe.js';
	import { shoppingBagIcon } from '$lib/components/Icons/shoppingBag.js';
	import { TagGroup } from '$lib/components/Form/TagGroup/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { densities, sizes } from '$lib/utils/tokens.js';

	const categoryItems = [
		{ value: 'news', label: 'News' },
		{ value: 'travel', label: 'Travel' },
		{ value: 'gaming', label: 'Gaming' },
		{ value: 'shopping', label: 'Shopping' }
	];

	const categoryItemsWithIcons = [
		{ value: 'news', label: 'News', icon: articleIcon },
		{ value: 'travel', label: 'Travel', icon: globeIcon },
		{ value: 'gaming', label: 'Gaming', icon: gameControllerIcon },
		{ value: 'shopping', label: 'Shopping', icon: shoppingBagIcon }
	];

	const sizeExamples = ['small', 'normal', 'large'] as const;
	let category = $state('travel');
	let interests = $state<string[]>(['news', 'gaming']);
	let featured = $state('gaming');
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
	title="Tag Group"
	subtitle="Selectable chip groups for compact single or multiple choice inputs."
	component="TagGroup"
	features={[
		'Renders options with the Chip primitive',
		'Single or multiple selection',
		'Optional icon per tag',
		'Bindable value with hidden form inputs',
		'Small, normal, and large sizes'
	]}
>
	<ComponentCard
		{controls}
		description="A single selectable tag group."
		code={`<TagGroup
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Category"
	bind:value={category}
	items={[
		{ value: 'news', label: 'News' },
		{ value: 'travel', label: 'Travel' },
		{ value: 'gaming', label: 'Gaming' },
		{ value: 'shopping', label: 'Shopping' }
	]}
/>`}
	>
		<div class="w-full max-w-md">
			<TagGroup
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Category"
				bind:value={category}
				items={categoryItems}
			/>
			<p class="text-neutral/70 mt-4 text-sm">Selected: {category || 'none'}</p>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="With Icons"
			description="Each option can pass an icon snippet to the inner Chip prefix."
			class="!min-h-fit"
			code={`<TagGroup
	label="Featured category"
	bind:value={featured}
	items={[
		{ value: 'news', label: 'News', icon: articleIcon },
		{ value: 'travel', label: 'Travel', icon: globeIcon },
		{ value: 'gaming', label: 'Gaming', icon: gameControllerIcon },
		{ value: 'shopping', label: 'Shopping', icon: shoppingBagIcon }
	]}
/>`}
		>
			<div
				class="bg-neutral text-neutral-contrast border-neutral/15 flex min-h-48 w-full items-center justify-center rounded border p-8"
			>
				<TagGroup
					fieldAttrs={{ 'aria-label': 'Featured category' }}
					bind:value={featured}
					items={categoryItemsWithIcons}
					color="neutral"
					unselectedColor="neutral"
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Multiple Selection"
			description="Set multiple to write and bind a string array."
			class="!min-h-fit"
			code={`<TagGroup
	multiple
	label="Interests"
	bind:value={interests}
	items={categoryItems}
/>`}
		>
			<div class="w-full max-w-md">
				<TagGroup multiple label="Interests" bind:value={interests} items={categoryItems} />
				<p class="text-neutral/70 mt-4 text-sm">
					Selected: {interests.join(', ') || 'none'}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Use size to match surrounding form density."
			class="!min-h-fit"
			code={`{#each ['small', 'normal', 'large'] as size}
	<TagGroup
		{size}
		label={size}
		value="travel"
		items={categoryItems}
	/>
{/each}`}
		>
			<div class="grid w-full gap-4">
				{#each sizeExamples as size (size)}
					<TagGroup
						{size}
						label={`${size[0].toUpperCase()}${size.slice(1)} size`}
						value="travel"
						items={categoryItems}
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Inside Form"
			description="Use type: 'tag-group' in the config-driven Form."
			class="!min-h-fit"
			code={`<Form
	inputs={{
		category: {
			type: 'tag-group',
			label: 'Category',
			required: true,
			items: categoryItems
		},
		interests: {
			type: 'tag-group',
			multiple: true,
			label: 'Interests',
			items: categoryItems
		}
	}}
/>`}
		>
			<div class="w-full max-w-md">
				<Form
					inputs={{
						category: {
							type: 'tag-group',
							label: 'Category',
							required: true,
							items: categoryItems,
							value: 'travel'
						},
						interests: {
							type: 'tag-group',
							multiple: true,
							label: 'Interests',
							items: categoryItems,
							value: ['news', 'gaming']
						}
					}}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
