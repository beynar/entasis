<script lang="ts" generics="TData">
	import type { Column } from '@tanstack/table-core';
	import Button from '../Button/Button.svelte';
	import Checkbox from '../Form/Checkbox/Checkbox.svelte';
	import CheckboxesInput from '../Form/CheckboxesInput/CheckboxesInput.svelte';
	import DateInput from '../Form/DateInput/DateInput.svelte';
	import NumberInput from '../Form/NumberInput/NumberInput.svelte';
	import Select from '../Form/Select/Select.svelte';
	import TextInput from '../Form/TextInput/TextInput.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { DataTableClasses } from './dataTable.theme.js';
	import type { DataTableModel } from './dataTable.model.svelte.js';

	let {
		column,
		model,
		classes,
		separated = false
	}: {
		column: Column<TData, unknown>;
		model: DataTableModel<TData>;
		classes: DataTableClasses;
		separated?: boolean;
	} = $props();

	const config = $derived(model.getColumnConfig(column.id));
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
	let multiSelectFrame: number | undefined;

	const scheduleMultiSelectFilter = (next: string[]) => {
		if (multiSelectFrame !== undefined) cancelAnimationFrame(multiSelectFrame);
		multiSelectFrame = requestAnimationFrame(() => {
			multiSelectFrame = undefined;
			model.setColumnFilter(column.id, next.length ? next : undefined);
		});
	};

	const clearFilter = () => {
		if (config?.filter?.type === 'multi-select') {
			scheduleMultiSelectFilter([]);
			return;
		}
		model.setColumnFilter(column.id, undefined);
	};

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

{#if config?.filter}
	<div class={classes.filterPanel({ separated })}>
		<div class={classes.filterHeader()}>
			<span class={classes.filterLabel()}>Filter</span>
			<Button
				type="button"
				variant="ghost"
				color="neutral"
				size="small"
				disabled={!active || model.props.disabled}
				onclick={clearFilter}
			>
				Clear
			</Button>
		</div>

		{#if config.filter.type === 'custom' && filterPayload}
			<Slot render={config.filter.render} payload={filterPayload} />
		{:else if config.filter.type === 'text'}
			<TextInput
				size="small"
				placeholder={config.filter.placeholder ?? 'Filter values'}
				value={typeof value === 'string' ? value : ''}
				disabled={model.props.disabled}
				onValueChange={(next) => model.setColumnFilter(column.id, next || undefined)}
			/>
		{:else if config.filter.type === 'number'}
			<div class={classes.filterFields()}>
				<NumberInput
					size="small"
					placeholder="Minimum"
					min={config.filter.min}
					max={config.filter.max}
					value={(value as { min?: number } | undefined)?.min ?? null}
					disabled={model.props.disabled}
					onValueChange={(next) => setNumberBound('min', next)}
				/>
				<NumberInput
					size="small"
					placeholder="Maximum"
					min={config.filter.min}
					max={config.filter.max}
					value={(value as { max?: number } | undefined)?.max ?? null}
					disabled={model.props.disabled}
					onValueChange={(next) => setNumberBound('max', next)}
				/>
			</div>
		{:else if config.filter.type === 'select'}
			<Select
				size="small"
				placeholder="All values"
				items={[...config.filter.options]}
				value={typeof value === 'string' ? value : null}
				disabled={model.props.disabled}
				onValueChange={(next) => model.setColumnFilter(column.id, next || undefined)}
			/>
		{:else if config.filter.type === 'multi-select'}
			<CheckboxesInput
				items={config.filter.options.map((option) => ({
					value: option.value,
					label: option.label
				}))}
				value={Array.isArray(value) ? value.map(String) : []}
				disabled={model.props.disabled}
				theme={{
					root: { base: classes.filterCheckboxGroup() },
					checkboxesInputContainer: { base: classes.filterCheckboxContainer() },
					checkboxesInputItem: { base: classes.filterCheckboxItem() },
					checkboxesInputItemTrack: { base: classes.filterCheckboxIndicator() },
					checkboxesInputItemThumb: { base: classes.filterCheckboxIndicator() }
				}}
				onValueChange={scheduleMultiSelectFilter}
			/>
		{:else if config.filter.type === 'date'}
			<div class={classes.filterFields()}>
				<DateInput
					size="small"
					placeholder="From"
					minDate={config.filter.min}
					maxDate={config.filter.max}
					value={(value as { start?: Date } | undefined)?.start ?? null}
					disabled={model.props.disabled}
					onValueChange={(next) => setDateBound('start', next)}
				/>
				<DateInput
					size="small"
					placeholder="To"
					minDate={config.filter.min}
					maxDate={config.filter.max}
					value={(value as { end?: Date } | undefined)?.end ?? null}
					disabled={model.props.disabled}
					onValueChange={(next) => setDateBound('end', next)}
				/>
			</div>
		{:else if config.filter.type === 'boolean'}
			<div class={classes.filterFields()}>
				<Checkbox
					mode="control"
					ariaLabel={config.filter.trueLabel ?? 'True'}
					value={value === true}
					disabled={model.props.disabled}
					onValueChange={(next) => model.setColumnFilter(column.id, next ? true : undefined)}
				/>
				<span>{config.filter.trueLabel ?? 'True'}</span>
				<Checkbox
					mode="control"
					ariaLabel={config.filter.falseLabel ?? 'False'}
					value={value === false}
					disabled={model.props.disabled}
					onValueChange={(next) => model.setColumnFilter(column.id, next ? false : undefined)}
				/>
				<span>{config.filter.falseLabel ?? 'False'}</span>
			</div>
		{/if}
	</div>
{/if}
