<script lang="ts">
	import { Carousel } from '$lib/components/Carousel/index.js';
	import { DataTable, type DataTableColumn } from '$lib/components/DataTable/index.js';
	import { ImageGallery } from '$lib/components/ImageGallery/index.js';
	import { Kanban, type KanbanColumnData } from '$lib/components/Kanban/index.js';
	import { SortableList } from '$lib/components/SortableList/index.js';
	import { Table } from '$lib/components/Table/index.js';
	import { Tree } from '$lib/components/Tree/index.js';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import Matrix from './Matrix.svelte';
	import Section from './Section.svelte';
	import {
		carouselItems,
		imageOne,
		imageThree,
		imageTwo,
		densities,
		people,
		sizes,
		tableHeader,
		tableRows,
		treePaths,
		type Person
	} from './fixtures.js';

	let { size = 'normal', density = 'normal' }: { size?: Sizes; density?: Density } = $props();

	const columns: DataTableColumn<Person>[] = [
		{ id: 'name', accessor: 'name', header: 'Name', sortable: true, width: 180 },
		{ id: 'department', accessor: 'department', header: 'Department', sortable: true },
		{ id: 'status', accessor: 'status', header: 'Status', width: 120 },
		{ id: 'salary', accessor: 'salary', header: 'Salary', sortable: true, align: 'end' }
	];

	const board: KanbanColumnData[] = [
		{
			id: 'backlog',
			title: 'Backlog',
			color: 'info',
			cards: [
				{ id: 'k1', title: 'Audit color contrast', description: 'WCAG AA across themes' },
				{ id: 'k2', title: 'Write onboarding guide' }
			]
		},
		{
			id: 'progress',
			title: 'In progress',
			color: 'warning',
			cards: [{ id: 'k3', title: 'Rebuild sortable list' }]
		},
		{ id: 'done', title: 'Done', color: 'success', cards: [{ id: 'k4', title: 'Card theme' }] }
	];

	const sortableItems = [
		{ id: 's1', label: 'Design tokens' },
		{ id: 's2', label: 'Component audit' },
		{ id: 's3', label: 'Dark theme pass' }
	];

	const galleryImages = [
		{ src: imageOne, alt: 'Landscape one' },
		{ src: imageTwo, alt: 'Landscape two' },
		{ src: imageThree, alt: 'Landscape three' }
	];
</script>

<Section
	id="data"
	title="Data"
	description="Table, DataTable, Kanban, SortableList, Tree, Carousel, ImageGallery."
>
	<Matrix caption="Table" varies="density, footer, caption" layout="stack">
		{#each densities as tableDensity (tableDensity)}
			<div class="border-neutral-muted bg-surface overflow-hidden rounded-lg border">
				<Table
					header={tableHeader}
					items={tableRows}
					density={tableDensity}
					caption="Density {tableDensity}"
				/>
			</div>
		{/each}
		<div class="border-neutral-muted bg-surface overflow-hidden rounded-lg border">
			<Table
				header={tableHeader}
				items={tableRows}
				footer={{ member: '3 members', event: '', time: '' }}
				{density}
			/>
		</div>
	</Matrix>

	<Matrix
		caption="DataTable"
		varies="density, selectionMode, search"
		note={'Small 5-row dataset rendered in normal flow with virtualize={false}, so no explicit height is needed.'}
		layout="stack"
	>
		{#each densities as tableDensity (tableDensity)}
			<DataTable
				items={people}
				{columns}
				getRowId={(row) => row.id}
				density={tableDensity}
				virtualize={false}
				search={false}
			/>
		{/each}
		<DataTable
			items={people}
			{columns}
			getRowId={(row) => row.id}
			{density}
			virtualize={false}
			search
			selectionMode="multiple"
			stickyHeader
		/>
	</Matrix>

	<Matrix caption="Kanban" varies="density, indicator, disabled" layout="stack">
		{#each densities as boardDensity (boardDensity)}
			<Kanban columns={board} density={boardDensity} columnHeight="14rem" />
		{/each}
		<Kanban columns={board} {density} columnHeight="14rem" disabled />
	</Matrix>

	<Matrix
		caption="SortableList"
		varies="size, orientation, handle, disabled"
		layout="grid"
		class="items-start"
	>
		{#each sizes as listSize (listSize)}
			<SortableList items={sortableItems} size={listSize} handle>
				{#snippet item({ item })}
					<span class="text-neutral text-sm">{item.label}</span>
				{/snippet}
			</SortableList>
		{/each}
		<SortableList items={sortableItems} {size} orientation="horizontal">
			{#snippet item({ item })}
				<span class="text-neutral text-sm">{item.label}</span>
			{/snippet}
		</SortableList>
		<SortableList items={sortableItems} {size} disabled>
			{#snippet item({ item })}
				<span class="text-neutral text-sm">{item.label}</span>
			{/snippet}
		</SortableList>
	</Matrix>

	<Matrix
		caption="Tree"
		varies="density, search, gitStatus"
		note="Virtualized file tree; rows render on the client after the renderer mounts."
		layout="grid"
		class="items-start"
	>
		{#each densities as treeDensity (treeDensity)}
			<div class="border-neutral-muted bg-surface overflow-hidden rounded-lg border">
				<Tree paths={treePaths} density={treeDensity} height={220} />
			</div>
		{/each}
		<div class="border-neutral-muted bg-surface overflow-hidden rounded-lg border">
			<Tree paths={treePaths} {density} height={220} search />
		</div>
	</Matrix>

	<Matrix
		caption="Carousel"
		varies="snapAlign, pagination, navigationButton, layout"
		layout="stack"
	>
		<Carousel
			items={carouselItems}
			pagination={{ variant: 'dots', color: 'primary', size }}
			navigationButton={{ color: 'neutral', size }}
		>
			{#snippet children({ item })}
				<div class="border-neutral-muted bg-surface grid h-32 place-items-center rounded-lg border">
					<p class="text-neutral font-medium">{item.title}</p>
					<p class="text-neutral/60 text-xs">{item.body}</p>
				</div>
			{/snippet}
		</Carousel>
		<Carousel
			items={carouselItems}
			snapAlign="center"
			layout={3}
			gaps={16}
			pagination={{ color: 'info', size }}
		>
			{#snippet children({ item })}
				<div class="bg-neutral-muted text-neutral grid h-24 place-items-center rounded-lg text-sm">
					{item.title}
				</div>
			{/snippet}
		</Carousel>
	</Matrix>

	<Matrix
		caption="ImageGallery"
		varies="click-to-zoom on descendant images"
		note="Uses inline SVG data URIs so nothing is fetched from a CDN."
		layout="block"
	>
		<ImageGallery>
			<div class="gap-sm flex flex-wrap">
				{#each galleryImages as image (image.src)}
					<img
						src={image.src}
						alt={image.alt}
						title={image.alt}
						class="h-24 w-40 rounded-lg object-cover"
					/>
				{/each}
			</div>
		</ImageGallery>
	</Matrix>
</Section>
