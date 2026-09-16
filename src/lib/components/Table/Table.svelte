<script lang="ts">
	import type { TableCell, TableCellValue, TableProps } from './table.props.js';
	import { useTableTheme } from './table.theme.js';
	import Slot from '../Slot/Slot.svelte';

	let {
		header,
		footer,
		items,
		prefix,
		suffix,
		caption,
		density = 'normal',
		class: className,
		theme,
		...attachments
	}: TableProps = $props();

	const classes = $derived(useTableTheme(theme));

	const headerKeys = $derived(header ? Object.keys(header) : []);

	/**
	 * Normalizes a TableCellValue to a TableCell.
	 * If it's already a TableCell (object), returns it as-is.
	 * If it's a Slot (string or Snippet), wraps it in { content: value }.
	 */
	function normalizeCell(value: TableCellValue): TableCell {
		// If it's a string or function, it's a Slot - wrap it
		if (typeof value === 'string' || typeof value === 'function') {
			return { content: value };
		}
		// Otherwise, it's already a TableCell object
		return value;
	}
</script>

{#snippet renderCell(cellValue: TableCellValue, isHeader = false)}
	{@const cell = normalizeCell(cellValue)}
	{#if isHeader}
		<th
			class={classes.head({ density, class: cell.class })}
			rowspan={cell.rowSpan || undefined}
			colspan={cell.colSpan || undefined}
		>
			<Slot render={cell.content} />
		</th>
	{:else}
		<td
			class={classes.cell({ density, class: cell.class })}
			rowspan={cell.rowSpan || undefined}
			colspan={cell.colSpan || undefined}
		>
			<Slot render={cell.content} />
		</td>
	{/if}
{/snippet}

<div data-density={density} class={classes.root({ className })} {...attachments}>
	<Slot render={prefix} class={classes.prefix()} />
	<table class={classes.table()}>
		<Slot render={caption} as="caption" class={classes.caption({ density })} />

		{#if header && headerKeys.length > 0}
			<thead class={classes.thead()}>
				<tr class={classes.row({ density })}>
					{#each headerKeys as key (key)}
						{@render renderCell(header[key]!, true)}
					{/each}
				</tr>
			</thead>
		{/if}

		{#if items && items.length > 0}
			<tbody class={classes.tbody()}>
				{#each items as row, index (index)}
					<tr
						data-state={row.selected ? 'selected' : undefined}
						class={classes.row({ density, selected: !!row.selected, class: row.class })}
					>
						{#if row.content}
							<Slot render={row.content} />
						{:else if row.cells}
							{#if headerKeys.length > 0}
								{#each headerKeys as key (key)}
									{#if row.cells[key]}
										{@render renderCell(row.cells[key]!, false)}
									{/if}
								{/each}
							{:else}
								{#each Object.keys(row.cells) as key (key)}
									{@render renderCell(row.cells[key]!, false)}
								{/each}
							{/if}
						{/if}
					</tr>
				{/each}
			</tbody>
		{/if}

		{#if footer && Object.keys(footer).length > 0}
			<tfoot class={classes.tfoot()}>
				<tr class={classes.row({ density })}>
					{#if headerKeys.length > 0}
						{#each headerKeys as key (key)}
							{#if footer[key]}
								{@render renderCell(footer[key]!, false)}
							{/if}
						{/each}
					{:else}
						{#each Object.keys(footer) as key (key)}
							{@render renderCell(footer[key]!, false)}
						{/each}
					{/if}
				</tr>
			</tfoot>
		{/if}
	</table>
	<Slot render={suffix} class={classes.suffix()} />
</div>
