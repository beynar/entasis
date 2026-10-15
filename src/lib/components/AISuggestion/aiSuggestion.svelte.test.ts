import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import AISuggestions from './AISuggestions.svelte';
import ThemeKeysHarness from './AIThemeKeysHarness.test.svelte';

describe('AISuggestions selection', () => {
	test('a pick is one-shot by default: it reports the value and leaves no pressed chip', async () => {
		const onSelect = vi.fn();
		const onValueChange = vi.fn();
		renderInTheme(AISuggestions, {
			suggestions: ['Summarize', 'Explain'],
			onSelect,
			onValueChange
		});
		const chip = screen.getByRole('button', { name: 'Summarize' });
		await fireEvent.click(chip);
		expect(onSelect).toHaveBeenCalledExactlyOnceWith('Summarize');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Summarize');
		expect(chip).not.toHaveAttribute('aria-pressed', 'true');
	});

	test('persistSelection keeps the picked suggestion pressed', async () => {
		renderInTheme(AISuggestions, { suggestions: ['Summarize', 'Explain'], persistSelection: true });
		const chip = screen.getByRole('button', { name: 'Explain' });
		await fireEvent.click(chip);
		expect(chip).toHaveAttribute('aria-pressed', 'true');
	});
});

describe('AI input theme keys', () => {
	test('<Theme components> reaches AISuggestion, AIFilePreview and AIModelSelector by their kebab-case keys', () => {
		const { container } = render(ThemeKeysHarness);
		expect(container.querySelector('[data-slot="ai-suggestion"]')).toHaveClass(
			'registry-suggestion'
		);
		expect(container.querySelector('[data-slot="ai-file-preview"]')).toHaveClass(
			'registry-file-preview'
		);
		expect(container.querySelector('[data-slot="ai-model-selector"]')).toHaveClass(
			'registry-model-selector'
		);
	});
});
