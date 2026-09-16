// Characterisation of the GanttChart undo/redo stack. The history class only reads a narrow slice
// of GanttChartState (tasks/dependencies/assignments/selection + the resource context and the
// interaction options), so it is driven here through a reactive stand-in for that slice: the real
// state class needs a full component render to exist, which would hide the stack semantics behind
// scheduling, validation and DOM concerns.
import { flushSync } from 'svelte';
import { describe, expect, test } from 'vitest';
import {
	GanttChartHistory,
	getModelSignature,
	type GanttModelCommit,
	type GanttModelSnapshot
} from './ganttChart.history.svelte.js';
import type { GanttChartState } from './ganttChart.state.svelte.js';
import type {
	GanttAssignment,
	GanttCalendar,
	GanttDependency,
	GanttResource,
	GanttSelection,
	GanttTask
} from './ganttChart.types.js';

type Snapshot = GanttModelSnapshot<
	Record<never, never>,
	Record<never, never>,
	Record<never, never>
>;
type Commit = GanttModelCommit<Record<never, never>, Record<never, never>, Record<never, never>>;
type History = GanttChartHistory<
	Record<never, never>,
	Record<never, never>,
	Record<never, never>,
	Record<never, never>
>;

const EMPTY_SELECTION: GanttSelection = {
	kind: null,
	taskId: null,
	dependencyId: null,
	cell: null
};

const task = (id: string, day: number): GanttTask => ({
	id,
	title: id,
	start: new Date(Date.UTC(2026, 7, day, 8)),
	end: new Date(Date.UTC(2026, 7, day + 1, 17))
});

/** The slice of GanttChartState the history reads, kept reactive so canUndo/canRedo can be tracked. */
class FakeChart {
	tasks = $state.raw<GanttTask[]>([task('prototype', 3)]);
	dependencies = $state.raw<GanttDependency[]>([]);
	assignments = $state.raw<GanttAssignment[]>([]);
	selection = $state.raw<GanttSelection>(EMPTY_SELECTION);
	resources = $state.raw<readonly GanttResource[]>([]);
	calendars = $state.raw<readonly GanttCalendar[]>([]);
	projectCalendarId: string | undefined = undefined;
	timeZone = 'UTC';
	disabled = $state(false);
	loading = $state(false);
	interactionOptions = $state.raw<{ history?: false | { limit?: number } } | undefined>(undefined);
	get interactions() {
		return { history: this.interactionOptions?.history !== false };
	}
}

type Harness = {
	chart: FakeChart;
	history: History;
	/** Snapshots the model, applies `tasks`, then records the commit like GanttChartMutations does. */
	commit: (tasks: GanttTask[], options?: Partial<Commit>) => (() => void) | undefined;
	restored: Snapshot[];
	setRestoreResult: (value: boolean) => void;
};

const snapshotOf = (chart: FakeChart): Snapshot => ({
	tasks: chart.tasks,
	dependencies: chart.dependencies,
	assignments: chart.assignments,
	selection: chart.selection
});

const createHarness = (): Harness => {
	const chart = new FakeChart();
	const restored: Snapshot[] = [];
	let restoreResult = true;
	const history: History = new GanttChartHistory(
		chart as unknown as GanttChartState<
			Record<never, never>,
			Record<never, never>,
			Record<never, never>,
			Record<never, never>
		>,
		(target) => {
			if (!restoreResult) return false;
			restored.push(target);
			chart.tasks = [...target.tasks];
			chart.dependencies = [...target.dependencies];
			chart.assignments = [...target.assignments];
			chart.selection = target.selection;
			return true;
		}
	);
	return {
		chart,
		history,
		restored,
		setRestoreResult: (value) => (restoreResult = value),
		commit(tasks, options) {
			const before = snapshotOf(chart);
			chart.tasks = tasks;
			return history.record({
				before,
				after: snapshotOf(chart),
				source: 'api',
				title: 'commit',
				...options
			});
		}
	};
};

describe('GanttChart history', () => {
	test('a recorded commit enables undo and leaves redo empty', () => {
		const { history, commit } = createHarness();
		expect(history.canUndo()).toBe(false);

		const forget = commit([task('prototype', 3), task('validation', 7)]);

		expect(typeof forget).toBe('function');
		expect(history.canUndo()).toBe(true);
		expect(history.canRedo()).toBe(false);
	});

	test('undo restores the previous snapshot and enables redo', () => {
		const { chart, history, commit, restored } = createHarness();
		const before = chart.tasks;
		commit([task('prototype', 3), task('validation', 7)]);

		expect(history.undo()).toBe(true);

		expect(restored).toHaveLength(1);
		expect(getModelSignature(restored[0])).toBe(
			getModelSignature({
				tasks: before,
				dependencies: [],
				assignments: [],
				selection: EMPTY_SELECTION
			})
		);
		expect(chart.tasks).toHaveLength(1);
		expect(history.canUndo()).toBe(false);
		expect(history.canRedo()).toBe(true);
	});

	test('redo re-applies the committed snapshot', () => {
		const { chart, history, commit } = createHarness();
		commit([task('prototype', 3), task('validation', 7)]);
		history.undo();

		expect(history.redo()).toBe(true);

		expect(chart.tasks.map((entry) => entry.id)).toEqual(['prototype', 'validation']);
		expect(history.canUndo()).toBe(true);
		expect(history.canRedo()).toBe(false);
	});

	test('undo and redo return false with nothing left on the stack', () => {
		const { history } = createHarness();
		expect(history.undo()).toBe(false);
		expect(history.redo()).toBe(false);
	});

	test('recording after an undo clears the redo stack', () => {
		const { history, commit } = createHarness();
		commit([task('prototype', 3), task('validation', 7)]);
		history.undo();
		expect(history.canRedo()).toBe(true);

		commit([task('prototype', 3), task('review', 9)]);

		expect(history.canRedo()).toBe(false);
		expect(history.canUndo()).toBe(true);
	});

	test('the history limit drops the oldest entry', () => {
		const { chart, history, commit } = createHarness();
		chart.interactionOptions = { history: { limit: 1 } };
		commit([task('prototype', 3), task('validation', 7)]);
		commit([task('prototype', 3), task('validation', 7), task('review', 9)]);

		expect(history.undo()).toBe(true);
		expect(chart.tasks.map((entry) => entry.id)).toEqual(['prototype', 'validation']);
		expect(history.canUndo()).toBe(false);
	});

	test('a zero limit and history:false record nothing', () => {
		const { chart, history, commit } = createHarness();
		chart.interactionOptions = { history: { limit: 0 } };
		expect(commit([task('prototype', 3), task('validation', 7)])).toBeUndefined();
		expect(history.canUndo()).toBe(false);
		expect(history.undo()).toBe(false);

		chart.interactionOptions = { history: false };
		expect(commit([task('prototype', 3)])).toBeUndefined();
		expect(history.canUndo()).toBe(false);
		expect(history.undo()).toBe(false);
	});

	test('a non-integer limit throws invalid-prop', () => {
		const { chart, commit } = createHarness();
		chart.interactionOptions = { history: { limit: 1.5 } };
		expect(() => commit([task('prototype', 3), task('validation', 7)])).toThrowError(
			/historyLimit must be a non-negative integer/
		);
	});

	test('commits from history itself are not recorded', () => {
		const { history, commit } = createHarness();
		expect(
			commit([task('prototype', 3), task('validation', 7)], { source: 'history' })
		).toBeUndefined();
		expect(history.canUndo()).toBe(false);
	});

	test('a commit whose before and after signatures match is not recorded', () => {
		const { chart, history } = createHarness();
		const before = snapshotOf(chart);
		// Same values, fresh objects: the signature dedupe collapses it.
		chart.tasks = [task('prototype', 3)];

		const forget = history.record({
			before,
			after: snapshotOf(chart),
			source: 'api',
			title: 'no-op'
		});

		expect(forget).toBeUndefined();
		expect(history.canUndo()).toBe(false);
	});

	test('a commit that does not continue the last entry clears the past', () => {
		const { chart, history, commit } = createHarness();
		commit([task('prototype', 3), task('validation', 7)]);
		// The controlled model moved outside of a commit, so the recorded chain is broken.
		chart.tasks = [task('prototype', 3), task('validation', 7), task('outside', 11)];
		commit([task('prototype', 3), task('validation', 7), task('outside', 11), task('review', 13)]);

		expect(history.canUndo()).toBe(true);
		history.undo();
		expect(chart.tasks.map((entry) => entry.id)).toEqual(['prototype', 'validation', 'outside']);
		// Only the last commit survived the chain break.
		expect(history.canUndo()).toBe(false);
	});

	test('canUndo turns false when the resource context changed', () => {
		const { chart, history, commit } = createHarness();
		commit([task('prototype', 3), task('validation', 7)]);
		expect(history.canUndo()).toBe(true);

		chart.resources = [{ id: 'ana', title: 'Ana' }];

		expect(history.canUndo()).toBe(false);
		expect(() => history.undo()).toThrowError(/changed before undo/);
	});

	test('canRedo turns false when the resource context changed', () => {
		const { chart, history, commit } = createHarness();
		commit([task('prototype', 3), task('validation', 7)]);
		history.undo();
		expect(history.canRedo()).toBe(true);

		chart.calendars = [{ id: 'paris', workingDays: [] } as unknown as GanttCalendar];

		expect(history.canRedo()).toBe(false);
		expect(() => history.redo()).toThrowError(/changed before redo/);
	});

	test('undo throws when the controlled model moved underneath the entry', () => {
		const { chart, history, commit } = createHarness();
		commit([task('prototype', 3), task('validation', 7)]);
		chart.tasks = [task('prototype', 3)];

		expect(history.canUndo()).toBe(false);
		expect(() => history.undo()).toThrowError(/changed before undo/);
	});

	test('undo throws while the chart is disabled or loading', () => {
		const { chart, history, commit } = createHarness();
		commit([task('prototype', 3), task('validation', 7)]);

		chart.disabled = true;
		expect(() => history.undo()).toThrowError(/GanttChart is disabled/);
		chart.disabled = false;
		chart.loading = true;
		expect(() => history.undo()).toThrowError(/GanttChart is loading/);
	});

	test('a rejected restore leaves both stacks untouched', () => {
		const { history, commit, setRestoreResult } = createHarness();
		commit([task('prototype', 3), task('validation', 7)]);
		setRestoreResult(false);

		expect(history.undo()).toBe(false);

		expect(history.canUndo()).toBe(true);
		expect(history.canRedo()).toBe(false);
	});

	test('forgetting the newest entry pops it and clears the redo stack', () => {
		const { chart, history, commit } = createHarness();
		const first = commit([task('prototype', 3), task('validation', 7)]);
		commit([task('prototype', 3), task('validation', 7), task('review', 9)]);
		history.undo();
		expect(history.canRedo()).toBe(true);
		const restoredTasks = chart.tasks;

		// The newest entry is the one that was undone, so the top of the past stack is the first one.
		first?.();

		expect(history.canUndo()).toBe(false);
		expect(history.canRedo()).toBe(false);
		expect(chart.tasks).toBe(restoredTasks);
	});

	test('forgetting an entry that is no longer on top clears the whole past', () => {
		const { history, commit } = createHarness();
		const first = commit([task('prototype', 3), task('validation', 7)]);
		commit([task('prototype', 3), task('validation', 7), task('review', 9)]);

		first?.();

		expect(history.canUndo()).toBe(false);
		expect(history.canRedo()).toBe(false);
	});

	test('canUndo and canRedo re-run when the stack changes', () => {
		const { history, commit } = createHarness();
		const seen: Array<[boolean, boolean]> = [];
		const stop = $effect.root(() => {
			$effect(() => {
				seen.push([history.canUndo(), history.canRedo()]);
			});
		});
		flushSync();
		expect(seen).toEqual([[false, false]]);

		commit([task('prototype', 3), task('validation', 7)]);
		flushSync();
		expect(seen.at(-1)).toEqual([true, false]);

		history.undo();
		flushSync();
		expect(seen.at(-1)).toEqual([false, true]);

		stop();
	});
});
