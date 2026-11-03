// Every library component compiles without Svelte's `experimental.async`: an app that does not
// turn it on (most do not) could not build a component with a component-level `await` or an
// `await` in a derived or template expression. The docs app turns it on, so only this test sees it.
import { compile } from 'svelte/compiler';
import { describe, expect, test } from 'vitest';

const sources = import.meta.glob<string>(['../**/*.svelte', '!../**/*.test.svelte'], {
	query: '?raw',
	import: 'default',
	eager: true
});

describe('library components compile without experimental.async', () => {
	test('there are components to check', () => {
		expect(Object.keys(sources).length).toBeGreaterThan(300);
	});

	test.each(['client', 'server'] as const)('for the %s', (generate) => {
		const failures: string[] = [];
		for (const [filename, source] of Object.entries(sources)) {
			try {
				compile(source, { filename, generate, experimental: { async: false } });
			} catch (error) {
				failures.push(`${filename}: ${(error as Error).message.split('\n')[0]}`);
			}
		}
		expect(failures).toEqual([]);
	});
});
