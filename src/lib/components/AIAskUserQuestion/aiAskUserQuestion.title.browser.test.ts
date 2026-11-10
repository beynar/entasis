// `questionTitle` draws a title the app formats (links, marks) while the title element, the
// accessible names and the keyboard flow stay the component's.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tab } from '$lib/testing/browser.test-helper.js';
import Harness from './AIAskUserQuestionTitleHarness.test.svelte';
import type { AIAskQuestion, AIAskUserQuestionTitleState } from './aiAskUserQuestion.props.js';

const TITLE = 'Le devis [D-12](/app/p/12) dépasse le plafond : le valider ?';

const questions: AIAskQuestion[] = [
	{
		id: 'approve',
		title: TITLE,
		type: 'single',
		required: true,
		options: [
			{ id: 'yes', label: 'Valider' },
			{ id: 'no', label: 'Refuser' }
		]
	},
	{
		id: 'why',
		title: 'Pourquoi [D-12](/app/p/12) ?',
		type: 'single',
		options: [
			{ id: 'price', label: 'Prix' },
			{ id: 'other', label: 'Autre raison' }
		]
	}
];

const activeStep = () =>
	document.querySelector<HTMLElement>(
		'[data-step-active="true"] [data-slot="ai-ask-user-question-step"]'
	)!;
const titleOf = (step: HTMLElement) =>
	step.querySelector<HTMLElement>('[data-slot="ai-ask-user-question-title"]')!;

// Clicking the link would navigate the test page away; record that it opened instead.
const recordOpens = () => {
	const opened: string[] = [];
	const onClick = (event: MouseEvent) => {
		const link = (event.target as Element).closest('a');
		if (!link) return;
		opened.push(link.getAttribute('href') ?? '');
		event.preventDefault();
	};
	document.addEventListener('click', onClick);
	return { opened, stop: () => document.removeEventListener('click', onClick) };
};

test('the title is drawn by the snippet, inside the title element', async () => {
	const seen: AIAskUserQuestionTitleState[] = [];
	render(Harness, { props: { questions, seen } });
	await expect.poll(() => titleOf(activeStep()).querySelector('a')?.textContent).toBe('D-12');
	const title = titleOf(activeStep());
	expect(title.querySelector('a')?.getAttribute('href')).toBe('/app/p/12');
	expect(title.id).toMatch(/-title$/);
	expect(title.textContent).toContain('Le devis D-12 dépasse le plafond');
	expect(title.textContent).not.toContain('](');
	// The required marker follows, as with a plain title.
	expect(title.lastElementChild?.getAttribute('data-slot')).toBe('ai-ask-user-question-required');
	expect(seen.some((state) => state.question.id === 'approve' && state.index === 0)).toBe(true);
	expect(seen.some((state) => state.question.id === 'why' && state.index === 1)).toBe(true);
});

test('the options keep question.title as their accessible name', async () => {
	render(Harness, { props: { questions } });
	await expect.poll(() => page.getByRole('radiogroup', { name: TITLE }).elements().length).toBe(1);
});

test('Tab reaches the link before the options', async () => {
	render(Harness, { props: { questions } });
	(page.getByTestId('before').element() as HTMLElement).focus();
	// The header's step dots come first; within the step, the title's link precedes the options.
	const reached: string[] = [];
	for (let i = 0; i < 10 && !reached.includes('radio'); i++) {
		await tab();
		const active = document.activeElement;
		if (!active || !activeStep().contains(active)) continue;
		reached.push(active.tagName === 'A' ? 'link' : (active.getAttribute('role') ?? active.tagName));
	}
	expect(reached).toEqual(['link', 'radio']);
});

test('Enter on the link opens it and neither continues nor submits', async () => {
	const submitted: unknown[] = [];
	const opens = recordOpens();
	try {
		render(Harness, {
			props: { questions, onSubmit: (payload: unknown) => submitted.push(payload) }
		});
		await userEvent.click(page.getByRole('radio', { name: 'Valider' }));
		const link = titleOf(activeStep()).querySelector('a')!;
		link.focus();
		let prevented: boolean | undefined;
		const onKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Enter') prevented = event.defaultPrevented;
		};
		document.addEventListener('keydown', onKeydown);
		await userEvent.keyboard('{Enter}');
		document.removeEventListener('keydown', onKeydown);
		await expect.poll(() => opens.opened).toEqual(['/app/p/12']);
		expect(prevented).toBe(false);
		expect(activeStep().textContent).toContain('le valider');
		expect(submitted).toEqual([]);
	} finally {
		opens.stop();
	}
});

test('a step change gives focus to the first option, not to the link', async () => {
	render(Harness, { props: { questions } });
	(page.getByRole('radio', { name: 'Valider' }).element() as HTMLElement).focus();
	await userEvent.keyboard('1');
	await userEvent.keyboard('{Enter}');
	await expect.poll(() => activeStep().textContent).toContain('Pourquoi');
	await expect.poll(() => document.activeElement?.getAttribute('role')).toBe('radio');
	expect(activeStep().contains(document.activeElement)).toBe(true);
});
