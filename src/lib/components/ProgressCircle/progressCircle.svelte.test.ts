import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import RangeLocaleHarness from '../Progress/RangeLocaleHarness.test.svelte';
import ProgressCircle from './ProgressCircle.svelte';

const offset = (container: HTMLElement) =>
	container
		.querySelector<SVGElement>('[data-slot="progress-circle-indicator"]')!
		.style.getPropertyValue('stroke-dashoffset');

describe('ProgressCircle value and range', () => {
	test('exposes a labelled progressbar with the clamped value and its text', () => {
		const { getByRole } = render(ProgressCircle, { props: { value: 45, label: 'Upload' } });

		const bar = getByRole('progressbar', { name: 'Upload' });
		expect(bar).toHaveAttribute('aria-valuemin', '0');
		expect(bar).toHaveAttribute('aria-valuemax', '100');
		expect(bar).toHaveAttribute('aria-valuenow', '45');
		expect(bar).toHaveAttribute('aria-valuetext', '45%');
	});

	test('measures the arc from min to max', () => {
		const { container, getByRole } = render(ProgressCircle, {
			props: { value: 30, min: 20, max: 40, label: 'Upload' }
		});

		expect(offset(container)).toBe('50');
		expect(getByRole('progressbar')).toHaveAttribute('aria-valuetext', '50%');
	});

	test('clamps a value past max', () => {
		const { container, getByRole } = render(ProgressCircle, {
			props: { value: 120, label: 'Upload' }
		});

		expect(getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
		expect(offset(container)).toBe('0');
	});

	test('a11y:progress-circle.nvda keeps a readable text node inside the bar for NVDA', () => {
		const { getByRole } = render(ProgressCircle, { props: { value: 45, label: 'Upload' } });

		const text = getByRole('progressbar').querySelector('[role="presentation"].sr-only');
		expect(text).not.toBeNull();
		expect(text).toHaveTextContent('45%');
	});

	test('a null value is indeterminate', () => {
		const { getByRole } = render(ProgressCircle, { props: { value: null, label: 'Upload' } });

		const bar = getByRole('progressbar');
		expect(bar).not.toHaveAttribute('aria-valuenow');
		expect(bar).toHaveAttribute('data-indeterminate');
		expect(bar).not.toHaveAttribute('data-complete');
		expect(bar).toHaveAttribute('aria-valuetext', 'Indeterminate progress');
		expect(bar.querySelector('svg')).toHaveClass('animate-spin');
	});

	test('marks data-complete once the clamped value reaches max', () => {
		const { getByRole, rerender } = render(ProgressCircle, {
			props: { value: 99, label: 'Upload' }
		});
		expect(getByRole('progressbar')).not.toHaveAttribute('data-complete');
		expect(getByRole('progressbar')).toHaveAttribute('data-progressing');

		rerender({ value: 150, label: 'Upload' });
		expect(getByRole('progressbar')).toHaveAttribute('data-complete');
		expect(getByRole('progressbar')).not.toHaveAttribute('data-progressing');
	});

	test('formats the text with format options and getAriaValueText', () => {
		const { getByRole } = render(ProgressCircle, {
			props: {
				value: 3,
				max: 5,
				label: 'Files',
				format: { style: 'decimal' },
				getAriaValueText: ({ formattedValue, max }) => `${formattedValue} of ${max} files`
			}
		});

		expect(getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 of 5 files');
	});

	test('formats the percentage in the I18n locale', () => {
		const { container } = render(RangeLocaleHarness, { props: { locale: 'fr', value: 50 } });

		const bar = container.querySelector('[data-slot="progress-circle"]')!;
		expect(bar.getAttribute('aria-valuetext')).toMatch(/^50\s%$/);
	});

	test('a decorative circle has no progress semantics or text', () => {
		const { container } = render(ProgressCircle, { props: { value: 45, decorative: true } });

		const root = container.querySelector('[data-slot="progress-circle"]')!;
		expect(root).not.toHaveAttribute('role');
		expect(root.querySelector('.sr-only')).toBeNull();
	});
});
