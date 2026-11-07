// Tabs with panels it does not render: the caller's elements stay where they are, keep the
// attributes their renderer owns, are tied to their tab, and animate on a switch.
import { describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './TabsExternalHarness.test.svelte';

const section = (tab: string) => document.querySelector<HTMLElement>(`section[data-tab="${tab}"]`)!;
const tab = (name: string) => page.getByRole('tab', { name }).element() as HTMLElement;
const running = (element: HTMLElement) =>
	element.getAnimations().filter((animation) => animation.playState === 'running');

describe('Tabs with panels the caller renders', () => {
	test('ties each element to its tab and writes nothing its renderer owns', async () => {
		await render(Harness, { value: 'One' });
		expect(document.querySelectorAll('[role="tabpanel"]')).toHaveLength(3);
		for (const name of ['One', 'Two', 'Three']) {
			const panel = section(name);
			expect(panel.getAttribute('role')).toBe('tabpanel');
			expect(tab(name).getAttribute('aria-controls')).toBe(panel.id);
			expect(panel.getAttribute('aria-labelledby')).toBe(tab(name).id);
			expect(panel.hasAttribute('inert')).toBe(false);
			expect(panel.hasAttribute('aria-hidden')).toBe(false);
			expect(panel.parentElement?.dataset.testid).toBe('children');
		}
		expect(section('Two').hidden).toBe(true);
	});

	test('a switch selects as usual and the entering panel comes in from its side', async () => {
		const onValueChange = vi.fn();
		await render(Harness, { value: 'One', onValueChange });
		await page.getByRole('tab', { name: 'Two' }).click();
		expect(onValueChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ value: 'Two', reason: 'user' })
		);
		await expect.poll(() => section('Two').hidden).toBe(false);
		expect(section('Two').dataset.activationDirection).toBe('right');
		expect(running(section('Two')).length).toBe(1);
		// Without the caller keeping it painted, the leaving panel is simply hidden.
		expect(section('One').hidden).toBe(true);
	});

	test('the leaving panel plays out while the caller keeps it shown through isExiting', async () => {
		await render(Harness, { value: 'Two', exit: true });
		await page.getByRole('tab', { name: 'One' }).click();
		const leaving = section('Two');
		expect(leaving.hasAttribute('data-tabs-exiting')).toBe(true);
		expect(leaving.hidden).toBe(false);
		expect(running(leaving).length).toBe(1);
		expect(section('One').dataset.activationDirection).toBe('left');
		await expect
			.poll(() => leaving.hasAttribute('data-tabs-exiting'), { timeout: 2000 })
			.toBe(false);
		await expect.poll(() => leaving.hidden).toBe(true);
	});

	test('reduced motion snaps', async () => {
		await render(Harness, { value: 'One', reduceMotion: true, exit: true });
		await page.getByRole('tab', { name: 'Two' }).click();
		await expect.poll(() => section('Two').hidden).toBe(false);
		expect(section('Two').getAnimations()).toHaveLength(0);
		expect(section('One').hasAttribute('data-tabs-exiting')).toBe(false);
	});

	test('an element its owner replaces is tied again and animates', async () => {
		const screen = await render(Harness, { value: 'One', revision: 0 });
		const before = section('Two');
		await screen.rerender({ value: 'One', revision: 1 });
		const after = section('Two');
		expect(after).not.toBe(before);
		expect(after.getAttribute('role')).toBe('tabpanel');
		expect(tab('Two').getAttribute('aria-controls')).toBe(after.id);
		await page.getByRole('tab', { name: 'Two' }).click();
		await expect.poll(() => running(section('Two')).length).toBe(1);
	});

	test('tabs moved or removed while one is shown keep their links', async () => {
		const onValueChange = vi.fn();
		const screen = await render(Harness, { value: 'Two', onValueChange });
		const id = section('Two').id;
		await screen.rerender({ value: 'Two', tabs: ['Two', 'One', 'Three'], onValueChange });
		expect(section('Two').id).toBe(id);
		expect(section('Two').getAttribute('aria-labelledby')).toBe(tab('Two').id);
		expect(tab('Two').getAttribute('aria-controls')).toBe(id);
		expect(section('One').getAttribute('aria-labelledby')).toBe(tab('One').id);

		await screen.rerender({ value: 'Two', tabs: ['One', 'Three'], onValueChange });
		await expect.poll(() => onValueChange.mock.calls.at(-1)?.[0]?.reason).toBe('missing');
		expect(section('One').getAttribute('aria-labelledby')).toBe(tab('One').id);
		expect(tab('One').getAttribute('aria-controls')).toBe(section('One').id);
	});
});
