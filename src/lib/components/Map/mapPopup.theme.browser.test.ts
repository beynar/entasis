// A marker's popup and tooltip take their shell from the Map theme (`popup`, `tooltip`), so a
// popup snippet that draws its own card can drop the padding and surface, or set the width.
import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './MapPopupThemeHarness.test.svelte';

test('by default the popup keeps its shell: surface, padding and an 18rem width', async () => {
	await render(Harness);
	await expect.element(page.getByTestId('card')).toBeVisible();
	const shell = page.getByTestId('card').element().closest<HTMLElement>('.w-72');
	expect(shell).not.toBeNull();
	expect(shell!.className).toContain('p-lg');
	expect(shell!.className).toContain('bg-surface-floating');
});

test('the popup part replaces the shell for a snippet that is the whole surface', async () => {
	await render(Harness, {
		props: { theme: { popup: { base: 'w-auto p-0 bg-transparent' } } }
	});
	await expect.element(page.getByTestId('card')).toBeVisible();
	const card = page.getByTestId('card').element() as HTMLElement;
	expect(card.closest('.w-72')).toBeNull();
	expect(card.closest('.p-lg')).toBeNull();
	const shell = card.closest<HTMLElement>('.w-auto')!;
	expect(shell).not.toBeNull();
	expect(getComputedStyle(shell).paddingTop).toBe('0px');
	expect(getComputedStyle(shell).backgroundColor).toBe('rgba(0, 0, 0, 0)');
});
