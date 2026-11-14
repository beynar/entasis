// Escape in a MenuBar menu gives focus back to its menubar item within the frame, not when the
// panel's exit transition ends. Svelte makes an outroing element `inert`, so focus left inside the
// closing panel fell to <body> for some ten frames; a screen reader announced the page in between.
// The menus keep their default transition here: with none, the bug does not show.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import MenuBrowserHarness from '../Menu/MenuBrowserHarness.test.svelte';

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Samples focus on every frame until it reaches `target`: it may stay a frame or two on the
 * closing menu (WebKit blurs an inert element late), but never on <body>.
 */
async function focusReturnsTo(target: HTMLElement) {
	const places: string[] = [];
	for (let frame = 0; frame < 30 && document.activeElement !== target; frame += 1) {
		const active = document.activeElement;
		places.push(active?.closest('[role="menu"]') ? 'menu' : (active?.tagName ?? 'none'));
		await nextFrame();
	}
	expect(places.filter((place) => place !== 'menu')).toEqual([]);
	expect(document.activeElement).toBe(target);
}

test('Escape returns focus to the menubar item before the exit transition', async () => {
	render(MenuBrowserHarness, { props: { scenario: 'menubar' } });
	const file = page.getByRole('menuitem', { name: 'File' }).element() as HTMLElement;
	file.focus();
	await userEvent.keyboard('{Enter}');
	await expect.poll(() => document.activeElement?.closest('[role="menu"]')).toBeTruthy();

	await userEvent.keyboard('{Escape}');
	await focusReturnsTo(file);
	// Focus is home while the menu is still playing its exit.
	expect(document.querySelector('[role="menu"]')).not.toBeNull();
	await expect.poll(() => document.querySelector('[role="menu"]')).toBeNull();
	expect(document.activeElement).toBe(file);
});

test('a menu reopened during its exit gives focus back again when it closes', async () => {
	render(MenuBrowserHarness, { props: { scenario: 'menubar' } });
	const file = page.getByRole('menuitem', { name: 'File' }).element() as HTMLElement;
	file.focus();
	await userEvent.keyboard('{Enter}');
	await expect.poll(() => document.activeElement?.closest('[role="menu"]')).toBeTruthy();
	await userEvent.keyboard('{Escape}');
	await focusReturnsTo(file);
	// Reopened while the first close is still animating out: the panel is the same element, so
	// its focus scope is not mounted again and must still give focus back on the next close.
	await userEvent.keyboard('{Enter}');
	await expect.poll(() => file.getAttribute('aria-expanded')).toBe('true');
	await userEvent.keyboard('{ArrowDown}');
	await expect.poll(() => document.activeElement?.closest('[role="menu"]')).toBeTruthy();
	await userEvent.keyboard('{Escape}');
	await focusReturnsTo(file);
});

test('moving to the next menu leaves focus in that menu and the previous one closed', async () => {
	render(MenuBrowserHarness, { props: { scenario: 'menubar' } });
	const file = page.getByRole('menuitem', { name: 'File' }).element() as HTMLElement;
	const edit = page.getByRole('menuitem', { name: 'Edit' }).element() as HTMLElement;
	file.focus();
	await userEvent.keyboard('{Enter}');
	await expect.poll(() => document.activeElement?.closest('[role="menu"]')).toBeTruthy();
	await userEvent.keyboard('{ArrowRight}');
	await expect.poll(() => document.activeElement?.textContent?.trim()).toBe('Undo');
	// The closing File menu must not hand focus to its own trigger, which would reopen it.
	for (let frame = 0; frame < 20; frame += 1) await nextFrame();
	expect(document.activeElement?.textContent?.trim()).toBe('Undo');
	expect(file.getAttribute('aria-expanded')).toBe('false');
	expect(edit.getAttribute('aria-expanded')).toBe('true');
});
