<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import {
		GanttChart,
		type GanttDependency,
		type GanttDependencyCreationRequest,
		type GanttTask
	} from '$lib/components/GanttChart/index.js';
	import { parisProjectCalendar } from './ganttChartDemoData.js';

	let autoSchedule = $state(true);
	let nextDependencyId = 10;
	let status = $state(
		'Critical tasks and links are highlighted from the current dependency graph.'
	);
	let tasks = $state<GanttTask[]>([
		{
			id: 'discovery',
			title: 'Discovery',
			start: new Date('2026-07-27T07:00:00.000Z'),
			end: new Date('2026-07-29T15:00:00.000Z'),
			progress: 1,
			baseline: {
				start: new Date('2026-07-27T07:00:00.000Z'),
				end: new Date('2026-07-29T15:00:00.000Z')
			}
		},
		{
			id: 'design',
			title: 'Design',
			start: new Date('2026-07-30T07:00:00.000Z'),
			end: new Date('2026-08-04T15:00:00.000Z'),
			progress: 0.65,
			deadline: new Date('2026-08-05T15:00:00.000Z')
		},
		{
			id: 'content',
			title: 'Content',
			start: new Date('2026-07-30T07:00:00.000Z'),
			end: new Date('2026-08-03T15:00:00.000Z'),
			progress: 0.45
		},
		{
			id: 'build',
			title: 'Build',
			start: new Date('2026-08-05T07:00:00.000Z'),
			end: new Date('2026-08-12T15:00:00.000Z'),
			progress: 0.15,
			constraint: { type: 'start-no-earlier-than', date: new Date('2026-08-05T07:00:00.000Z') }
		},
		{
			id: 'launch',
			title: 'Launch',
			type: 'milestone',
			start: new Date('2026-08-13T09:00:00.000Z'),
			end: new Date('2026-08-13T09:00:00.000Z'),
			constraint: { type: 'must-finish-on', date: new Date('2026-08-13T09:00:00.000Z') }
		}
	]);
	let dependencies = $state<GanttDependency[]>([
		{ id: 'discovery-design', fromTaskId: 'discovery', toTaskId: 'design', type: 'finish-start' },
		{ id: 'discovery-content', fromTaskId: 'discovery', toTaskId: 'content', type: 'finish-start' },
		{ id: 'design-build', fromTaskId: 'design', toTaskId: 'build', type: 'finish-start' },
		{
			id: 'content-build',
			fromTaskId: 'content',
			toTaskId: 'build',
			type: 'finish-start',
			lag: { value: 1, unit: 'day' }
		},
		{ id: 'build-launch', fromTaskId: 'build', toTaskId: 'launch', type: 'finish-start' }
	]);

	function createDependency(request: GanttDependencyCreationRequest): GanttDependency {
		nextDependencyId += 1;
		return {
			id: `analysis-dependency-${nextDependencyId}`,
			fromTaskId: request.fromTaskId,
			toTaskId: request.toTaskId,
			type: request.type
		};
	}
</script>

<div class="grid w-full gap-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="text-neutral/65 text-sm" aria-live="polite">{status}</p>
		<Button size="small" variant="outline" onclick={() => (autoSchedule = !autoSchedule)}>
			Auto-schedule: {autoSchedule ? 'on' : 'off'}
		</Button>
	</div>
	<GanttChart
		bind:tasks
		bind:dependencies
		calendars={[parisProjectCalendar]}
		timeZone="Europe/Paris"
		schedule={{
			calendarId: parisProjectCalendar.id,
			propagation: autoSchedule ? 'auto' : 'manual'
		}}
		timeline={{
			display: { criticalPath: true, constraints: true, baselines: true, deadlines: true }
		}}
		interactions={{ dependencyCreation: { create: createDependency } }}
		mutations={{
			dependency: {
				onDependenciesChange: (change) => {
					status = `${change.kind} dependency committed from ${change.source}.`;
				}
			}
		}}
		events={{
			onScheduleViolations: ({ violations }) => {
				status =
					violations.length === 0
						? 'The schedule satisfies all current constraints.'
						: `${violations.length} schedule violation${violations.length === 1 ? '' : 's'} detected.`;
			}
		}}
		class="h-[33rem] w-full"
	/>
</div>
