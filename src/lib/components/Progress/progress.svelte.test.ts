import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import Progress from './Progress.svelte';
import RangeLocaleHarness from './RangeLocaleHarness.test.svelte';

const fill = (container: HTMLElement) =>
	container.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!;

describe('Progress value', () => {
	test('a11y:progress.role exposes a progressbar with its range, value and text', () => {
		const { getByRole } = render(Progress, { props: { value: 40, label: 'Uploading' } });

		const bar = getByRole('progressbar', { name: 'Uploading' });
		expect(bar).toHaveAttribute('aria-valuemin', '0');
		expect(bar).toHaveAttribute('aria-valuemax', '100');
		expect(bar).toHaveAttribute('aria-valuenow', '40');
		expect(bar).toHaveAttribute('aria-valuetext', '40%');
		expect(bar).toHaveAttribute('data-progressing');
	});

	test('names an unlabelled bar from the catalog', () => {
		const { getByRole } = render(Progress, { props: { value: 10 } });

		expect(getByRole('progressbar', { name: 'Progress' })).not.toHaveAttribute('aria-labelledby');
	});

	test('keeps the visible label presentational and naming the bar', () => {
		const { getByRole, getByText } = render(Progress, { props: { value: 10, label: 'Sync' } });

		const label = getByText('Sync');
		expect(label).toHaveAttribute('role', 'presentation');
		expect(getByRole('progressbar')).toHaveAttribute('aria-labelledby', label.id);
	});

	test('fills from min to max and clamps', () => {
		const { container, getByRole, rerender } = render(Progress, {
			props: { value: 30, min: 20, max: 40, label: 'Load' }
		});
		expect(fill(container).style.width).toBe('50%');
		expect(getByRole('progressbar')).toHaveAttribute('aria-valuetext', '50%');

		rerender({ value: 120, min: 0, max: 100, label: 'Load' });
		expect(fill(container).style.width).toBe('100%');
		expect(getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
		expect(getByRole('progressbar')).toHaveAttribute('data-complete');

		rerender({ value: -5, min: 0, max: 100, label: 'Load' });
		expect(fill(container).style.width).toBe('0%');
		expect(getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
	});

	test('a null value is indeterminate', () => {
		const { container, getByRole } = render(Progress, { props: { value: null, label: 'Loading' } });

		const bar = getByRole('progressbar');
		expect(bar).not.toHaveAttribute('aria-valuenow');
		expect(bar).toHaveAttribute('aria-valuetext', 'Indeterminate progress');
		expect(bar).toHaveAttribute('data-indeterminate');
		expect(fill(container)).toHaveAttribute('data-indeterminate');
		expect(fill(container).style.width).toBe('');
	});
});

describe('Progress text', () => {
	test('a11y:progress.nvda always keeps the value as text inside the bar for NVDA', () => {
		const { getByRole } = render(Progress, { props: { value: 40, label: 'Uploading' } });

		const text = getByRole('progressbar').querySelector('[role="presentation"].sr-only');
		expect(text).toHaveTextContent('40%');
	});

	test('shows the value on the trailing side with showValue', () => {
		const { getByRole } = render(Progress, {
			props: { value: 40, label: 'Uploading', showValue: true }
		});

		const value = getByRole('progressbar').querySelector('[data-slot="progress-value"]');
		expect(value).toHaveTextContent('40%');
		expect(value).not.toHaveClass('sr-only');
		expect(getByRole('progressbar').querySelector('.sr-only')).toBeNull();
	});

	test('does not draw text for an indeterminate value', () => {
		const { getByRole } = render(Progress, {
			props: { value: null, label: 'Loading', showValue: true }
		});

		expect(
			getByRole('progressbar').querySelector('[data-slot="progress-value"]')!.textContent
		).toBe('');
	});

	test('a11y:progress.nvda keeps text inside an indeterminate bar even with showValue and no label', () => {
		const { getByRole } = render(Progress, { props: { value: null, showValue: true } });

		const bar = getByRole('progressbar');
		expect(bar.querySelector('[data-slot="progress-value"]')!.textContent).toBe('');
		expect(bar.querySelector('[role="presentation"].sr-only')).toHaveTextContent(
			'Indeterminate progress'
		);
	});

	test('formats the value with format options and a custom aria text', () => {
		const { getByRole } = render(Progress, {
			props: {
				value: 3,
				max: 5,
				label: 'Files',
				showValue: true,
				format: { style: 'decimal', minimumFractionDigits: 1 },
				getAriaValueText: ({ formattedValue, max }) => `${formattedValue} of ${max} files`
			}
		});

		const bar = getByRole('progressbar');
		expect(bar).toHaveAttribute('aria-valuetext', '3.0 of 5 files');
		expect(bar.querySelector('[data-slot="progress-value"]')).toHaveTextContent('3.0');
	});

	test('renders the valueLabel slot with the value state', () => {
		const valueLabel = createRawSnippet<[{ percent: number | null; status: string }]>((state) => ({
			render: () => `<em>${state().status}:${state().percent}</em>`
		}));
		const { getByRole } = render(Progress, {
			props: { value: 25, label: 'Sync', showValue: true, valueLabel }
		});

		expect(
			getByRole('progressbar').querySelector('[data-slot="progress-value"]')
		).toHaveTextContent('progressing:25');
	});

	test('formats the percentage in the I18n locale', () => {
		const { container } = render(RangeLocaleHarness, { props: { locale: 'fr', value: 50 } });

		const bar = container.querySelector('[data-slot="progress"]')!;
		expect(bar.getAttribute('aria-valuetext')).toMatch(/^50\s%$/);
		expect(bar.querySelector('[data-slot="progress-value"]')!.textContent).toMatch(/^50\s%$/);
	});
});

describe('Progress chrome', () => {
	test('publishes size, density and color as data attributes', () => {
		const { getByRole } = render(Progress, {
			props: { value: 10, size: 'large', density: 'comfortable', color: 'success' }
		});

		const bar = getByRole('progressbar');
		expect(bar).toHaveAttribute('data-size', 'large');
		expect(bar).toHaveAttribute('data-density', 'comfortable');
		expect(bar).toHaveAttribute('data-color', 'success');
		expect(bar.className).toContain('gap-md');
	});

	test('forwards data attributes and class to the root', () => {
		const { getByRole } = render(Progress, {
			props: { value: 10, class: 'custom', 'data-testid': 'bar' }
		});

		expect(getByRole('progressbar')).toHaveClass('custom');
		expect(getByRole('progressbar')).toHaveAttribute('data-testid', 'bar');
	});
});
