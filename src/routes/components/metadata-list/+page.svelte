<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import MetadataList from '$lib/components/MetadataList/MetadataList.svelte';
	import type { MetadataListItem } from '$lib/components/MetadataList/metadataList.props.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import type { Density } from '$lib/types/theme.js';
	import { userIcon } from '$lib/components/Icons/user.js';
	import { calendarIcon } from '$lib/components/Icons/calendar.js';
	import { tagIcon } from '$lib/components/Icons/tag.js';

	const projectItems: MetadataListItem[] = [
		{ key: 'Name', value: 'Design System v2' },
		{ key: 'Status', value: 'Active', type: 'chip', color: 'success' },
		{ key: 'Owner', value: 'Alice Johnson' },
		{ key: 'Created', value: new Date('2025-01-15') },
		{ key: 'Priority', value: 'High', type: 'chip', color: 'danger' },
		{ key: 'Repository', value: 'https://github.com/org/design-system' }
	];

	// No explicit `type` — every value's type is auto-detected.
	const autoItems: MetadataListItem[] = [
		{ key: 'Name', value: 'Acme Handbook' },
		{ key: 'Pages', value: 1284 },
		{ key: 'Published', value: true },
		{ key: 'Updated', value: new Date('2025-06-30') },
		{ key: 'Tags', value: ['internal', 'draft', 'q3'] },
		{ key: 'Homepage', value: 'https://acme.example.com/' },
		{ key: 'Contact', value: 'team@acme.example.com' }
	];

	const iconItems: MetadataListItem[] = [
		{ key: 'Owner', value: 'Alice Johnson', icon: userIcon },
		{ key: 'Created', value: new Date('2025-01-15'), icon: calendarIcon },
		{ key: 'Priority', value: 'High', type: 'chip', color: 'danger', icon: tagIcon }
	];

	const manyItems: MetadataListItem[] = [
		{ key: 'Name', value: 'Design System v2' },
		{ key: 'Status', value: 'Active', type: 'chip', color: 'success' },
		{ key: 'Owner', value: 'Alice Johnson' },
		{ key: 'Created', value: new Date('2025-01-15') },
		{ key: 'Priority', value: 'High', type: 'chip', color: 'danger' },
		{ key: 'Repository', value: 'https://github.com/org/design-system' },
		{ key: 'License', value: 'MIT' },
		{ key: 'Version', value: '2.4.1' }
	];

	const densitySegments = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
	] as const satisfies ReadonlyArray<{ value: Density; label: string }>;
	let listDensity = $state<Density>('normal');
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: ['compact', 'normal', 'comfortable']
		},
		{
			name: 'columns',
			type: 'segmented',
			label: 'Columns',
			value: '1',
			options: ['1', '2']
		}
	]);

	const ownerItems: MetadataListItem[] = [
		{ key: 'Owner', value: 'Alice Johnson' },
		{ key: 'Reviewer', value: 'Bob Chen' },
		{ key: 'Status', value: 'Active', type: 'chip', color: 'success' }
	];

	const heroCode = $derived(`<MetadataList
	title="Project Details"
	items={[
		{ key: 'Name', value: 'Design System v2' },
		{ key: 'Status', value: 'Active', type: 'chip', color: 'success' },
		{ key: 'Owner', value: 'Alice Johnson' },
		{ key: 'Created', value: new Date('2025-01-15') },
		{ key: 'Priority', value: 'High', type: 'chip', color: 'danger' },
		{ key: 'Repository', value: 'https://github.com/org/design-system' }
	]}
	size="${controls.value.size}"
	density="${controls.value.density}"
	columns={${controls.value.columns}}
/>`);
</script>

<DocPage
	title="Metadata list"
	subtitle="A read-only key/value metadata list, like Notion's page-properties panel."
	component="MetadataList"
	features={[
		'Auto-detects value types',
		'Localized numbers and dates',
		'Links, boolean and chip values',
		'Multi-column layout',
		'Collapse extras behind Show more'
	]}
>
	<ComponentCard {controls} description="Typed key/value properties" code={heroCode}>
		<MetadataList
			title="Project Details"
			class="w-full max-w-2xl"
			items={projectItems}
			size={controls.value.size}
			density={controls.value.density}
			columns={Number(controls.value.columns)}
		/>
	</ComponentCard>

	{#snippet examples()}
		<!-- Example 1: Auto-detection -->
		<ComponentCard
			description="Raw values with no explicit type — string, number, boolean, date, array, url and email are all auto-detected"
			code={`<MetadataList
	items={[
		{ key: 'Name', value: 'Acme Handbook' },
		{ key: 'Pages', value: 1284 },
		{ key: 'Published', value: true },
		{ key: 'Updated', value: new Date('2025-06-30') },
		{ key: 'Tags', value: ['internal', 'draft', 'q3'] },
		{ key: 'Homepage', value: 'https://acme.example.com/' },
		{ key: 'Contact', value: 'team@acme.example.com' }
	]}
/>`}
		>
			<MetadataList class="w-full max-w-md" items={autoItems} />
		</ComponentCard>

		<!-- Example 2: Key icons -->
		<ComponentCard
			description="An optional icon before each key label"
			code={`<script>
	import { userIcon } from 'entasis/icons/user';
	import { calendarIcon } from 'entasis/icons/calendar';
	import { tagIcon } from 'entasis/icons/tag';
</scr${'ipt'}>

<MetadataList
	items={[
		{ key: 'Owner', value: 'Alice Johnson', icon: userIcon },
		{ key: 'Created', value: new Date('2025-01-15'), icon: calendarIcon },
		{ key: 'Priority', value: 'High', type: 'chip', color: 'danger', icon: tagIcon }
	]}
/>`}
		>
			<MetadataList class="w-full max-w-md" items={iconItems} />
		</ComponentCard>

		<!-- Example 3: Columns -->
		<ComponentCard
			description="Items flow into multiple columns"
			code={`<MetadataList columns={2} items={projectItems} />`}
		>
			<MetadataList class="w-full max-w-2xl" columns={2} items={projectItems} />
		</ComponentCard>

		<!-- Example 4: maxItems show more -->
		<ComponentCard
			description="Collapse the extra items behind an animated Show more toggle"
			code={`<MetadataList maxItems={4} items={manyItems} />

<!-- The open state is bindable -->
<MetadataList maxItems={4} bind:expanded items={manyItems} />`}
		>
			<MetadataList class="w-full max-w-md" maxItems={4} items={manyItems} />
		</ComponentCard>

		<!-- Example 5: Sizes -->
		<ComponentCard
			description="size scales the typography only — labels, values, icons and chips; spacing is owned by density"
			code={`<MetadataList size="small" items={ownerItems} />
<MetadataList size="normal" items={ownerItems} />
<MetadataList size="large" items={ownerItems} />`}
		>
			<div class="flex w-full max-w-md flex-col gap-8">
				<MetadataList size="small" items={ownerItems} />
				<MetadataList size="normal" items={ownerItems} />
				<MetadataList size="large" items={ownerItems} />
			</div>
		</ComponentCard>

		<!-- Example 6: Density -->
		<ComponentCard
			title="Density"
			description="density scales the row and label gaps — compact for dense panels, comfortable for roomy detail surfaces. Combine freely with size."
			code={`<SegmentedControl items={densities} bind:value={density} />
<MetadataList {density} items={ownerItems} />`}
		>
			<div class="flex w-full max-w-md flex-col items-center gap-5">
				<SegmentedControl
					items={densitySegments}
					bind:value={listDensity}
					size="small"
					label="List density"
				/>
				<MetadataList density={listDensity} title="Document" items={ownerItems} />
			</div>
		</ComponentCard>

		<!-- Example 7: Custom value snippet -->
		<ComponentCard
			description="Replace the value cell with a custom snippet (payload lets you special-case items)"
			code={`<MetadataList items={ownerItems}>
	{#snippet value({ item, formatted })}
		{#if item.key === 'Owner' || item.key === 'Reviewer'}
			<span class="inline-flex items-center gap-2">
				<span class="bg-primary size-2 rounded-full"></span>
				{formatted}
			</span>
		{:else}
			{formatted}
		{/if}
	{/snippet}
</MetadataList>`}
		>
			<MetadataList class="w-full max-w-md" items={ownerItems}>
				{#snippet value({ item, formatted })}
					{#if item.key === 'Owner' || item.key === 'Reviewer'}
						<span class="inline-flex items-center gap-2">
							<span class="bg-primary size-2 rounded-full"></span>
							{formatted}
						</span>
					{:else}
						{formatted}
					{/if}
				{/snippet}
			</MetadataList>
		</ComponentCard>

		<!-- Example 8: Header -->
		<ComponentCard
			description="An optional title and description header"
			code={`<MetadataList
	title="Project Details"
	description="Read-only properties synced from the repository"
	items={projectItems}
/>`}
		>
			<MetadataList
				class="w-full max-w-md"
				title="Project Details"
				description="Read-only properties synced from the repository"
				items={projectItems}
			/>
		</ComponentCard>
	{/snippet}
</DocPage>
