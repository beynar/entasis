import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import AIAskUserQuestion from './AIAskUserQuestion.svelte';
import AIAskUserQuestionBinding from './AIAskUserQuestionBinding.test.svelte';
import type { AIAskQuestion } from './aiAskUserQuestion.props.js';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';

const scrollTo = Element.prototype.scrollTo;
beforeAll(() => {
	Element.prototype.scrollTo = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollTo = scrollTo;
});

describe('AIAskUserQuestion state contract', () => {
	test('uses the initial default once and retains later user answers', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(AIAskUserQuestion, {
			questions: [{ id: 'name', title: 'Name' }],
			defaultValue: { name: 'Initial' },
			onValueChange
		});
		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('Initial');
		await rerender({ defaultValue: { name: 'Ignored' } });
		expect(input).toHaveValue('Initial');
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.input(input, { target: { value: 'Edited' } });
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ name: 'Edited' });
		await rerender({ defaultValue: { name: 'Ignored again' } });
		expect(input).toHaveValue('Edited');
		expect(onValueChange).toHaveBeenCalledOnce();
	});

	test('binds answers and does not echo parent replacements', async () => {
		const onValueChange = vi.fn();
		renderInTheme(AIAskUserQuestionBinding, { onValueChange });
		await fireEvent.click(screen.getByRole('button', { name: 'Replace answers' }));
		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('Parent replacement');
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.input(input, { target: { value: 'Bound edit' } });
		expect(screen.getByTestId('bound-answers')).toHaveTextContent('{"name":"Bound edit"}');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ name: 'Bound edit' });
	});

	test('ignores repeated answers and disables choices and submission', async () => {
		const onValueChange = vi.fn();
		const onSubmit = vi.fn();
		const { rerender } = renderInTheme(AIAskUserQuestion, {
			questions: [
				{
					id: 'tone',
					title: 'Tone',
					type: 'single',
					options: [
						{ id: 'brief', label: 'Brief' },
						{ id: 'detailed', label: 'Detailed' }
					]
				}
			],
			defaultValue: { tone: 'brief' },
			onValueChange,
			onSubmit
		});
		await fireEvent.click(screen.getByRole('radio', { name: 'Brief' }));
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.click(screen.getByRole('radio', { name: 'Detailed' }));
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ tone: 'detailed' });
		await rerender({ disabled: true });
		expect(screen.getByRole('radio', { name: 'Brief' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
		await fireEvent.click(screen.getByRole('radio', { name: 'Brief' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('validates required answers and preserves the typed submit payload', async () => {
		const question: AIAskQuestion = { id: 'notes', title: 'Notes' };
		const onSubmit = vi.fn();
		renderInTheme(AIAskUserQuestion, { questions: [question], onSubmit });
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(onSubmit).not.toHaveBeenCalled();
		expect(await screen.findByRole('alert')).toHaveTextContent('Answer required.');
		await fireEvent.input(screen.getByRole('textbox'), { target: { value: '  Ready  ' } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
				answers: [{ question, questionId: 'notes', type: 'text', value: 'Ready' }],
				values: { notes: '  Ready  ' },
				questions: [question]
			})
		);
	});
});
