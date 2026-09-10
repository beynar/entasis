<script lang="ts">
	import {
		createDataTableState,
		DataTable,
		type DataTableCellRenderPayload,
		type DataTableColumn,
		type DataTableRowPayload,
		type DataTableState
	} from 'svelai/data-table';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import type { MenuItem } from 'svelai/menu';
	import { PopupMenu } from 'svelai/popup-menu';
	import { SpinnerText } from 'svelai/spinner-text';
	import { arrowClockwiseIcon } from 'svelai/icons/arrowClockwise';
	import { dotsThreeIcon } from 'svelai/icons/dotsThree';
	import { eyeIcon } from 'svelai/icons/eye';
	import { pencilSimpleIcon } from 'svelai/icons/pencilSimple';

	interface Customer {
		id: string;
		name: string;
		email: string;
		company: string;
		plan: 'Starter' | 'Growth' | 'Scale';
		status: 'Active' | 'Trial' | 'Paused';
		monthlySpend: number;
		lastActive: string;
	}

	const firstNames = ['Amelia', 'Noah', 'Sofia', 'Liam', 'Maya', 'Ethan', 'Lina', 'Leo', 'Nora'];
	const lastNames = ['Chen', 'Martin', 'Silva', 'Wilson', 'Okafor', 'Dubois'];
	const companies = ['Northwind', 'Acme Studio', 'Globex', 'Lumon', 'Initech', 'Stark Labs'];
	const plans: Customer['plan'][] = ['Starter', 'Growth', 'Scale'];
	const statuses: Customer['status'][] = ['Active', 'Active', 'Trial', 'Active', 'Paused'];

	const customers: Customer[] = Array.from({ length: 54 }, (_, index) => {
		const firstName = firstNames[index % firstNames.length] ?? 'Alex';
		const lastName = lastNames[index % lastNames.length] ?? 'Morgan';
		const name = `${firstName} ${lastName}`;

		return {
			id: `customer-${index + 1}`,
			name,
			email: `${firstName}.${lastName}${index + 1}@example.com`.toLowerCase(),
			company: companies[index % companies.length] ?? 'Northwind',
			plan: plans[index % plans.length] ?? 'Starter',
			status: statuses[index % statuses.length] ?? 'Active',
			monthlySpend: 320 + ((index * 173) % 3200),
			lastActive: index % 7 === 0 ? 'Yesterday' : `${(index % 48) + 2} min ago`
		};
	});

	const columns: DataTableColumn<Customer>[] = [
		{ id: 'name', accessor: 'name', header: 'Customer', sortable: true, width: 190 },
		{ id: 'company', accessor: 'company', header: 'Company', sortable: true, width: 170 },
		{ id: 'plan', accessor: 'plan', header: 'Plan', sortable: true, width: 120 },
		{ id: 'status', accessor: 'status', header: 'Status', sortable: true, width: 120 },
		{
			id: 'monthlySpend',
			accessor: 'monthlySpend',
			header: 'Monthly spend',
			sortable: true,
			align: 'end',
			width: 150
		},
		{ id: 'lastActive', accessor: 'lastActive', header: 'Last active', width: 130 }
	];

	let tableState = $state(createDataTableState(columns, { pagination: { page: 1, pageSize: 8 } }));
	let rows = $state<Customer[]>([]);
	let rowCount = $state(0);
	let loading = $state(true);
	let error = $state<unknown>(null);
	let requestRevision = $state(0);
	let lastSynced = $state('Waiting for first response');
	let actionMessage = $state('Choose a row action to continue.');

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(value);

	const statusColor = (status: unknown): 'success' | 'warning' | 'neutral' => {
		if (status === 'Active') return 'success';
		if (status === 'Trial') return 'warning';
		return 'neutral';
	};

	const getSortValue = (customer: Customer, columnId: string): string | number => {
		switch (columnId) {
			case 'name':
				return customer.name;
			case 'company':
				return customer.company;
			case 'plan':
				return customer.plan;
			case 'status':
				return customer.status;
			case 'monthlySpend':
				return customer.monthlySpend;
			default:
				return customer.lastActive;
		}
	};

	const processServerQuery = (state: DataTableState) => {
		const search = state.globalFilter.trim().toLocaleLowerCase();
		let matches = customers.filter((customer) =>
			[customer.name, customer.email, customer.company, customer.plan, customer.status].some(
				(value) => value.toLocaleLowerCase().includes(search)
			)
		);

		const sorting = state.sorting[0];
		if (sorting) {
			matches = [...matches].sort((left, right) => {
				const leftValue = getSortValue(left, sorting.id);
				const rightValue = getSortValue(right, sorting.id);
				const comparison =
					typeof leftValue === 'number' && typeof rightValue === 'number'
						? leftValue - rightValue
						: String(leftValue).localeCompare(String(rightValue));
				return comparison * (sorting.desc ? -1 : 1);
			});
		}

		const start = (state.pagination.page - 1) * state.pagination.pageSize;
		return {
			rows: matches.slice(start, start + state.pagination.pageSize),
			rowCount: matches.length
		};
	};

	const requestServerPage = (state: DataTableState, signal: AbortSignal) =>
		new Promise<ReturnType<typeof processServerQuery>>((resolve, reject) => {
			const timer = setTimeout(() => {
				signal.removeEventListener('abort', abortRequest);
				resolve(processServerQuery(state));
			}, 650);

			const abortRequest = () => {
				clearTimeout(timer);
				reject(new DOMException('Request aborted', 'AbortError'));
			};

			if (signal.aborted) {
				abortRequest();
				return;
			}

			signal.addEventListener('abort', abortRequest, { once: true });
		});

	const createRowMenu = (customer: Customer): MenuItem[] => [
		{
			type: 'option',
			children: 'View customer',
			prefix: eyeIcon,
			onclick: () => {
				actionMessage = `Opened ${customer.name} at ${customer.company}.`;
			}
		},
		{
			type: 'option',
			children: 'Edit details',
			prefix: pencilSimpleIcon,
			onclick: () => {
				actionMessage = `Editing ${customer.name}.`;
			}
		}
	];

	$effect(() => {
		void requestRevision;
		const controller = new AbortController();
		const requestState = $state.snapshot(tableState);
		loading = true;
		error = null;

		void requestServerPage(requestState, controller.signal)
			.then((response) => {
				rows = response.rows;
				rowCount = response.rowCount;
				lastSynced = new Intl.DateTimeFormat('en-US', {
					hour: 'numeric',
					minute: '2-digit'
				}).format(new Date());
			})
			.catch((reason: unknown) => {
				if (reason instanceof DOMException && reason.name === 'AbortError') return;
				error = reason;
			})
			.finally(() => {
				if (!controller.signal.aborted) loading = false;
			});

		return () => controller.abort();
	});
</script>

{#snippet cell(payload: DataTableCellRenderPayload<Customer>)}
	{#if payload.columnId === 'status'}
		<Chip size="small" variant="soft" color={statusColor(payload.value)}>
			{String(payload.value)}
		</Chip>
	{:else if payload.columnId === 'monthlySpend'}
		<span class="font-medium tabular-nums text-neutral">
			{formatCurrency(Number(payload.value))}
		</span>
	{:else}
		{@render payload.renderDefault()}
	{/if}
{/snippet}

{#snippet rowActions(payload: DataTableRowPayload<Customer>)}
	<PopupMenu
		position="bottom-end"
		menu={{ items: createRowMenu(payload.row), density: 'small' }}
		trigger={{
			label: `Actions for ${payload.row.name}`,
			prefix: dotsThreeIcon,
			squared: true,
			size: 'small',
			variant: 'ghost'
		}}
	/>
{/snippet}

{#snippet toolbarSuffix()}
	<Button
		size="small"
		variant="ghost"
		prefix={arrowClockwiseIcon}
		{loading}
		{...{ onclick: () => (requestRevision += 1) }}
	>
		Refresh
	</Button>
{/snippet}

{#snippet loadingContent()}
	<div class="flex justify-center p-xl">
		<SpinnerText
			texts={['Querying customer service', 'Loading the current page']}
			delay={900}
			color="primary"
		/>
	</div>
{/snippet}

<section class="flex flex-col gap-lg rounded-lg border border-neutral-muted bg-surface-raised p-lg">
	<header class="flex flex-wrap items-end justify-between gap-md">
		<div class="flex flex-col gap-xs">
			<p class="text-sm font-medium text-primary-readable">Customer operations</p>
			<h2 class="text-2xl font-semibold tracking-tight text-neutral">Accounts</h2>
			<p class="text-sm text-neutral/60">
				Search, sort, and page through records processed by a simulated remote service.
			</p>
		</div>
		<div class="flex flex-col items-end gap-xs text-sm text-neutral/60">
			<span>{rowCount} matching records</span>
			<span>Last synced: {lastSynced}</span>
		</div>
	</header>

	<DataTable
		items={rows}
		{columns}
		getRowId={(customer) => customer.id}
		height={440}
		processingMode="manual"
		{rowCount}
		bind:state={tableState}
		search={{ placeholder: 'Search customers, plans, or companies', debounce: 250 }}
		pagination={{ pageSize: 8, pageSizes: [8, 16, 24] }}
		density="normal"
		showColumnVisibilityControl
		animateRows
		{loading}
		{error}
		{cell}
		{rowActions}
		{toolbarSuffix}
		{loadingContent}
		caption="Remote customer directory"
	/>

	<p class="text-sm text-neutral/60" aria-live="polite">{actionMessage}</p>
</section>
