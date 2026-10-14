import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Tabbar from './Tabbar.svelte';

const items = [
	{ label: 'A', href: '#a' },
	{ label: 'B', href: '#b' }
];

describe('Tabbar link tabs with manual activation', () => {
	test('a click selects a link tab when activateOnFocus is false', async () => {
		const onValueChange = vi.fn();
		render(Tabbar, { props: { items, activateOnFocus: false, onValueChange } });

		await fireEvent.click(screen.getByRole('tab', { name: 'B' }));

		expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ value: 'B', reason: 'user' });
	});

	test('Space selects a focused link tab when activateOnFocus is false', async () => {
		const onValueChange = vi.fn();
		render(Tabbar, { props: { items, activateOnFocus: false, onValueChange } });
		const tab = screen.getByRole('tab', { name: 'B' });
		tab.focus();

		await fireEvent.keyDown(tab, { key: ' ' });

		expect(tab).toHaveAttribute('aria-selected', 'true');
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ value: 'B', reason: 'user' });
	});

	test('a click reports one change for a link tab when focus already selected it', async () => {
		const onValueChange = vi.fn();
		render(Tabbar, { props: { items, onValueChange } });
		const tab = screen.getByRole('tab', { name: 'B' });

		tab.focus();
		await fireEvent.click(tab);

		expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ value: 'B', reason: 'user' });
	});
});
