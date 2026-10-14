import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import CommandLawHarness from './commandLawHarness.test.svelte';
import Command from './Command.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const groups = [
	{
		heading: 'Fruit',
		items: [
			{ value: 'apple', label: 'Apple' },
			{ value: 'apricot', label: 'Apricot' },
			{ value: 'avocado', label: 'Avocado' }
		]
	},
	{
		heading: 'Veg',
		items: [
			{ value: 'artichoke', label: 'Artichoke' },
			{ value: 'beet', label: 'Beet' }
		]
	}
];
const optionLabels = () =>
	screen.queryAllByRole('option').map((option) => option.textContent?.trim());
const active = (input: HTMLElement) => {
	const id = input.getAttribute('aria-activedescendant');
	return id ? document.getElementById(id)?.textContent?.trim() : undefined;
};

describe('Command expanded state', () => {
	test('a11y:command.expanded aria-expanded follows the results', async () => {
		renderInTheme(Command, { items: groups });
		const input = screen.getByRole('combobox');
		expect(input).toHaveAttribute('aria-expanded', 'true');
		await fireEvent.input(input, { target: { value: 'zzz' } });
		expect(input).toHaveAttribute('aria-expanded', 'false');
		await fireEvent.input(input, { target: { value: 'be' } });
		expect(input).toHaveAttribute('aria-expanded', 'true');
	});
});

describe('Command option ids', () => {
	test('values that sanitize to the same text keep distinct ids', async () => {
		renderInTheme(Command, {
			items: [
				{
					items: [
						{ value: 'a.b', label: 'Dot' },
						{ value: 'a_b', label: 'Underscore' }
					]
				}
			]
		});
		const input = screen.getByRole('combobox');
		await waitFor(() => expect(active(input)).toBe('Dot'));
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		await waitFor(() => expect(active(input)).toBe('Underscore'));
		expect(new Set(screen.getAllByRole('option').map((option) => option.id)).size).toBe(2);
	});
});

describe('Command limit', () => {
	test('shows at most `limit` items across groups and stops comparing', async () => {
		const filter = vi.fn(() => true);
		renderInTheme(Command, { items: groups, limit: 4, filter });
		const input = screen.getByRole('combobox');
		expect(optionLabels()).toEqual(['Apple', 'Apricot', 'Avocado', 'Artichoke']);
		await fireEvent.input(input, { target: { value: 'a' } });
		expect(optionLabels()).toEqual(['Apple', 'Apricot', 'Avocado', 'Artichoke']);
		// The fifth item is never compared once four matched.
		expect(filter).toHaveBeenCalledTimes(4);
	});
});

describe('Command highlight', () => {
	test('autoHighlight false leaves nothing highlighted until an arrow key moves it', async () => {
		renderInTheme(Command, { items: groups, autoHighlight: false });
		const input = screen.getByRole('combobox');
		expect(input.getAttribute('aria-activedescendant')).toBeNull();
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		await waitFor(() => expect(active(input)).toBe('Apple'));
	});

	test('loop "input" returns to no highlight past the last item', async () => {
		renderInTheme(Command, { items: groups, loop: 'input' });
		const input = screen.getByRole('combobox');
		await waitFor(() => expect(active(input)).toBe('Apple'));
		await fireEvent.keyDown(input, { key: 'ArrowUp' });
		await waitFor(() => expect(input.getAttribute('aria-activedescendant')).toBeNull());
	});
});

describe('Command live region', () => {
	test('a11y:command.live-region exists before the first search and announces counts and the empty state', async () => {
		renderInTheme(Command, { items: groups });
		const region = document.querySelector('[role="status"][aria-live="polite"]');
		expect(region).not.toBeNull();
		expect(region).toHaveTextContent('');
		const input = screen.getByRole('combobox');
		await fireEvent.input(input, { target: { value: 'ap' } });
		await waitFor(() => expect(region).toHaveTextContent('2 results available'), { timeout: 2000 });
		await fireEvent.input(input, { target: { value: 'zzz' } });
		await waitFor(() => expect(region).toHaveTextContent('No results found.'), { timeout: 2000 });
		// The visible empty message is plain text: the persistent region does the announcing.
		expect(screen.getByText('No results found.', { selector: 'div' })).not.toHaveAttribute('role');
	});
});

describe('Command open changes', () => {
	test('onOpenChange receives details and can cancel an Escape close', async () => {
		const onOpenChange = vi.fn((open: boolean, details: { cancel(): void }) => {
			if (!open) details.cancel();
		});
		renderInTheme(CommandLawHarness, {
			items: groups,
			dialog: true,
			defaultOpen: true,
			onOpenChange
		});
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(onOpenChange).toHaveBeenCalledWith(
			false,
			expect.objectContaining({ reason: 'escape-key' })
		);
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(screen.getByRole('combobox')).toBeInTheDocument();
	});

	test('a trigger press and a selection report their reasons', async () => {
		const onOpenChange = vi.fn();
		renderInTheme(CommandLawHarness, { items: groups, dialog: true, onOpenChange });
		await fireEvent.click(screen.getByRole('button', { name: 'Open command' }), { detail: 1 });
		expect(onOpenChange).toHaveBeenLastCalledWith(
			true,
			expect.objectContaining({ reason: 'trigger-press', interaction: 'mouse' })
		);
		const input = await screen.findByRole('combobox');
		await waitFor(() => expect(active(input)).toBe('Apple'));
		await fireEvent.keyDown(input, { key: 'Enter' });
		expect(onOpenChange).toHaveBeenLastCalledWith(
			false,
			expect.objectContaining({ reason: 'item-press' })
		);
	});
});
