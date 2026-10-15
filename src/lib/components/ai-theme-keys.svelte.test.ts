import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Harness from '$lib/utils/cva/CvaHarness.test.svelte';

// Every AI component theme module pairs a `set<Name>Theme` subtree setter with a
// `use<Name>Theme` resolver. They must share one context key, or a subtree override is
// silently ignored (the setter writes one key and the resolver reads another).
type ThemeModule = Record<string, unknown>;
type SetTheme = (theme: Record<string, { base?: string }>) => void;
type UseTheme = () => Record<string, (props?: Record<string, unknown>) => string>;

const modules = import.meta.glob<ThemeModule>('./AI*/ai*.theme.ts', { eager: true });

// Theme keys owned by other lanes of the AI chat wave. Remove an entry once its lane lands the
// one-key fix; `test.fails` then turns red and points at the entry to delete.
// (Lane AI1 fixed AIMessageActions; lane AI2 fixed AIFilePreview, AIModelSelector and AISuggestion.)
const pendingOtherLanes: Record<string, string> = {};

const cases = Object.entries(modules).flatMap(([path, module]) =>
	Object.keys(module)
		.filter((name) => /^set[A-Z]\w*Theme$/.test(name))
		.flatMap((setName) => {
			const component = setName.slice(3, -'Theme'.length);
			const useName = `use${component}Theme`;
			if (typeof module[useName] !== 'function') return [];
			return [
				{ path, component, set: module[setName] as SetTheme, use: module[useName] as UseTheme }
			];
		})
);

function resolvesSubtreeOverride(set: SetTheme, use: UseTheme): boolean {
	let resolved = false;
	render(Harness, {
		props: {
			run: () => {
				const defaults = use();
				const slot = Object.keys(defaults).find(
					(name) => name !== 'motion' && typeof defaults[name] === 'function'
				);
				if (!slot) throw new Error('Theme has no class slot.');
				set({ [slot]: { base: 'ai-theme-key-probe' } });
				resolved = use()[slot]?.({}).split(/\s+/).includes('ai-theme-key-probe') ?? false;
			}
		}
	});
	return resolved;
}

describe('AI component theme keys', () => {
	test('covers every AI theme module', () => {
		expect(cases.map(({ component }) => component)).toEqual(
			expect.arrayContaining(['AIReasoning', 'AIThreadToc', 'AIAskUserQuestion', 'AITool'])
		);
	});

	for (const { path, component, set, use } of cases) {
		const lane = pendingOtherLanes[component];
		const run = lane ? test.fails : test;
		run(`set${component}Theme reaches use${component}Theme (${path})`, () => {
			expect(resolvesSubtreeOverride(set, use)).toBe(true);
		});
	}
});
