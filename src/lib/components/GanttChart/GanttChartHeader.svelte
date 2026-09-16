<script
	lang="ts"
	generics="TTaskFields extends object, TDependencyFields extends object, TResourceFields extends object, TAssignmentFields extends object"
>
	import Button from '$lib/components/Button/Button.svelte';
	import ButtonGroup from '$lib/components/ButtonGroup/ButtonGroup.svelte';
	import Select from '$lib/components/Form/Select/Select.svelte';
	import { arrowsInIcon } from '$lib/components/Icons/arrowsIn.js';
	import { calendarIcon } from '$lib/components/Icons/calendar.js';
	import { minusIcon } from '$lib/components/Icons/minus.js';
	import { plusIcon } from '$lib/components/Icons/plus.js';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { getDateTimeFormatter } from '$lib/scheduling/zonedTime.js';
	import type { GanttHeaderPayload } from './ganttChart.props.js';
	import type { GanttChartState } from './ganttChart.state.svelte.js';
	import type { GanttZoomLevel } from './ganttChart.types.js';

	let {
		chart
	}: {
		chart: GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
	} = $props();

	const snapshot = $derived(chart.snapshot);
	const messages = $derived(chart.messages);
	const header = $derived(chart.renderers?.header || undefined);
	const actions = $derived(chart.renderers?.actions);

	const zoomLabels = $derived<Record<string, string>>({
		hour: messages.ganttChartHourZoom,
		day: messages.ganttChartDayZoom,
		week: messages.ganttChartWeekZoom,
		month: messages.ganttChartMonthZoom,
		quarter: messages.ganttChartQuarterZoom,
		year: messages.ganttChartYearZoom
	});
	const zoomItems = $derived(
		chart.enabledZoomLevels.map((zoom) => ({ value: zoom, label: zoomLabels[zoom] ?? zoom }))
	);
	const rangeTitle = $derived(
		getDateTimeFormatter(chart.messages.locale, chart.timeZone, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).formatRange(snapshot.visibleRange.start, snapshot.visibleRange.end)
	);
	const zoomButtons = $derived([
		{
			type: 'button' as const,
			prefix: minusIcon,
			label: messages.ganttChartZoomOut,
			onclick: () => chart.zoomOut()
		},
		{
			type: 'button' as const,
			prefix: plusIcon,
			label: messages.ganttChartZoomIn,
			onclick: () => chart.zoomIn()
		}
	]);
</script>

<div
	data-gantt-chart-part="header"
	class={chart.classes.header({
		...chart.themeVariants,
		class: chart.scrollMode === 'page' ? 'sticky top-0 z-40' : undefined
	})}
>
	{#if header}
		{@const payload = {
			...snapshot,
			zoomOut: zoomOutPart,
			zoomIn: zoomInPart,
			fitProject: fitProjectPart,
			today: todayPart,
			zoomControl: zoomControlPart,
			actions: actionsPart
		} satisfies GanttHeaderPayload<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>}
		<Slot render={header} {payload} />
	{:else}
		<div data-gantt-chart-part="navigation" class={chart.classes.navigation(chart.themeVariants)}>
			{@render todayPart()}
			{@render fitProjectPart()}
		</div>
		<div
			data-gantt-chart-part="title"
			class={chart.classes.title(chart.themeVariants)}
			role="status"
			aria-live="polite"
		>
			{rangeTitle}
		</div>
		{@render zoomControlPart()}
		{@render actionsPart()}
	{/if}
</div>

{#snippet zoomOutPart()}
	<Button
		type="button"
		squared
		size={chart.size}
		variant="ghost"
		color="neutral"
		prefix={minusIcon}
		label={messages.ganttChartZoomOut}
		disabled={chart.disabled}
		onclick={() => chart.zoomOut()}
	/>
{/snippet}

{#snippet zoomInPart()}
	<Button
		type="button"
		squared
		size={chart.size}
		variant="ghost"
		color="neutral"
		prefix={plusIcon}
		label={messages.ganttChartZoomIn}
		disabled={chart.disabled}
		onclick={() => chart.zoomIn()}
	/>
{/snippet}

{#snippet fitProjectPart()}
	<Button
		type="button"
		squared
		size={chart.size}
		variant="ghost"
		color="neutral"
		prefix={arrowsInIcon}
		label={messages.ganttChartFitProject}
		disabled={chart.disabled}
		onclick={() => chart.fitProject()}
	/>
{/snippet}

{#snippet todayPart()}
	<Button
		type="button"
		size={chart.size}
		variant="outline"
		color={chart.color}
		prefix={calendarIcon}
		disabled={chart.disabled}
		onclick={() => chart.scrollToDate(new Date())}
	>
		{messages.ganttChartToday}
	</Button>
{/snippet}

{#snippet zoomControlPart()}
	<div data-gantt-chart-part="zoom-control" class={chart.classes.zoomControl(chart.themeVariants)}>
		<ButtonGroup
			items={zoomButtons}
			size={chart.size}
			variant="ghost"
			color="neutral"
			disabled={chart.disabled}
		/>
		<Select
			items={zoomItems}
			value={snapshot.zoom}
			size={chart.size}
			density={chart.density}
			disabled={chart.disabled}
			label={messages.ganttChartZoomLevel}
			onValueChange={(zoom) => chart.setZoom(zoom as GanttZoomLevel)}
		/>
	</div>
{/snippet}

{#snippet actionsPart()}
	{#if actions}
		<div data-gantt-chart-part="actions" class={chart.classes.actions(chart.themeVariants)}>
			<Slot render={actions} payload={snapshot} />
		</div>
	{/if}
{/snippet}
