<script lang="ts">
	const guides = [
		{
			title: 'Controlled definitions and resolved state',
			body: 'tasks, dependencies, and assignments are bindable immutable collections. resources and calendars are immutable inputs. Summaries derive their span and weighted progress from descendants; WBS, working duration, slack, critical state, and violations live on resolved nodes instead of mutating consumer records.'
		},
		{
			title: 'Explicit scheduling time',
			body: 'timeZone is required. Project, task, and resource calendars use explicit IANA zones, half-open working intervals, and civil-date exceptions. Unscheduled tasks stay visible without a bar, while milestones require equal start and end instants.'
		},
		{
			title: 'One mutation boundary',
			body: 'Pointer and touch gestures, keyboard modes, built-in or custom column editors, clipboard, history, and API calls produce the same typed proposals. Move, resize, and range snapping follows the active zoom scale unless timeline.snapDuration fixes a consumer-defined step. Structural checks run before mutations validators; resolved records are revalidated before fresh arrays and changed objects publish. Mutation change callbacks carry one guarded revert and never swallow persistence failures.'
		},
		{
			title: 'Scheduling and completed tasks',
			body: 'All four dependency types support signed lag. Auto-scheduling preserves working duration and never moves a completed leaf task; an impossible successor or constraint is exposed as a violation. Critical-path and slack analysis still includes completed tasks, whose actual dates constrain successors.'
		},
		{
			title: 'Resources are diagnostic',
			body: 'Assignments, task and resource calendars, units, and capacity feed the workload panel and over-allocation markers. Resource hierarchy, filtering, and grouping never rewrite task hierarchy. This version deliberately performs no automatic resource leveling.'
		},
		{
			title: 'Application-owned dialogs',
			body: 'GanttChart does not own create or edit dialogs. Compose events.onTaskDoubleClick or events.onSelect with Svelai Dialog and Form controls, validate the domain record, then publish a fresh controlled array or call the imperative API. Persistence, fetching, retries, and conflict UI remain at the application boundary.'
		},
		{
			title: 'Composition, accessibility, and scale',
			body: 'Every content snippet renders inside component-owned roles, focus targets, selection, hit areas, gestures, and live announcements. M/S/E/P/D/R enter keyboard mutation modes; Enter commits and Escape cancels. One virtual row model and a windowed time axis keep mounted DOM bounded. Size controls typography, controls, and task geometry; density controls spacing and row geometry. Use the ganttChart theme key and CSS metric variables without replacing those owners.'
		}
	];
</script>

<section aria-labelledby="gantt-chart-contract">
	<h2 id="gantt-chart-contract" class="text-neutral text-xl font-semibold">Integration contract</h2>
	<p class="text-neutral/70 mt-2 max-w-4xl text-sm leading-6">
		All scheduled values are absolute <code>Date</code> instants and every range is half-open. Task,
		dependency, resource, assignment, and calendar identifiers must be stable and unique. Invalid
		hierarchies, graph cycles, missing references, contradictory schedules, and stale transactions
		surface as <code>GanttChartError</code>; the component never substitutes plausible data.
	</p>

	<div class="mt-5 grid gap-4 md:grid-cols-2">
		{#each guides as guide (guide.title)}
			<section class="border-neutral-muted bg-surface rounded-xl border p-4">
				<h3 class="text-neutral font-semibold">{guide.title}</h3>
				<p class="text-neutral/65 mt-2 text-sm leading-6">{guide.body}</p>
			</section>
		{/each}
	</div>
</section>
