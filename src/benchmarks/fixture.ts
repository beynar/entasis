// Shared plumbing for the benchmarks in this folder. They run in Chromium (`npm run bench`) and
// compare every measurement with the baseline committed in ./baselines; `npm run bench:baseline`
// re-measures and rewrites those files. Baselines are machine-specific: compare runs from the
// same machine, and re-record the baseline before a change, not after it.
import { flushSync, mount, unmount } from 'svelte';
import { inject, type TestContext } from 'vitest';
import BenchHarness, { type BenchScenario } from './BenchHarness.svelte';

declare module 'vitest' {
	export interface ProvidedContext {
		/** Set by `npm run bench:baseline`: write results to ./baselines instead of comparing. */
		updateBenchmarkBaselines: boolean;
	}
}

type Bench = TestContext['bench'];
type BenchFnOptions = Parameters<Bench>[1] & object;

/** Mounts a fresh BenchHarness for each measurement and removes it afterwards. */
export function createFixture(scenario: BenchScenario, count: number) {
	let instance: ReturnType<typeof mount> | undefined;
	let target: HTMLElement | undefined;
	return {
		mount() {
			target = document.createElement('div');
			document.body.append(target);
			instance = mount(BenchHarness, { target, props: { scenario, count } });
			flushSync();
			return target;
		},
		unmount() {
			if (instance) void unmount(instance);
			flushSync();
			target?.remove();
			instance = undefined;
			target = undefined;
		}
	};
}

/**
 * Measure `fn` and compare it with its committed baseline (`./baselines/<file>.json`), or record
 * that baseline when `npm run bench:baseline` runs.
 */
export async function measure(
	bench: Bench,
	{ name, file }: { name: string; file: string },
	options: Omit<BenchFnOptions, 'writeResult' | 'async'>,
	fn: () => unknown
) {
	const baseline = `src/benchmarks/baselines/${file}.json`;
	// Declared up front: tinybench otherwise calls `fn` once, outside the hooks, to find out
	// whether it returns a promise, which would leak an extra fixture into the document.
	const fnOptions = { ...options, async: fn.constructor.name === 'AsyncFunction' };
	if (inject('updateBenchmarkBaselines')) {
		return bench(name, { ...fnOptions, writeResult: baseline }, fn).run();
	}
	const results = await bench.compare(
		bench(name, fnOptions, fn),
		bench.from(`${name} (baseline)`, baseline)
	);
	return results.get(name);
}

/** Count the elements matching `selector` in the whole document (portaled panels included). */
export const countAll = (selector: string) => document.querySelectorAll(selector).length;

/** Type into a text field the way a keystroke does: new value, then an `input` event. */
export function typeInto(input: HTMLInputElement, value: string) {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
}
