import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import AIAskUserQuestion from './AIAskUserQuestion.svelte';
import AIAskUserQuestionSummary from './AIAskUserQuestionSummary.svelte';
import { summarizeAIAskAnswers } from './aiAskUserQuestionAnswers.js';
import type { AIAskQuestion } from './aiAskUserQuestion.props.js';

const scrollTo = Element.prototype.scrollTo;
beforeAll(() => {
	Element.prototype.scrollTo = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollTo = scrollTo;
});

const tone: AIAskQuestion = {
	id: 'tone',
	title: 'Tone',
	type: 'single',
	options: [
		{ id: 'brief', label: 'Brief' },
		{ id: 'detailed', label: 'Detailed' }
	]
};
const notes: AIAskQuestion = { id: 'notes', title: 'Anything else?' };

describe('AIAskUserQuestion flow', () => {
	test('questions are optional by default and required ones carry a marker', async () => {
		const onSubmit = vi.fn();
		const { rerender } = renderInTheme(AIAskUserQuestion, { questions: [notes], onSubmit });
		expect(document.querySelector('[data-slot="ai-ask-user-question-required"]')).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
		await rerender({ questions: [{ ...notes, required: true }] });
		const marker = document.querySelector('[data-slot="ai-ask-user-question-required"]');
		expect(marker).toHaveTextContent('Required');
		expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Type your answer…');
	});

	test('an optional unanswered step is skipped, an answered one continues', async () => {
		renderInTheme(AIAskUserQuestion, { questions: [notes, tone] });
		const primary = screen.getByRole('button', { name: /Skip/ });
		await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'Short' } });
		expect(primary).toHaveTextContent('Continue');
		await fireEvent.input(screen.getByRole('textbox'), { target: { value: '' } });
		expect(primary).toHaveTextContent('Skip');
		await fireEvent.click(primary);
		expect(screen.getByRole('button', { name: 'Go to question 2' })).toHaveAttribute(
			'aria-current',
			'step'
		);
	});

	test('a required error is one danger message and the options stay neutral', async () => {
		renderInTheme(AIAskUserQuestion, { questions: [{ ...tone, required: true }] });
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		const alerts = await screen.findAllByRole('alert');
		expect(alerts).toHaveLength(1);
		expect(alerts[0]).toHaveTextContent('Answer required.');
		expect(alerts[0]?.className).toContain('text-danger-readable');
		expect(alerts[0]?.className).not.toContain('mx-lg');
		const group = screen.getByRole('radiogroup');
		expect(group).toHaveAttribute('aria-invalid', 'true');
		expect(group).toHaveAttribute('aria-describedby', alerts[0]?.id);
		expect(document.querySelectorAll('[data-slot="field-error"], [data-invalid]')).toHaveLength(0);
	});

	test('a single question has no pager and the footer has no arrow pair', () => {
		const { unmount } = renderInTheme(AIAskUserQuestion, { questions: [tone] });
		expect(screen.queryByRole('button', { name: /Go to question/ })).toBeNull();
		unmount();
		renderInTheme(AIAskUserQuestion, { questions: [tone, notes] });
		expect(screen.getAllByRole('button', { name: /Go to question/ })).toHaveLength(2);
		expect(screen.queryByRole('button', { name: 'Previous question' })).toBeNull();
	});

	test('shows the requester and a strong title', () => {
		renderInTheme(AIAskUserQuestion, { questions: [tone], requester: 'Claude', title: 'Pick one' });
		const requester = screen.getByText('Asked by Claude');
		expect(requester.className).not.toContain('sr-only');
		expect(screen.getByText('Pick one').className).toContain('font-semibold');
	});

	test('a11y:ai-ask-user-question.number-keys number keys pick options and Enter continues', async () => {
		const onValueChange = vi.fn();
		renderInTheme(AIAskUserQuestion, {
			questions: [tone, { ...tone, id: 'second', type: 'multiple', title: 'Second' }],
			autoAdvance: false,
			onValueChange
		});
		const brief = screen.getByRole('radio', { name: 'Brief' });
		await fireEvent.keyDown(brief, { key: '2' });
		expect(onValueChange).toHaveBeenLastCalledWith({ tone: 'detailed' });
		expect(screen.getByRole('radio', { name: 'Detailed' })).toHaveAttribute('aria-checked', 'true');
		await fireEvent.keyDown(brief, { key: 'Enter' });
		expect(screen.getByRole('button', { name: 'Go to question 2' })).toHaveAttribute(
			'aria-current',
			'step'
		);
		const first = screen.getAllByRole('checkbox', { name: 'Brief' }).at(-1) as HTMLElement;
		await fireEvent.keyDown(first, { key: '1' });
		expect(onValueChange).toHaveBeenLastCalledWith({ tone: 'detailed', second: ['brief'] });
		await fireEvent.keyDown(first, { key: '1' });
		expect(onValueChange).toHaveBeenLastCalledWith({ tone: 'detailed', second: [] });
	});

	test('digits typed into a text field stay text', async () => {
		const onValueChange = vi.fn();
		renderInTheme(AIAskUserQuestion, { questions: [notes], onValueChange });
		await fireEvent.keyDown(screen.getByRole('textbox'), { key: '1' });
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('an Other… choice takes free text and never auto-advances', async () => {
		const onValueChange = vi.fn();
		renderInTheme(AIAskUserQuestion, {
			questions: [{ ...tone, allowOther: true }, notes],
			autoAdvanceDelay: 0,
			onValueChange
		});
		await fireEvent.click(screen.getByRole('radio', { name: 'Other…' }));
		const other = screen.getByRole('textbox', { name: 'Other…' });
		await fireEvent.input(other, { target: { value: 'Playful' } });
		expect(onValueChange).toHaveBeenLastCalledWith({ tone: 'Playful' });
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(screen.getByRole('button', { name: 'Go to question 1' })).toHaveAttribute(
			'aria-current',
			'step'
		);
		expect(screen.getByRole('radio', { name: 'Other…' })).toHaveAttribute('aria-checked', 'true');
	});
});

describe('AIAskUserQuestion answered summary', () => {
	const questions: AIAskQuestion[] = [
		tone,
		{ ...tone, id: 'many', type: 'multiple', title: 'Formats', allowOther: true },
		notes
	];

	test('maps answers to the labels the user chose', () => {
		expect(
			summarizeAIAskAnswers(questions, { tone: 'brief', many: ['detailed', 'Haiku'], notes: '  ' })
		).toEqual([
			{ question: questions[0], questionId: 'tone', labels: ['Brief'], answered: true },
			{ question: questions[1], questionId: 'many', labels: ['Detailed', 'Haiku'], answered: true },
			{ question: questions[2], questionId: 'notes', labels: [], answered: false }
		]);
	});

	test('renders question → answer pairs with skipped questions noted', () => {
		renderInTheme(AIAskUserQuestionSummary, {
			questions,
			value: { tone: 'detailed', many: ['brief'] }
		});
		const group = screen.getByRole('group', { name: 'Your answers' });
		const terms = within(group)
			.getAllByRole('term')
			.map((node) => node.textContent);
		const answers = within(group)
			.getAllByRole('definition')
			.map((node) => node.textContent?.trim());
		expect(terms).toEqual(['Tone', 'Formats', 'Anything else?']);
		expect(answers).toEqual(['Detailed', 'Brief', 'Skipped']);
	});
});
