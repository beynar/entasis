// Entries for the proposed laws (decisions.md) that need a real engine: focus rings
// (`:focus-visible`) and input modality do not exist in jsdom. Same convention as
// `proposed-laws.svelte.test.ts`: a `pending` entry (`test.fails`) repros today's behaviour and
// is expected to fail until the owning lane lands; plain `test` entries guard the clause.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame, tab } from '$lib/testing/browser.test-helper.js';
import ProposedLawsHarness from './ProposedLawsHarness.test.svelte';

type Props = Parameters<typeof ProposedLawsHarness>[1];
const mount = (scenario: Props['scenario']) => render(ProposedLawsHarness, { props: { scenario } });
const element = (name: string) => page.getByRole('button', { name }).element() as HTMLElement;

/** Reach `name` with a real Tab from the button before it, so the focus ring shows. */
async function tabTo(name: string) {
	element('Before').focus();
	await tab();
	expect(document.activeElement).toBe(element(name));
}

describe('law 5 · focus (F3 · CX-3, C14 · DF-6)', () => {
	test('closing a popover with Escape returns a visible focus ring to its trigger', async () => {
		mount('popover');
		await tabTo('Open popover');
		await userEvent.keyboard('{Enter}');
		const inside = page.getByRole('button', { name: 'Inside popover' });
		await expect.poll(() => document.activeElement).toBe(inside.element());
		await userEvent.keyboard('{Escape}');
		await expect.element(inside).not.toBeInTheDocument();
		const trigger = element('Open popover');
		await expect.poll(() => document.activeElement).toBe(trigger);
		expect(trigger.matches(':focus-visible')).toBe(true);
	});

	test('closing a dialog with Escape returns a visible focus ring to its trigger', async () => {
		mount('dialog-trigger');
		await tabTo('Open dialog');
		await userEvent.keyboard('{Enter}');
		const dialog = page.getByRole('dialog');
		await expect.element(dialog).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await expect.element(dialog).not.toBeInTheDocument();
		const trigger = element('Open dialog');
		await expect.poll(() => document.activeElement).toBe(trigger);
		expect(trigger.matches(':focus-visible')).toBe(true);
	});

	test('a tooltip opens when keyboard focus reaches its trigger', async () => {
		mount('tooltip');
		await tabTo('Tooltip trigger');
		await expect.element(page.getByRole('tooltip')).toBeInTheDocument();
	});

	test('a tooltip does not open when its trigger gets focus without a focus ring', async () => {
		mount('tooltip');
		// A pointer interaction, then focus from script: the browser shows no focus ring.
		await userEvent.click(page.getByRole('button', { name: 'Before' }));
		const trigger = element('Tooltip trigger');
		trigger.focus();
		expect(trigger.matches(':focus-visible')).toBe(false);
		await nextFrame();
		await nextFrame();
		expect(document.querySelector('[role="tooltip"]')).toBeNull();
	});
});

describe('menu initial focus (C3 · MN-4b)', () => {
	// The APG menu button pattern: a keyboard open puts focus on the first item, not on the menu.
	test('Enter on a menu button focuses the first item', async () => {
		mount('popup-menu');
		element('Actions').focus();
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('menu')).toBeVisible();
		await expect
			.poll(() => document.activeElement?.textContent?.trim(), { timeout: 500 })
			.toBe('Archive');
	});
});
