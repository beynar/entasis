// Tree (Pierre Trees, rendered in an open shadow root) against the APG tree pattern, left to right
// and right to left, in Chromium and WebKit (see `$lib/testing/apg.test-helper.ts`). The
// gaps the check found are pinned one rule at a time below, as regressions.
import { FILE_TREE_TAG_NAME } from '@pierre/trees';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { checkPattern } from '$lib/testing/apg.test-helper.js';
import ApgHarness from '$lib/testing/ApgHarness.test.svelte';
import Tree from './Tree.svelte';

const mount = (dir: 'ltr' | 'rtl') => render(ApgHarness, { props: { scenario: 'tree', dir } });

describe.each(['ltr', 'rtl'] as const)('APG tree pattern (%s)', (dir) => {
	test('the file tree follows the tree pattern', async () => {
		await mount(dir);
		await checkPattern(document.body, 'tree', {
			dir,
			skip: []
		});
	});

	// Regression: an `aria-label` on Tree used to land on the outer data-slot="tree" div, which has
	// no role, leaving role="tree" (in the shadow root) unnamed.
	test('the tree has an accessible name', async () => {
		await mount(dir);
		await checkPattern(document.body, 'tree', { dir, only: ['names'] });
	});

	// Regression: Tree had no typeahead; a printable key did not move to the next row starting
	// with it.
	test('a printable key moves to the row it starts', async () => {
		await mount(dir);
		await checkPattern(document.body, 'tree', { dir, only: ['typeahead'] });
	});
});

// Regression: Tree ignored right-to-left text; ArrowRight still expanded and ArrowLeft still
// collapsed.
test('right to left, ArrowLeft expands and ArrowRight collapses', async () => {
	await mount('rtl');
	await checkPattern(document.body, 'tree', { dir: 'rtl', only: ['expand'] });
});

// `aria-labelledby` ids cannot reach into the shadow root, so the label is linked through
// `ariaLabelledByElements`, and the outer wrapper (which has no role) carries neither attribute.
test('aria-labelledby names the tree element across the shadow root', async () => {
	const label = document.createElement('h2');
	label.id = 'tree-apg-label';
	label.textContent = 'Workspace';
	document.body.append(label);
	try {
		const screen = await render(Tree, {
			props: { 'aria-labelledby': label.id, paths: ['docs/guide.md', 'readme.md'] }
		});
		const wrapper = screen.container.querySelector<HTMLElement>('[data-slot="tree"]')!;
		const treeElement = () =>
			wrapper.querySelector(FILE_TREE_TAG_NAME)?.shadowRoot?.querySelector('[role="tree"]');
		await expect.poll(() => treeElement()?.ariaLabelledByElements?.length).toBe(1);
		expect(wrapper.hasAttribute('aria-labelledby')).toBe(false);
		expect(treeElement()!.ariaLabelledByElements![0]).toBe(label);
	} finally {
		label.remove();
	}
});
