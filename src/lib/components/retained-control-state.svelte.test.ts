import '@testing-library/jest-dom/vitest';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Command from './Command/commandLawHarness.test.svelte';
import MiniCalendar from './MiniCalendar/MiniCalendar.svelte';
import AIReasoning from './AIReasoning/AIReasoning.svelte';
import { renderInTheme } from './Theme/renderInTheme.test-helper.js';

describe('retained control state', () => {
	test('keeps Command query edits and dialog transitions across props updates', async () => {
		const onSearchChange = vi.fn();
		const onOpenChange = vi.fn();
		const { rerender } = renderInTheme(Command, {
			items: [],
			dialog: true,
			defaultOpen: true,
			defaultSearch: 'Initial',
			onSearchChange,
			onOpenChange
		});
		const input = screen.getByRole('combobox');
		await fireEvent.input(input, { target: { value: 'Edited' } });
		expect(onSearchChange).toHaveBeenCalledExactlyOnceWith('Edited');
		await rerender({ defaultSearch: 'Ignored', defaultOpen: false, class: 'updated' });
		expect(input).toHaveValue('Edited');
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(onOpenChange).not.toHaveBeenCalled();
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
		await rerender({ defaultOpen: true, class: 'updated-again' });
		expect(screen.getByRole('button', { name: 'Open command' })).toHaveAttribute(
			'aria-expanded',
			'false'
		);
		expect(onOpenChange).toHaveBeenCalledOnce();
	});

	test('keeps a reasoning disclosure default and later user edit across props updates', async () => {
		const onOpenChange = vi.fn();
		const { rerender } = renderInTheme(AIReasoning, {
			defaultOpen: true,
			children: 'Reasoning body',
			onOpenChange
		});
		const trigger = screen.getByRole('button');
		await rerender({ defaultOpen: false });
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(onOpenChange).not.toHaveBeenCalled();
		await fireEvent.click(trigger);
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
		await rerender({ defaultOpen: true, class: 'updated' });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(onOpenChange).toHaveBeenCalledOnce();
	});

	test('emits reasoning stream transitions once', async () => {
		const onOpenChange = vi.fn();
		const { rerender } = renderInTheme(AIReasoning, {
			children: 'Reasoning body',
			autoCloseDelay: 0,
			onOpenChange
		});
		await rerender({ streaming: true });
		expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		await rerender({ streaming: false });
		await waitFor(() =>
			expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
		);
		expect(onOpenChange).toHaveBeenCalledTimes(2);
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test('keeps MiniCalendar selection edits and suppresses repeated selections', async () => {
		const onValueChange = vi.fn();
		const startDate = new Date(2026, 8, 7, 12);
		const nextDate = new Date(2026, 8, 8, 12);
		const { rerender } = renderInTheme(MiniCalendar, {
			startDate,
			days: 2,
			locale: 'en-US',
			defaultValue: startDate,
			onValueChange
		});
		const first = screen.getByRole('button', { name: 'Monday, September 7, 2026' });
		const second = screen.getByRole('button', { name: 'Tuesday, September 8, 2026' });
		await fireEvent.click(first);
		expect(onValueChange).not.toHaveBeenCalled();
		await fireEvent.click(second);
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(nextDate);
		await rerender({ defaultValue: null, class: 'updated' });
		expect(second).toHaveAttribute('aria-pressed', 'true');
		await fireEvent.click(second);
		expect(onValueChange).toHaveBeenCalledOnce();
		await rerender({ value: null });
		expect(first).toHaveAttribute('aria-pressed', 'false');
		expect(second).toHaveAttribute('aria-pressed', 'false');
		expect(onValueChange).toHaveBeenCalledOnce();
	});
});
