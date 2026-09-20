<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import GanttChartGuide from './GanttChartGuide.svelte';
	import GanttChartCustomizationDemo from './GanttChartCustomizationDemo.svelte';
	import GanttChartDependenciesDemo from './GanttChartDependenciesDemo.svelte';
	import GanttChartHierarchyDemo from './GanttChartHierarchyDemo.svelte';
	import GanttChartInteractionsDemo from './GanttChartInteractionsDemo.svelte';
	import GanttChartLargeDataDemo from './GanttChartLargeDataDemo.svelte';
	import GanttChartLoadingRtlDemo from './GanttChartLoadingRtlDemo.svelte';
	import GanttChartOverviewDemo from './GanttChartOverviewDemo.svelte';
	import GanttChartResourcesDemo from './GanttChartResourcesDemo.svelte';
	import {
		customizationCode,
		dependenciesCode,
		hierarchyCode,
		interactionsCode,
		largeDataCode,
		loadingRtlCode,
		overviewCode,
		resourcesCode
	} from './codeSnippets.js';

	const usageControls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: [
				{ value: 'small', label: 'Small' },
				{ value: 'normal', label: 'Normal' },
				{ value: 'large', label: 'Large' }
			]
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: [
				{ value: 'compact', label: 'Compact' },
				{ value: 'normal', label: 'Normal' },
				{ value: 'comfortable', label: 'Comfortable' }
			]
		},
		{
			name: 'height',
			type: 'slider',
			label: 'Height',
			value: 544,
			min: 416,
			max: 736,
			step: 64,
			showValue: true,
			class: 'w-36'
		},
		{
			name: 'state',
			type: 'segmented',
			label: 'State',
			value: 'ready',
			options: [
				{ value: 'ready', label: 'Ready' },
				{ value: 'loading', label: 'Loading' },
				{ value: 'disabled', label: 'Disabled' }
			]
		},
		{ name: 'grid', type: 'switch', label: 'Tree grid', value: true },
		{ name: 'todayIndicator', type: 'switch', label: 'Today line', value: true },
		{ name: 'weekends', type: 'switch', label: 'Weekends', value: true },
		{ name: 'criticalPath', type: 'switch', label: 'Critical path', value: false }
	]);
</script>

<DocPage
	title="Gantt chart"
	subtitle="A typed project-scheduling surface with a hierarchical task grid, explicit working calendars, dependency analysis, and immutable controlled state."
	component="GanttChart"
	features={[
		'Hierarchical task definitions with derived summaries and WBS',
		'Explicit IANA zones, working calendars, constraints, and dependency DAG validation',
		'Critical-path, total/free slack, and resource workload analysis',
		'Bindable tasks, dependencies, assignments, expansion, selection, and zoom',
		'Entasis theme and snippet composition inside owned semantics',
		'SSR-safe split shell with bounded row and time-axis windowing'
	]}
>
	<GanttChartGuide />

	<ComponentCard
		controls={usageControls}
		title="Controlled project shell"
		description="Change visual size, layout density, height, state, and grouped view options while the tree and timeline keep one hierarchy, row model, selection, and vertical scroll owner."
		code={overviewCode}
		class="min-h-0 items-stretch p-3 md:p-5"
	>
		<GanttChartOverviewDemo
			size={usageControls.value.size}
			density={usageControls.value.density}
			height={usageControls.value.height}
			demoState={usageControls.value.state}
			showGrid={usageControls.value.grid}
			showTodayIndicator={usageControls.value.todayIndicator}
			showWeekends={usageControls.value.weekends}
			showCriticalPath={usageControls.value.criticalPath}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Hierarchy, typed columns, sorting, and filtering"
			description="Summaries derive their schedule and progress from descendants. Expand or collapse the controlled hierarchy, sort from owned column headers, filter without flattening away ancestors, and press F2 to edit a built-in or custom column through the task mutation pipeline."
			code={hierarchyCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<GanttChartHierarchyDemo />
		</ComponentCard>

		<ComponentCard
			title="Direct manipulation, keyboard, clipboard, and history"
			description="Pointer, touch, keyboard modes, inline editing, clipboard, API calls, and history converge on immutable proposals. The callback exposes a guarded one-shot revert; empty-range selection remains a proposal rather than a fabricated task."
			code={interactionsCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<GanttChartInteractionsDemo />
		</ComponentCard>

		<ComponentCard
			title="Dependencies, constraints, and critical path"
			description="Select a connector to inspect or edit its lag. Create links from task handles, toggle forward auto-scheduling, and inspect component-derived critical tasks, links, slack, constraints, baselines, deadlines, and explicit violations."
			code={dependenciesCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<GanttChartDependenciesDemo />
		</ComponentCard>

		<ComponentCard
			title="Resources, assignments, and workload"
			description="Typed resource and assignment fields reach snippets. Resource filters and grouping share the task row model; the compact workload panel respects resource calendars and capacity, marks over-allocation, and never levels tasks automatically."
			code={resourcesCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<GanttChartResourcesDemo />
		</ComponentCard>

		<ComponentCard
			title="Owned behavior, custom content, application dialog"
			description="Snippets replace presentation inside GanttChart-owned semantic wrappers. Double-click a task to open a Entasis Dialog with a Form input; the application validates and publishes a fresh controlled task array instead of delegating a hidden editor to the chart."
			code={customizationCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<GanttChartCustomizationDemo />
		</ComponentCard>

		<ComponentCard
			title="Loading, RTL, and a DST boundary"
			description="Loading preserves the chart geometry and safe navigation while blocking mutation. RTL mirrors physical controls without reversing chronology, and the explicit America/New_York calendar crosses the 2026 spring DST transition without inferring a browser zone."
			code={loadingRtlCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<GanttChartLoadingRtlDemo />
		</ComponentCard>

		<ComponentCard
			title="5,000 controlled tasks, bounded mounted rows"
			description="The shared virtual row model owns its safe off-screen buffer and mounts only a bounded set in both panes. Jump between the first and last definitions while the live counter reports the mounted tree-row population."
			code={largeDataCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<GanttChartLargeDataDemo />
		</ComponentCard>
	{/snippet}
</DocPage>
