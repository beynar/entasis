<script lang="ts" generics="TData">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import DateInput from '../Form/DateInput/DateInput.svelte';
	import NumberInput from '../Form/NumberInput/NumberInput.svelte';
	import { funnelSimpleIcon } from '../Icons/funnelSimple.js';
	import Slot from '../Slot/Slot.svelte';
	import type { DataTableClasses } from './dataTable.theme.js';
	import type { DataTableModel } from './dataTable.model.svelte.js';
	import type { DataTableColumnInstance } from './dataTable.table.js';

	// The fields of a text, number, date or custom filter, drawn above the column menu's rows.
	// Option filters (select, multi-select, boolean) are rows of the menu's Filter submenu.
	let {
		column,
		model,
		classes
	}: {
		column: DataTableColumnInstance<TData>;
		model: DataTableModel<TData>;
		classes: DataTableClasses;
	} = $props();

	const config = $derived(model.getColumnConfig(column.id));
	const t = $derived(useI18n());
	// The fields have no visible label, so the column name carries their accessible name.
	const columnName = $derived(typeof config?.header === 'string' ? config.header : column.id);
	const value = $derived(model.state.columnFilters.find((entry) => entry.id === column.id)?.value);
	const active = $derived(
		Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ''
	);
	const filterPayload = $derived(
		config
			? {
					column: config,
					value,
					active,
					setValue: (next: unknown) => model.setColumnFilter(column.id, next),
					clear: () => model.setColumnFilter(column.id, undefined)
				}
			: undefined
	);

	const setNumberBound = (bound: 'min' | 'max', next: number | null) => {
		const current = (value as { min?: number; max?: number } | undefined) ?? {};
		const range = { ...current, [bound]: next ?? undefined };
		model.setColumnFilter(
			column.id,
			range.min === undefined && range.max === undefined ? undefined : range
		);
	};

	const setDateBound = (bound: 'start' | 'end', next: Date | null) => {
		const current = (value as { start?: Date; end?: Date } | undefined) ?? {};
		const range = { ...current, [bound]: next ?? undefined };
		model.setColumnFilter(
			column.id,
			range.start === undefined && range.end === undefined ? undefined : range
		);
	};
</script>

{#if config?.filter?.type === 'text'}
	<div class={classes.filterPanel({ layout: 'field' })}>
		{@render funnelSimpleIcon({ class: classes.filterIcon() })}
		<input
			data-1p-ignore
			class={classes.filterInput()}
			type="text"
			autocomplete="off"
			spellcheck="false"
			aria-label={`${t.filter} ${columnName}`}
			placeholder={config.filter.placeholder ?? t.filterValues}
			value={typeof value === 'string' ? value : ''}
			disabled={model.props.disabled}
			oninput={(event) => model.setColumnFilter(column.id, event.currentTarget.value || undefined)}
		/>
	</div>
{:else if config?.filter?.type === 'number'}
	<div class={classes.filterPanel({ layout: 'fields' })}>
		<NumberInput
			size="small"
			showControls={false}
			placeholder={t.minimumLabel}
			inputAttrs={{ 'aria-label': `${columnName} ${t.minimumLabel}` }}
			min={config.filter.min}
			max={config.filter.max}
			value={(value as { min?: number } | undefined)?.min ?? null}
			disabled={model.props.disabled}
			onValueChange={(next) => setNumberBound('min', next)}
		/>
		<NumberInput
			size="small"
			showControls={false}
			placeholder={t.maximumLabel}
			inputAttrs={{ 'aria-label': `${columnName} ${t.maximumLabel}` }}
			min={config.filter.min}
			max={config.filter.max}
			value={(value as { max?: number } | undefined)?.max ?? null}
			disabled={model.props.disabled}
			onValueChange={(next) => setNumberBound('max', next)}
		/>
	</div>
{:else if config?.filter?.type === 'date'}
	<div class={classes.filterPanel({ layout: 'fields' })}>
		<DateInput
			size="small"
			placeholder={t.from}
			minDate={config.filter.min}
			maxDate={config.filter.max}
			value={(value as { start?: Date } | undefined)?.start ?? null}
			disabled={model.props.disabled}
			onValueChange={(next) => setDateBound('start', next)}
		/>
		<DateInput
			size="small"
			placeholder={t.to}
			minDate={config.filter.min}
			maxDate={config.filter.max}
			value={(value as { end?: Date } | undefined)?.end ?? null}
			disabled={model.props.disabled}
			onValueChange={(next) => setDateBound('end', next)}
		/>
	</div>
{:else if config?.filter?.type === 'custom' && filterPayload}
	<div class={classes.filterPanel({ layout: 'custom' })}>
		<Slot render={config.filter.render} payload={filterPayload} />
	</div>
{/if}
