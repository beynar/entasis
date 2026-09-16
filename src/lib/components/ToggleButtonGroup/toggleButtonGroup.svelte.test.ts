import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import ToggleButtonGroup from './ToggleButtonGroup.svelte';

const formatting = [
	{ value: 'bold', children: 'Bold' },
	{ value: 'italic', children: 'Italic' },
	{ value: 'underline', children: 'Underline' }
];

describe('ToggleButtonGroup value shapes', () => {
	test('multiple keeps every pressed value in an array ordered by items', async () => {
		const onValueChange = vi.fn();
		render(ToggleButtonGroup, {
			props: {
				label: 'Text formatting',
				items: formatting,
				defaultValue: ['italic'],
				onValueChange
			}
		});

		const group = screen.getByRole('group', { name: 'Text formatting' });
		expect(group).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'true');

		await fireEvent.click(screen.getByRole('button', { name: 'Bold' }));
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange).toHaveBeenCalledWith(['bold', 'italic']);

		await fireEvent.click(screen.getByRole('button', { name: 'Italic' }));
		expect(onValueChange).toHaveBeenLastCalledWith(['bold']);
		expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'false');
	});

	test('single holds one string value and cannot be unpressed', async () => {
		const onValueChange = vi.fn();
		render(ToggleButtonGroup, {
			props: {
				label: 'Alignment',
				type: 'single' as const,
				items: [
					{ value: 'left', children: 'Left' },
					{ value: 'center', children: 'Center' }
				],
				defaultValue: 'left',
				onValueChange
			}
		});

		expect(screen.getByRole('radiogroup', { name: 'Alignment' })).toBeInTheDocument();
		const left = screen.getByRole('radio', { name: 'Left' });
		const center = screen.getByRole('radio', { name: 'Center' });
		expect(left).toHaveAttribute('aria-checked', 'true');

		await fireEvent.click(center);
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange).toHaveBeenCalledWith('center');
		expect(center).toHaveAttribute('aria-checked', 'true');
		expect(left).toHaveAttribute('aria-checked', 'false');

		await fireEvent.click(center);
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(center).toHaveAttribute('aria-checked', 'true');
	});

	test('items carry their own value so pressed state never lives on the item', async () => {
		const onItemValueChange = vi.fn();
		const onValueChange = vi.fn();
		render(ToggleButtonGroup, {
			props: {
				label: 'Text formatting',
				items: [
					{ value: 'bold', children: 'Bold', onValueChange: onItemValueChange },
					{ value: 'italic', children: 'Italic' }
				],
				onValueChange
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Bold' }));
		expect(onItemValueChange).toHaveBeenCalledWith(true);
		expect(onValueChange).toHaveBeenCalledWith(['bold']);
	});
});
