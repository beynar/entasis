// An icon file exports six weights and a page uses one. A call a bundler cannot prove pure stays in
// the bundle, so every weight has to say so, or importing one icon ships all six.
import { expect, test } from 'vitest';

const sources = import.meta.glob<string>(
	['./Icons/*.ts', '!./Icons/index.svelte.ts', '!./Icons/icons.mcp.ts'],
	{ query: '?raw', import: 'default', eager: true }
);

const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;

test('every icon call is marked pure', () => {
	const files = Object.entries(sources);
	const unmarked = files.filter(
		([, source]) => count(source, /\bicon\(/g) !== count(source, /= \/\*#__PURE__\*\/ icon\(/g)
	);
	expect(files.length).toBeGreaterThan(1000);
	expect(unmarked.map(([file]) => file)).toEqual([]);
});
