import { screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import AIContext from './AIContext.svelte';

describe('AIContext compact trigger', () => {
	test('shows the rounded percentage next to the ring, so it does not read as a spinner', () => {
		renderInTheme(AIContext, { compact: true, maxTokens: 100_000, usedTokens: 17_400 });
		const trigger = screen.getByRole('button');
		expect(trigger.querySelector('[data-slot="ai-context-trigger-percent"]')).toHaveTextContent(
			'17%'
		);
		expect(trigger).toHaveClass('h-control-sm');
	});

	test('the full trigger keeps the token totals', () => {
		renderInTheme(AIContext, { maxTokens: 100_000, usedTokens: 17_400 });
		const trigger = screen.getByRole('button');
		expect(trigger).toHaveTextContent('17K / 100K');
		expect(trigger.querySelector('[data-slot="ai-context-trigger-percent"]')).toBeNull();
	});
});
