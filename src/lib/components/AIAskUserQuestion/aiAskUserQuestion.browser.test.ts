// The keyboard flow across steps needs real focus and `inert` (Chromium and WebKit).
import type { Component } from 'svelte';
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ThemeProviderHarness from '../Theme/ThemeProviderHarness.test.svelte';
import AIAskUserQuestion from './AIAskUserQuestion.svelte';
import type { AIAskQuestion } from './aiAskUserQuestion.props.js';

const questions: AIAskQuestion[] = [
	{
		id: 'tone',
		title: 'Tone',
		type: 'single',
		options: [
			{ id: 'brief', label: 'Brief' },
			{ id: 'detailed', label: 'Detailed' }
		]
	},
	{
		id: 'scope',
		title: 'Scope',
		type: 'multiple',
		showOther: true,
		options: [
			{ id: 'api', label: 'API' },
			{ id: 'ui', label: 'UI' },
			{ id: 'docs', label: 'Docs' }
		]
	},
	{ id: 'notes', title: 'Notes' }
];

const activeStep = () =>
	document.querySelector<HTMLElement>(
		'[data-step-active="true"] [data-slot="ai-ask-user-question-step"]'
	);
const focusInActiveStep = () => {
	const step = activeStep();
	return Boolean(step && document.activeElement && step.contains(document.activeElement));
};

test('a11y:ai-ask-user-question.step-focus Enter moves focus into the next step so the keys keep working', async () => {
	const values: unknown[] = [];
	render(ThemeProviderHarness, {
		props: {
			component: AIAskUserQuestion as unknown as Component<Record<string, unknown>>,
			questions,
			autoAdvance: false,
			onValueChange: (value: unknown) => values.push(value)
		}
	});
	(page.getByRole('radio', { name: 'Brief' }).element() as HTMLElement).focus();
	await userEvent.keyboard('2');
	await userEvent.keyboard('{Enter}');
	await expect.poll(() => activeStep()?.textContent).toContain('Scope');
	await expect.poll(focusInActiveStep).toBe(true);

	await userEvent.keyboard('1');
	await userEvent.keyboard('3');
	await expect.poll(() => values.at(-1)).toEqual({ tone: 'detailed', scope: ['api', 'docs'] });

	await userEvent.keyboard('4');
	await expect.poll(() => document.activeElement?.getAttribute('aria-label')).toBe('Other…');
	await userEvent.keyboard('Load test');
	await userEvent.keyboard('{Enter}');
	await expect.poll(() => activeStep()?.textContent).toContain('Notes');
	await expect.poll(() => document.activeElement?.tagName).toBe('TEXTAREA');
	await expect.poll(focusInActiveStep).toBe(true);
});

test('Enter on a focused step without controls continues and submits', async () => {
	const submissions: unknown[] = [];
	render(ThemeProviderHarness, {
		props: {
			component: AIAskUserQuestion as unknown as Component<Record<string, unknown>>,
			questions: [
				{ id: 'notes', title: 'Notes' },
				{ id: 'files', title: 'Files', type: 'file' },
				{ id: 'more', title: 'More files', type: 'file' }
			],
			onSubmit: (payload: { values: unknown }) => {
				submissions.push(payload.values);
			}
		}
	});
	(page.getByRole('textbox').element() as HTMLElement).focus();
	await userEvent.keyboard('Ship it');
	await userEvent.keyboard('{Control>}{Enter}{/Control}');
	await expect.poll(() => activeStep()?.textContent).toContain('Files');
	await expect.poll(() => document.activeElement === activeStep()).toBe(true);

	await userEvent.keyboard('{Enter}');
	await expect.poll(() => activeStep()?.textContent).toContain('More files');
	await expect.poll(() => document.activeElement === activeStep()).toBe(true);

	await userEvent.keyboard('{Enter}');
	await expect.poll(() => submissions).toHaveLength(1);
	expect(submissions[0]).toMatchObject({ notes: 'Ship it' });
});

test('a picked option that auto-advances keeps focus inside the question', async () => {
	render(ThemeProviderHarness, {
		props: {
			component: AIAskUserQuestion as unknown as Component<Record<string, unknown>>,
			questions,
			autoAdvanceDelay: 0
		}
	});
	(page.getByRole('radio', { name: 'Brief' }).element() as HTMLElement).focus();
	await userEvent.keyboard('1');
	await expect.poll(() => activeStep()?.textContent).toContain('Scope');
	await expect.poll(focusInActiveStep).toBe(true);
});

test('a number key moves focus and the tab stop to the option it picks', async () => {
	const values: unknown[] = [];
	render(ThemeProviderHarness, {
		props: {
			component: AIAskUserQuestion as unknown as Component<Record<string, unknown>>,
			questions,
			autoAdvance: false,
			onValueChange: (value: unknown) => values.push(value)
		}
	});
	const brief = page.getByRole('radio', { name: 'Brief' }).element() as HTMLElement;
	const detailed = page.getByRole('radio', { name: 'Detailed' }).element() as HTMLElement;
	brief.focus();
	await userEvent.keyboard('2');
	await expect.poll(() => detailed.getAttribute('aria-checked')).toBe('true');
	await expect.poll(() => document.activeElement).toBe(detailed);
	expect(detailed.tabIndex).toBe(0);
	expect(brief.tabIndex).toBe(-1);
	// Space checks the focused option, which is now the picked one.
	await userEvent.keyboard(' ');
	await expect.poll(() => values.at(-1)).toEqual({ tone: 'detailed' });
	expect(brief.getAttribute('aria-checked')).toBe('false');

	await userEvent.keyboard('{Enter}');
	await expect.poll(() => activeStep()?.textContent).toContain('Scope');
	await expect.poll(focusInActiveStep).toBe(true);
	await userEvent.keyboard('3');
	await expect.poll(() => document.activeElement?.textContent?.trim()).toBe('Docs');
});

test('the step dots are 24px pointer targets around an 8px dot', async () => {
	render(ThemeProviderHarness, {
		props: {
			component: AIAskUserQuestion as unknown as Component<Record<string, unknown>>,
			questions
		}
	});
	const dots = [...document.querySelectorAll<HTMLElement>('button[aria-label^="Go to question"]')];
	expect(dots).toHaveLength(3);
	for (const dot of dots) {
		const { width, height } = dot.getBoundingClientRect();
		expect(width).toBeGreaterThanOrEqual(24);
		expect(height).toBeGreaterThanOrEqual(24);
		expect(getComputedStyle(dot, '::after').width).toBe('8px');
	}
	// The active dot fills, the others stay muted.
	const active = getComputedStyle(dots[0], '::after').backgroundColor;
	expect(active).not.toBe(getComputedStyle(dots[1], '::after').backgroundColor);
	expect(getComputedStyle(dots[1]).backgroundColor).toBe('rgba(0, 0, 0, 0)');
});
