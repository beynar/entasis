<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { DataTable } from 'entasis/data-table';

	let orders = $state([
		{ id: 'ORD-1048', customer: 'Maya Chen', amount: 128, status: 'Pending' },
		{ id: 'ORD-1049', customer: 'Sam Rivera', amount: 84, status: 'Pending' },
		{ id: 'ORD-1050', customer: 'Alex Morgan', amount: 246, status: 'Fulfilled' },
		{ id: 'ORD-1051', customer: 'Jordan Lee', amount: 65, status: 'Pending' },
		{ id: 'ORD-1052', customer: 'Nina Patel', amount: 192, status: 'Pending' }
	]);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header>
		<h2 class="text-3xl font-semibold">Orders, ready to move.</h2>
		<p class="mt-sm text-neutral/70 text-sm">Select sample orders and mark them fulfilled.</p>
	</header>
	<Card
		><DataTable
			items={orders}
			columns={[
				{ id: 'id', accessor: 'id', header: 'Order', sortable: true },
				{ id: 'customer', accessor: 'customer', header: 'Customer', sortable: true },
				{ id: 'amount', accessor: 'amount', header: 'Total', sortable: true, align: 'end' },
				{ id: 'status', accessor: 'status', header: 'Status', sortable: true }
			]}
			getRowId={(order) => order.id}
			selectionMode="multiple"
			search
			pagination={{ pageSize: 6 }}
			caption="Demo orders"
			>{#snippet bulkActions({ selectedRows, clearSelection })}<Button
					size="small"
					onclick={() => {
						const ids = new Set(selectedRows.map((order) => order.id));
						orders = orders.map((order) =>
							ids.has(order.id) ? { ...order, status: 'Fulfilled' } : order
						);
						clearSelection();
					}}>Fulfill {selectedRows.length} orders</Button
				>{/snippet}{#snippet cell(payload)}{#if payload.columnId === 'status'}<Chip
						size="small"
						color={payload.value === 'Fulfilled' ? 'success' : 'warning'}
						>{String(payload.value)}</Chip
					>{:else if payload.columnId === 'amount'}${Number(payload.value).toFixed(
						2
					)}{:else}{@render payload.renderDefault()}{/if}{/snippet}</DataTable
		></Card
	>
</Stack>
