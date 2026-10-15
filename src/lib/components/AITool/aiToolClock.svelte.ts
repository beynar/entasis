import { untrack } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { AIToolCall, AIToolStatus } from './aiTool.props.js';
import { getAIToolTiming, isActiveAIToolStatus } from './toolRendering.js';

const TICK = 1000;

export type AIToolClockEntry = { key: string; tool: AIToolCall; status: AIToolStatus };

/**
 * Elapsed time per call: the call's own `duration` or `startedAt`/`completedAt` when given,
 * otherwise measured from when this AITool first saw the call running until it settled. While any
 * call runs, a one-second tick keeps the live durations current; no timer runs otherwise. Observed
 * bounds live as long as the AITool: a call that must keep its duration across remounts (a
 * virtualized transcript) carries `duration` or `startedAt`/`completedAt` itself.
 */
export function createAIToolClock(entries: () => readonly AIToolClockEntry[]) {
	let now = $state(Date.now());
	// Observed run bounds, so a call without `completedAt` still keeps its final duration (client
	// only: effects never run during SSR, where only a call's own timing is shown).
	const observed = new SvelteMap<string, { start: number; end?: number }>();

	$effect(() => {
		const list = entries();
		untrack(() => {
			const time = Date.now();
			for (const { key, tool, status } of list) {
				const timing = getAIToolTiming(tool);
				const record = observed.get(key);
				if (isActiveAIToolStatus(status)) {
					if (timing.duration !== undefined) continue;
					if (!record || record.end !== undefined) {
						observed.set(key, { start: timing.startedAt ?? time });
					}
				} else if (record && record.end === undefined) {
					observed.set(key, { ...record, end: time });
				}
			}
		});
	});

	$effect(() => {
		if (!entries().some((entry) => isActiveAIToolStatus(entry.status))) return;
		now = Date.now();
		const timer = setInterval(() => {
			now = Date.now();
		}, TICK);
		return () => clearInterval(timer);
	});

	return {
		/** Elapsed milliseconds for one call, or `undefined` when nothing is known. */
		elapsed(key: string, tool: AIToolCall, status: AIToolStatus): number | undefined {
			const timing = getAIToolTiming(tool);
			if (timing.duration !== undefined) return timing.duration;
			const record = observed.get(key);
			if (isActiveAIToolStatus(status)) {
				const start = timing.startedAt ?? record?.start;
				return start === undefined ? undefined : Math.max(0, now - start);
			}
			if (record?.end === undefined) return undefined;
			return Math.max(0, record.end - (timing.startedAt ?? record.start));
		}
	};
}

export type AIToolClock = ReturnType<typeof createAIToolClock>;
