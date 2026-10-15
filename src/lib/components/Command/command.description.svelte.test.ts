import { screen } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import { buildRichTextInputGroups } from '../RichTextInput/suggestions.js';
import Command from './Command.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

describe('Command item descriptions', () => {
	test('render as a second line under the label', () => {
		renderInTheme(Command, {
			items: [
				{
					items: [
						{ value: 'summarize', label: 'Summarize', description: 'Summarize selected context.' },
						{ value: 'rewrite', label: 'Rewrite' }
					]
				}
			]
		});
		const [summarize, rewrite] = screen.getAllByRole('option');
		expect(summarize).toHaveTextContent('Summarize');
		expect(summarize).toHaveTextContent('Summarize selected context.');
		expect(rewrite.textContent?.trim()).toBe('Rewrite');
	});

	test('a highlighted row keeps its own ink instead of the dimmer muted-readable one', () => {
		renderInTheme(Command, {
			items: [{ items: [{ value: 'one', label: 'One' }] }],
			value: 'one'
		});
		const [row] = screen.getAllByRole('option');
		expect(row).toHaveAttribute('data-highlighted', 'true');
		expect(row).toHaveClass('bg-selected-muted');
		expect(row).not.toHaveClass('text-selected-muted-readable');
	});

	test('composer suggestions pass the description, or the path, through to the menu', () => {
		const [group] = buildRichTextInputGroups(
			'@',
			{ title: 'Mentions' },
			[
				{ id: 'team', label: 'Platform team', description: 'Mention the platform team.' },
				{ id: 'brief', label: 'brief.md', path: 'docs/brief.md' }
			],
			'',
			false
		);
		expect(group.items.map((item) => item.description)).toEqual([
			'Mention the platform team.',
			'docs/brief.md'
		]);
	});
});
