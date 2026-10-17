import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import AIModelSelector from './AIModelSelector.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const option = (id: string) =>
	document.querySelector<HTMLElement>(
		`[data-slot="ai-model-selector-option"][data-model-id="${id}"]`
	);

describe('AIModelSelector', () => {
	test('the trigger is a ghost text button that can shrink', () => {
		renderInTheme(AIModelSelector, {
			models: [{ id: 'fast', label: 'Fast' }],
			defaultValue: 'fast'
		});
		const trigger = document.querySelector('[data-slot="ai-model-selector-trigger"]');
		expect(trigger).toHaveClass('min-w-0');
		expect(trigger).not.toHaveClass('min-w-44');
		expect(trigger?.className).toMatch(/bg-color\/0/);
	});

	test('one provider: no heading and no repeated provider; the selected row keeps its badge', async () => {
		renderInTheme(AIModelSelector, {
			models: [
				{ id: 'fast', label: 'Fast', provider: 'Entasis', contextWindow: 128_000 },
				{ id: 'deep', label: 'Deep', provider: 'Entasis', contextWindow: 1_000_000 }
			],
			defaultValue: 'fast',
			defaultOpen: true
		});
		await waitFor(() => expect(option('fast')).not.toBeNull());
		expect(screen.queryByText('Entasis')).toBeNull();
		const selected = option('fast')!;
		expect(selected.querySelector('[data-slot="ai-model-selector-selected"]')).toHaveTextContent(
			'128K'
		);
		expect(selected.querySelector('svg')).not.toBeNull();
		expect(option('deep')).toHaveTextContent('1M');
	});

	test('several providers keep their headings without repeating them on every row', async () => {
		renderInTheme(AIModelSelector, {
			models: [
				{ id: 'fast', label: 'Fast', provider: 'Acme' },
				{ id: 'deep', label: 'Deep', provider: 'Entasis' }
			],
			defaultOpen: true
		});
		await waitFor(() => expect(option('fast')).not.toBeNull());
		expect(screen.getAllByText('Acme')).toHaveLength(1);
		expect(option('fast')?.textContent?.trim()).toBe('Fast');
		await fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
	});
});
