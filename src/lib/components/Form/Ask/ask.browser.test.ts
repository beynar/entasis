// An ask taller than the viewport, in a real browser: with `scroll: 'inner'` (the default) the
// form is the only part that scrolls, so the title, description and buttons stay on screen, and a
// field's focus ring keeps room around it; with `scroll: 'outer'` the whole card scrolls, as
// before.
import { afterEach, describe, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { animationsSettled } from '$lib/testing/browser.test-helper.js';
import type { FormInputs } from '../Form/form.js';
import type { AskDialogOptions } from './ask.props.js';
import { ask } from './ask.js';
import AskHarness from './AskHarness.test.svelte';

const initialViewport = { width: window.innerWidth, height: window.innerHeight };

const inputs = Object.fromEntries(
	Array.from({ length: 16 }, (_, index) => [
		`field${index}`,
		{ type: 'text', label: `Field ${index + 1}` }
	])
) as FormInputs;

const open = async (dialog: AskDialogOptions) => {
	render(AskHarness);
	// Left open: the harness unmounts with it, which rejects the request.
	ask({
		title: 'Nouveau modèle PDF',
		description: 'Describe the model.',
		inputs,
		confirm: 'Créer le modèle',
		cancel: 'Annuler',
		dialog
	}).catch(() => {});
	await expect.poll(() => document.querySelector('[data-slot="ask-body"]')).not.toBeNull();
	await animationsSettled();
	const body = document.querySelector<HTMLElement>('[data-slot="ask-body"]')!;
	const card = body.closest<HTMLElement>('[data-type]')!;
	const title = page.getByText('Nouveau modèle PDF').element() as HTMLElement;
	const confirm = page.getByRole('button', { name: 'Créer le modèle' }).element() as HTMLElement;
	return { body, card, title, confirm };
};
const rect = (element: Element) => element.getBoundingClientRect();
const onScreen = (element: Element) =>
	rect(element).top >= 0 && rect(element).bottom <= window.innerHeight;

afterEach(async () => {
	await page.viewport(initialViewport.width, initialViewport.height);
});

describe('a tall ask', () => {
	test('with inner scroll, only the form scrolls and the header and buttons stay on screen', async () => {
		await page.viewport(1440, 600);
		const { body, card, title, confirm } = await open({ size: 'large', scroll: 'inner' });

		expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
		expect(card.scrollHeight).toBeLessThanOrEqual(card.clientHeight + 1);
		expect(onScreen(title)).toBe(true);
		expect(onScreen(confirm)).toBe(true);

		const titleTop = rect(title).top;
		body.scrollTop = body.scrollHeight;
		await animationsSettled();
		expect(rect(title).top).toBe(titleTop);
		expect(onScreen(confirm)).toBe(true);
		expect(rect(confirm).top).toBeGreaterThanOrEqual(rect(body).bottom);
	});

	test('the default is the inner scroll', async () => {
		await page.viewport(1440, 600);
		const { body, title, confirm } = await open({});
		expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
		expect(onScreen(title)).toBe(true);
		expect(onScreen(confirm)).toBe(true);
	});

	test('a field keeps room for its focus ring inside the scrolling body', async () => {
		await page.viewport(1440, 600);
		const { body } = await open({ size: 'large' });
		const form = body.firstElementChild!;
		expect(rect(form).left - rect(body).left).toBeGreaterThanOrEqual(4);
		expect(rect(body).right - rect(form).right).toBeGreaterThanOrEqual(4);
		expect(rect(form).top - rect(body).top).toBeGreaterThanOrEqual(4);

		const last = page.getByRole('textbox', { name: 'Field 16' }).element() as HTMLElement;
		last.focus();
		body.scrollTop = body.scrollHeight;
		await animationsSettled();
		expect(rect(body).bottom - rect(form).bottom).toBeGreaterThanOrEqual(4);
	});

	test('with outer scroll, the whole card grows past the viewport and the body never scrolls', async () => {
		await page.viewport(1440, 600);
		const { body, card } = await open({ size: 'large', scroll: 'outer' });
		expect(body.scrollHeight).toBeLessThanOrEqual(body.clientHeight + 1);
		expect(rect(card).height).toBeGreaterThan(window.innerHeight);
	});
});
