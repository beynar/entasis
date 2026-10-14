import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import SegmentedControl from './SegmentedControl.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';

const items = [
	{ value: 'grid', label: 'Grid' },
	{ value: 'list', label: 'List', disabled: true },
	{ value: 'table', label: 'Table' }
];

describe('SegmentedControl', () => {
	test('renders a disabled item without the item re-assigning `disabled` forever', async () => {
		// The template assigns `button.disabled` on every update, and a DOM write of the value an
		// attribute already holds still queues a mutation record. useNavigation watches `disabled`,
		// so counting that record looped endlessly (the page hung) whenever one item was disabled.
		renderInTheme(SegmentedControl, { items, defaultValue: 'grid' });

		expect(screen.getByRole('radio', { name: 'List' })).toBeDisabled();
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');
	});

	test('the roving tab stop sits on the selected item and skips a disabled selection', () => {
		const { unmount } = renderInTheme(SegmentedControl, { items, value: 'table' });
		expect(screen.getByRole('radio', { name: 'Table' })).toHaveAttribute('tabindex', '0');
		expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('tabindex', '-1');
		unmount();

		renderInTheme(SegmentedControl, { items, value: 'list' });
		expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('tabindex', '0');
		expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute('tabindex', '-1');
	});

	test('focusing an item does not select it', async () => {
		const onValueChange = vi.fn();
		renderInTheme(SegmentedControl, { items, defaultValue: 'grid', onValueChange });

		const table = screen.getByRole('radio', { name: 'Table' });
		await fireEvent.focus(table);
		table.focus();
		expect(onValueChange).not.toHaveBeenCalled();
		expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');

		await fireEvent.click(table);
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('table');
	});
});
