<script lang="ts">
	import Chip from '$lib/components/Chip/Chip.svelte';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import Table from '$lib/components/Table/Table.svelte';
	import type {
		PaginationControlVariant,
		PaginationItemLabel,
		PaginationPageItemPayload,
		PaginationSummaryPayload,
		PaginationVariant
	} from '$lib/components/Pagination/pagination.props.js';
	import { colors, sizes } from '$lib/utils/tokens.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const variants = [
		'pages',
		'count',
		'compact',
		'dots',
		'none'
	] as const satisfies readonly PaginationVariant[];
	const controlVariants = [
		'solid',
		'outline',
		'soft',
		'ghost'
	] as const satisfies readonly PaginationControlVariant[];
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'pages',
			options: variants
		},
		{
			name: 'controlVariant',
			type: 'segmented',
			label: 'Control',
			value: 'ghost',
			options: controlVariants
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		}
	]);
	const invoiceHeader = {
		id: 'Invoice',
		customer: 'Customer',
		status: 'Status'
	};
	const invoiceRows = [
		{
			cells: {
				id: 'INV-1048',
				customer: 'Ada Lovelace',
				status: 'Paid'
			}
		},
		{
			cells: {
				id: 'INV-1049',
				customer: 'Grace Hopper',
				status: 'Pending'
			}
		},
		{
			cells: {
				id: 'INV-1050',
				customer: 'Katherine Johnson',
				status: 'Paid'
			}
		}
	];

	let value = $state(6);
	let variantPage = $state(8);
	let windowedPage = $state(18);
	let tablePage = $state(2);
	let linkedPage = $state(3);
	let itemCountPage = $state(4);

	const getHref = (nextPage: number) => `/components/pagination?page=${nextPage}`;
	const getFrenchPaginationLabel = (item: PaginationItemLabel) => {
		if (item.type === 'page') {
			return item.active ? `Page ${item.page}, page courante` : `Aller a la page ${item.page}`;
		}

		const labelByType: Record<Exclude<PaginationItemLabel['type'], 'page'>, string> = {
			first: 'Aller a la premiere page',
			previous: 'Aller a la page precedente',
			next: 'Aller a la page suivante',
			last: 'Aller a la derniere page'
		};

		return labelByType[item.type];
	};
</script>

<DocPage
	title="Pagination"
	subtitle="Accessible page navigation for lists, tables, and routed result pages."
	component="Pagination"
	features={[
		'Bindable one-based page',
		'Five layout variants',
		'Expanded dot hitboxes',
		'Ellipsis windowing',
		'Button or anchor controls',
		{ label: 'Localized aria labels', test: 'a11y:pagination.aria-labels' }
	]}
>
	<ComponentCard
		{controls}
		description="A controlled pagination bar with previous and next controls."
		code={`<Pagination
	bind:value
	totalPages={20}
	size="${controls.value.size}"
	variant="${controls.value.variant}"
	controlVariant="${controls.value.controlVariant}"
	color="${controls.value.color}"
/>`}
	>
		<div class="flex w-full flex-col items-center justify-center gap-4">
			<Pagination
				bind:value
				totalPages={20}
				totalItems={200}
				pageSize={10}
				size={controls.value.size}
				variant={controls.value.variant}
				controlVariant={controls.value.controlVariant}
				color={controls.value.color}
			/>
			<Chip color="neutral" variant="soft">Page {value} of 20</Chip>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Size tokens adjust control dimensions." class="!min-h-fit">
			<div class="flex flex-col items-center gap-5">
				{#each sizes as size, index (index)}
					<Pagination {size} value={3} totalPages={8} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="Variants control the content rendered between previous and next."
			class="!min-h-fit"
			code={`<Pagination variant="pages" totalPages={10} />
<Pagination variant="count" totalItems={100} pageSize={10} />
<Pagination variant="compact" totalPages={10} />
<Pagination variant="dots" totalPages={10} />
<Pagination variant="none" totalPages={10} />`}
		>
			<div class="grid w-full gap-6 sm:grid-cols-2">
				{#each variants as variant, index (index)}
					<div class="flex min-h-24 flex-col items-center justify-center gap-3">
						<span class="text-neutral/70 text-xs font-medium capitalize">{variant}</span>
						<Pagination
							{variant}
							bind:value={variantPage}
							totalItems={100}
							pageSize={10}
							color="neutral"
						/>
					</div>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="Control appearance remains independent from the pagination layout."
			class="!min-h-fit"
		>
			<div class="flex flex-col items-center gap-5">
				{#each controlVariants as controlVariant, index (index)}
					<Pagination {controlVariant} color="primary" value={4} totalPages={9} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="Semantic colors use the active page and hover token."
			class="!min-h-fit"
		>
			<div class="grid gap-4">
				{#each colors as color, index (index)}
					<Pagination {color} value={2} totalPages={5} siblingCount={0} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="Sibling and boundary counts tune the numbered page window."
			class="!min-h-fit"
		>
			<div class="flex flex-col items-center gap-4">
				<Pagination
					bind:value={windowedPage}
					totalPages={40}
					siblingCount={0}
					boundaryCount={1}
					size="small"
				/>
				<Chip color="neutral" variant="soft">Page {windowedPage} of 40</Chip>
			</div>
		</ComponentCard>

		<ComponentCard
			description="First and last controls can be enabled when the page count is high."
		>
			<Pagination value={12} totalPages={80} showFirstLast />
		</ComponentCard>

		<ComponentCard
			description="Totals can derive page count and render a range summary."
			class="!min-h-fit"
		>
			<Pagination bind:value={itemCountPage} totalItems={96} pageSize={10} showSummary>
				{#snippet summary(range: PaginationSummaryPayload)}
					<Chip color="neutral" variant="soft">
						{range.startItem}-{range.endItem} of {range.totalItems} invoices
					</Chip>
				{/snippet}
			</Pagination>
		</ComponentCard>

		<ComponentCard
			description="Page item content can be customized through the pageItem slot."
			class="!min-h-fit"
		>
			<Pagination value={8} totalPages={14}>
				{#snippet pageItem(item: PaginationPageItemPayload)}
					<span class="tabular-nums">{item.active ? 'p.' : ''}{item.page}</span>
				{/snippet}
			</Pagination>
		</ComponentCard>

		<ComponentCard
			description="A default child snippet can replace the renderer while reusing pagination state."
			class="!min-h-fit"
		>
			<Pagination bind:value={itemCountPage} totalPages={10}>
				{#snippet children(pagination)}
					<div class="flex items-center gap-3">
						<button
							type="button"
							class="text-neutral/70 hover:text-neutral text-sm font-medium disabled:opacity-45"
							disabled={pagination.isPreviousDisabled}
							onclick={pagination.previous}
						>
							Previous
						</button>
						<Chip color="neutral" variant="soft">
							Page {pagination.currentPage} of {pagination.pageCount}
						</Chip>
						<button
							type="button"
							class="text-neutral/70 hover:text-neutral text-sm font-medium disabled:opacity-45"
							disabled={pagination.isNextDisabled}
							onclick={pagination.next}
						>
							Next
						</button>
					</div>
				{/snippet}
			</Pagination>
		</ComponentCard>

		<ComponentCard
			description="Controls can render as anchors for routed pagination."
			class="!min-h-fit"
		>
			<div class="flex flex-col items-center gap-4">
				<Pagination bind:value={linkedPage} totalPages={10} {getHref} />
				<Chip color="neutral" variant="soft">
					Next links point at {getHref(Math.min(linkedPage + 1, 10))}
				</Chip>
			</div>
		</ComponentCard>

		<ComponentCard description="aria labels can be localized without changing visible content.">
			<Pagination
				value={3}
				totalPages={9}
				label="Pagination des factures"
				getItemLabel={getFrenchPaginationLabel}
			/>
		</ComponentCard>

		<ComponentCard description="Composable inside a Table suffix without table-specific coupling.">
			<Table header={invoiceHeader} items={invoiceRows}>
				{#snippet suffix()}
					<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
						<Pagination
							bind:value={tablePage}
							totalItems={72}
							pageSize={9}
							size="small"
							siblingCount={0}
							showSummary
						>
							{#snippet summary(range: PaginationSummaryPayload)}
								<Chip color="neutral" variant="soft">
									Showing {range.startItem}-{range.endItem} of {range.totalItems}
								</Chip>
							{/snippet}
						</Pagination>
					</div>
				{/snippet}
			</Table>
		</ComponentCard>
	{/snippet}
</DocPage>
