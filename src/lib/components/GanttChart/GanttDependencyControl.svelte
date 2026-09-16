<script
	lang="ts"
	generics="TTaskFields extends object, TDependencyFields extends object, TResourceFields extends object, TAssignmentFields extends object"
>
	import Slot from '$lib/components/Slot/Slot.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import NumberInput from '$lib/components/Form/NumberInput/NumberInput.svelte';
	import Select from '$lib/components/Form/Select/Select.svelte';
	import HoverCard from '$lib/components/HoverCard/HoverCard.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import type { PopoverState } from '$lib/components/Popover/popover.state.svelte.js';
	import type { GanttDependencyTooltipPayload } from './ganttChart.props.js';
	import type { GanttChartState } from './ganttChart.state.svelte.js';
	import type {
		GanttDependency,
		GanttDependencyGeometry,
		GanttLagUnit,
		GanttResolvedDependency
	} from './ganttChart.types.js';

	let {
		chart,
		dependency,
		geometry,
		onActivate
	}: {
		chart: GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		dependency: GanttResolvedDependency<TTaskFields, TDependencyFields>;
		geometry: GanttDependencyGeometry;
		onActivate: (event: MouseEvent) => void;
	} = $props();

	let draftType = $state<GanttDependency['type']>('finish-start');
	let draftLagValue = $state<number | null>(null);
	let draftLagUnit = $state<GanttLagUnit>('day');
	const messages = $derived(chart.messages);
	const isSelected = $derived(
		chart.selection.kind === 'dependency' &&
			chart.selection.dependencyId === dependency.dependency.id
	);
	const isTabStop = $derived(chart.a11y.isDependencyTabStop(dependency.dependency.id));

	const dependencyDescription = $derived(
		messages.ganttChartDependencyDescription(
			dependency.fromTask.task.title,
			dependency.toTask.task.title,
			dependency.dependency.type
		)
	);
	const lagLabel = $derived(
		dependency.dependency.lag
			? `${messages.ganttChartDependencyLag}: ${dependency.dependency.lag.value} ${dependency.dependency.lag.unit}`
			: null
	);
	const defaultAccessibleLabel = $derived(
		[dependencyDescription, dependency.isCritical ? messages.ganttChartCritical : null, lagLabel]
			.filter(Boolean)
			.join(', ')
	);
	const tooltipPayload = $derived<GanttDependencyTooltipPayload<TTaskFields, TDependencyFields>>({
		dependency,
		geometry,
		defaultAccessibleLabel,
		defaultContent: defaultTooltip
	});
	const focusLeft = $derived((geometry.fromX + geometry.toX) / 2 - 12);
	const focusTop = $derived((geometry.fromY + geometry.toY) / 2 - 12);

	const dependencyTypes = [
		{ value: 'finish-start', label: 'Finish → start' },
		{ value: 'start-start', label: 'Start → start' },
		{ value: 'finish-finish', label: 'Finish → finish' },
		{ value: 'start-finish', label: 'Start → finish' }
	];
	const lagUnits = [
		{ value: 'minute', label: 'Minutes' },
		{ value: 'hour', label: 'Hours' },
		{ value: 'day', label: 'Days' },
		{ value: 'week', label: 'Weeks' }
	];

	function handleKeydown(event: KeyboardEvent, popover: PopoverState): void {
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			event.stopPropagation();
			if (!dependency.dependency.readOnly) {
				chart.removeDependencyFromKeyboard(dependency.dependency.id);
			}
			return;
		}
		if (event.key !== 'Enter' || dependency.dependency.readOnly) return;
		event.preventDefault();
		event.stopPropagation();
		openEditor(popover);
	}

	function openEditor(popover: PopoverState): void {
		draftType = dependency.dependency.type;
		draftLagValue = dependency.dependency.lag?.value ?? null;
		draftLagUnit = dependency.dependency.lag?.unit ?? 'day';
		popover.open();
	}

	function updateDraftType(value: string): void {
		if (
			value === 'finish-start' ||
			value === 'start-start' ||
			value === 'finish-finish' ||
			value === 'start-finish'
		) {
			draftType = value;
		}
	}

	function updateDraftLagUnit(value: string): void {
		if (value === 'minute' || value === 'hour' || value === 'day' || value === 'week') {
			draftLagUnit = value;
		}
	}

	function commitEditor(popover: PopoverState): void {
		const currentLag = dependency.dependency.lag;
		const isUnchanged =
			dependency.dependency.type === draftType &&
			(currentLag === undefined
				? draftLagValue === null
				: currentLag.value === draftLagValue && currentLag.unit === draftLagUnit);
		if (isUnchanged) {
			popover.close();
			return;
		}
		const nextDependency: GanttDependency<TDependencyFields> = {
			...dependency.dependency,
			type: draftType,
			lag: draftLagValue === null ? undefined : { value: draftLagValue, unit: draftLagUnit }
		};
		if (chart.updateDependencyFromInline(nextDependency)) popover.close();
	}
</script>

<div
	class="pointer-events-auto absolute z-20 size-6"
	style:left={`${focusLeft}px`}
	style:top={`${focusTop}px`}
>
	<HoverCard
		position="top"
		offset={10}
		delay={250}
		closeDelay={120}
		openOnFocus
		size="small"
		density="compact"
		triggerClass="size-full"
	>
		{#snippet trigger()}
			<Popover position="bottom" lockScroll={false} openOnClick={false} class="w-72 p-3">
				{#snippet trigger(popover)}
					<button
						type="button"
						aria-label={defaultAccessibleLabel}
						aria-pressed={isSelected}
						aria-describedby={chart.a11y.instructionsId}
						aria-keyshortcuts="Enter Delete Backspace"
						aria-haspopup={dependency.dependency.readOnly ? undefined : 'dialog'}
						aria-expanded={dependency.dependency.readOnly ? undefined : popover.isOpen}
						disabled={chart.disabled}
						tabindex={isTabStop && !chart.disabled ? 0 : -1}
						data-gantt-chart-part="connector-control"
						data-dependency-id={dependency.dependency.id}
						class="focus-visible:ring-focus/50 relative size-full rounded-full bg-transparent opacity-0 outline-none focus-visible:opacity-100 focus-visible:ring-2"
						onclick={onActivate}
						onfocus={() => chart.a11y.setDependencyTarget(dependency.dependency.id)}
						ondblclick={(event) => {
							event.stopPropagation();
							if (!dependency.dependency.readOnly) openEditor(popover);
						}}
						onkeydown={(event) => handleKeydown(event, popover)}
						{@attach popover.reference}
					></button>
				{/snippet}

				{#snippet children(popover)}
					<div class="grid gap-3" data-gantt-chart-part="dependency-editor">
						<Select
							size="small"
							label={messages.ganttChartDependencyType}
							items={dependencyTypes}
							value={draftType}
							onValueChange={(value) => {
								if (value !== null) updateDraftType(value);
							}}
						/>
						<div class="grid grid-cols-2 gap-2">
							<NumberInput
								size="small"
								label={messages.ganttChartDependencyLag}
								value={draftLagValue}
								showControls={false}
								onValueChange={(value) => (draftLagValue = value)}
							/>
							<Select
								size="small"
								label={messages.ganttChartDependencyLagUnit}
								items={lagUnits}
								value={draftLagUnit}
								onValueChange={(value) => {
									if (value !== null) updateDraftLagUnit(value);
								}}
							/>
						</div>
						<div class="flex justify-end gap-2">
							<Button size="small" variant="ghost" onclick={() => popover.close()}>
								{messages.ganttChartCancel}
							</Button>
							<Button size="small" onclick={() => commitEditor(popover)}>
								{messages.ganttChartApply}
							</Button>
						</div>
					</div>
				{/snippet}
			</Popover>
		{/snippet}

		<Slot render={chart.renderers?.dependencyTooltip ?? defaultTooltip} payload={tooltipPayload} />
	</HoverCard>
</div>

{#snippet defaultTooltip()}
	<div class="grid gap-0.5">
		<strong>{dependencyDescription}</strong>
		{#if dependency.isCritical}<span>{messages.ganttChartCritical}</span>{/if}
		{#if lagLabel}<span>{lagLabel}</span>{/if}
	</div>
{/snippet}
