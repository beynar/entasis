import { compile } from 'svelte/compiler';
import { describe, expect, test } from 'vitest';

const sources = import.meta.glob<string>(
	['./AIThread.svelte', './AIThreadItems.svelte', './AIThreadMarker.svelte'],
	{ query: '?raw', import: 'default', eager: true }
);

describe('AIThread compiles without warnings', () => {
	test.each(Object.entries(sources))('%s', (filename, source) => {
		const { warnings } = compile(source, { filename, generate: 'client' });
		expect(warnings.map((warning) => `${warning.code} ${warning.start?.line}`)).toEqual([]);
	});
});
