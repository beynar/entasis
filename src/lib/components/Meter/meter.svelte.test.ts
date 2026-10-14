import '@testing-library/jest-dom/vitest';
import { render, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, test } from 'vitest';
import Meter from './Meter.svelte';
import RangeLocaleHarness from '../Progress/RangeLocaleHarness.test.svelte';

const segments = (container: HTMLElement) =>
	Array.from(container.querySelectorAll<HTMLElement>('[data-first]'));

describe('Meter value shapes', () => {
	test('renders a plain number as one segment coloured by the default color', () => {
		const { container } = render(Meter, { props: { value: 62 } });

		const bars = segments(container);
		expect(bars).toHaveLength(1);
		expect(bars[0]).toHaveAttribute('data-color', 'primary');
		expect(bars[0]).toHaveAttribute('data-first', 'true');
		expect(bars[0]).toHaveAttribute('data-last', 'true');
	});

	test('applies the root color to a numeric value', () => {
		const { container } = render(Meter, { props: { value: 40, color: 'success' } });

		expect(segments(container)[0]).toHaveAttribute('data-color', 'success');
	});

	test('defaults the legend label of a numeric value to the value itself', () => {
		const { getByText, getAllByText } = render(Meter, {
			props: { value: 42, showLegend: true, max: 100 }
		});

		expect(getByText('42')).toBeInTheDocument();
		expect(getAllByText('42%')).toHaveLength(2);
	});

	test('shows the numeric value through the indicator', () => {
		const { getByText } = render(Meter, { props: { value: 35, showIndicatorAs: 'value' } });

		expect(getByText('35')).toBeInTheDocument();
	});

	test('still accepts a single segment object and falls back to the root color', () => {
		const { container, getByText } = render(Meter, {
			props: { value: { value: 30, label: 'Used' }, color: 'warning', showLegend: true }
		});

		const bars = segments(container);
		expect(bars).toHaveLength(1);
		expect(bars[0]).toHaveAttribute('data-color', 'warning');
		expect(getByText('Used')).toBeInTheDocument();
	});

	test('keeps stacked segments and lets each one override the root color', () => {
		const { container } = render(Meter, {
			props: {
				color: 'primary',
				value: [
					{ value: 30, label: 'Design' },
					{ value: 25, label: 'Ops', color: 'danger' }
				]
			}
		});

		const bars = segments(container);
		expect(bars).toHaveLength(2);
		expect(bars[0]).toHaveAttribute('data-color', 'primary');
		expect(bars[1]).toHaveAttribute('data-color', 'danger');
		expect(bars[0]).toHaveAttribute('data-first', 'true');
		expect(bars[1]).toHaveAttribute('data-last', 'true');
	});
});

describe('Meter accessibility', () => {
	test('a11y:meter.role exposes a single value as a labelled meter with its range and value text', () => {
		const { getByRole, getByText } = render(Meter, {
			props: { value: 65, label: 'Progress', helper: '65% complete' }
		});

		const meter = getByRole('meter', { name: 'Progress' });
		expect(meter).toHaveAttribute('aria-valuemin', '0');
		expect(meter).toHaveAttribute('aria-valuemax', '100');
		expect(meter).toHaveAttribute('aria-valuenow', '65');
		expect(meter).toHaveAttribute('aria-valuetext', '65%');
		expect(meter).toHaveAttribute('aria-labelledby', getByText('Progress').id);
		expect(meter).toHaveAccessibleDescription('65% complete');
	});

	test('keeps the label inside the meter presentational, as the NVDA workaround needs', () => {
		const single = render(Meter, { props: { value: 65, label: 'Progress' } });
		const label = within(single.container).getByText('Progress');
		// NVDA ignores a name that comes from a label element inside the meter (nvda#16204).
		expect(label).toHaveAttribute('role', 'presentation');
		expect(within(single.container).getByRole('meter', { name: 'Progress' })).toContainElement(
			label
		);
		single.unmount();

		const stacked = render(Meter, {
			props: { label: 'Storage usage', value: [{ value: 10 }, { value: 20 }] }
		});
		expect(within(stacked.container).getByText('Storage usage')).toHaveAttribute(
			'role',
			'presentation'
		);
		expect(within(stacked.container).getByRole('group', { name: 'Storage usage' })).toBeTruthy();
	});

	test('announces the indicator text, so the raw value is read in value mode', () => {
		const { getByRole } = render(Meter, {
			props: { value: 750, max: 1000, showIndicatorAs: 'value', label: 'Score' }
		});

		const meter = getByRole('meter', { name: 'Score' });
		expect(meter).toHaveAttribute('aria-valuemax', '1000');
		expect(meter).toHaveAttribute('aria-valuetext', '750');
	});

	test('clamps aria-valuenow to the scale', () => {
		const { getByRole, rerender } = render(Meter, { props: { value: 120, label: 'Load' } });
		expect(getByRole('meter')).toHaveAttribute('aria-valuenow', '100');

		rerender({ value: 10, min: 20, label: 'Load' });
		expect(getByRole('meter')).toHaveAttribute('aria-valuemin', '20');
		expect(getByRole('meter')).toHaveAttribute('aria-valuenow', '20');
	});

	test('includes the description in the accessible description', () => {
		const { getByRole } = render(Meter, {
			props: { value: 30, label: 'Score', description: 'Current score out of 100' }
		});

		expect(getByRole('meter', { name: 'Score' })).toHaveAccessibleDescription(
			'Current score out of 100'
		);
	});

	test('keeps a name when a custom header replaces the label', () => {
		const header = createRawSnippet(() => ({ render: () => '<div>Storage · 45 GB</div>' }));
		const { getByRole } = render(Meter, { props: { value: 45, label: 'Storage', header } });

		expect(getByRole('meter', { name: 'Storage' })).not.toHaveAttribute('aria-labelledby');
	});

	test('falls back to the segment label, then to the catalog name', () => {
		const { getByRole, unmount } = render(Meter, {
			props: { value: { value: 30, label: 'Used' } }
		});
		expect(getByRole('meter', { name: 'Used' })).toBeInTheDocument();
		unmount();

		render(Meter, { props: { value: 60 } });
		expect(getByRole('meter', { name: 'Meter' })).toBeInTheDocument();
	});

	test('a11y:meter.stacked exposes stacked segments as a labelled group of meters', () => {
		const { getByRole } = render(Meter, {
			props: {
				label: 'Storage usage',
				value: [{ value: 19, label: 'System' }, { value: 33 }, { value: 6, label: 'Apps' }]
			}
		});

		const group = getByRole('group', { name: 'Storage usage' });
		const meters = within(group).getAllByRole('meter');
		expect(meters.map((meter) => meter.getAttribute('aria-label'))).toEqual([
			'System',
			'Segment 2 of 3',
			'Apps'
		]);
		expect(meters[1]).toHaveAttribute('aria-valuenow', '33');
		expect(meters[1]).toHaveAttribute('aria-valuetext', '33%');
		expect(meters[1]).toHaveAttribute('aria-valuemin', '0');
		expect(meters[1]).toHaveAttribute('aria-valuemax', '100');
		expect(group).not.toHaveAttribute('aria-valuenow');
	});

	test('describes a stacked group by its helper and description, like a single meter', () => {
		const { getByRole } = render(Meter, {
			props: {
				label: 'Storage usage',
				helper: 'Total: 67%',
				description: 'Across all volumes',
				value: [{ value: 40 }, { value: 27 }]
			}
		});

		expect(getByRole('group', { name: 'Storage usage' })).toHaveAccessibleDescription(
			'Total: 67% Across all volumes'
		);
	});

	test('gives every meter text content so NVDA reads its name', () => {
		const single = render(Meter, { props: { value: 40, label: 'Battery' } });
		const meter = within(single.container).getByRole('meter');
		expect(meter.querySelector('[role="presentation"].sr-only')).not.toBeNull();
		single.unmount();

		const stacked = render(Meter, {
			props: { label: 'Mix', value: [{ value: 10 }, { value: 20 }] }
		});
		const segments = within(stacked.container).getAllByRole('meter');
		expect(segments).toHaveLength(2);
		for (const segment of segments) {
			expect(segment.querySelector('[role="presentation"].sr-only')).not.toBeNull();
		}
	});
});

describe('Meter range, clamping and formatting', () => {
	const fill = (container: HTMLElement) => segments(container)[0].style.width;
	const indicator = (container: HTMLElement) =>
		container.querySelector<HTMLElement>('[data-position]')?.textContent?.trim();

	test('measures a segment from min to max', () => {
		const { container, getByRole } = render(Meter, {
			props: { value: 30, min: 20, max: 40, label: 'Load' }
		});

		expect(fill(container)).toBe('50%');
		expect(indicator(container)).toBe('50%');
		const meter = getByRole('meter');
		expect(meter).toHaveAttribute('aria-valuemin', '20');
		expect(meter).toHaveAttribute('aria-valuemax', '40');
		expect(meter).toHaveAttribute('aria-valuenow', '30');
		expect(meter).toHaveAttribute('aria-valuetext', '50%');
	});

	test('clamps a value past max so the fill, text and ARIA agree', () => {
		const { container, getByRole } = render(Meter, {
			props: { value: 120, max: 100, label: 'Load' }
		});

		expect(fill(container)).toBe('100%');
		expect(indicator(container)).toBe('100%');
		expect(getByRole('meter')).toHaveAttribute('aria-valuenow', '100');
		expect(getByRole('meter')).toHaveAttribute('aria-valuetext', '100%');
	});

	test('clamps a value below min to an empty fill', () => {
		const { container, getByRole } = render(Meter, {
			props: { value: 10, min: 20, max: 40, label: 'Load' }
		});

		expect(fill(container)).toBe('0%');
		expect(getByRole('meter')).toHaveAttribute('aria-valuenow', '20');
		expect(getByRole('meter')).toHaveAttribute('aria-valuetext', '0%');
	});

	test('clamps each stacked segment and reports its own value text', () => {
		const { container, getAllByRole } = render(Meter, {
			props: { min: 0, max: 50, label: 'Mix', value: [{ value: 25 }, { value: 80 }] }
		});

		expect(segments(container).map((bar) => bar.style.width)).toEqual(['50%', '100%']);
		const meters = getAllByRole('meter');
		expect(meters.map((meter) => meter.getAttribute('aria-valuenow'))).toEqual(['25', '50']);
		expect(meters.map((meter) => meter.getAttribute('aria-valuetext'))).toEqual(['50%', '100%']);
	});

	test('formats the value text with the format options in value mode', () => {
		const { getByRole, container } = render(Meter, {
			props: {
				value: 1234.5,
				max: 5000,
				showIndicatorAs: 'value',
				format: { style: 'unit', unit: 'megabyte' },
				label: 'Disk'
			}
		});

		expect(indicator(container)).toMatch(/1,234\.5\s?MB/);
		expect(getByRole('meter').getAttribute('aria-valuetext')).toMatch(/1,234\.5\s?MB/);
	});

	test('getAriaValueText overrides the announced text with a payload', () => {
		const calls: unknown[] = [];
		const { getByRole } = render(Meter, {
			props: {
				value: 30,
				min: 20,
				max: 40,
				label: 'Load',
				getAriaValueText: (payload) => {
					calls.push(payload);
					return `${payload.formattedValue} of capacity`;
				}
			}
		});

		expect(getByRole('meter')).toHaveAttribute('aria-valuetext', '50% of capacity');
		expect(calls[0]).toEqual({ value: 30, formattedValue: '50%', min: 20, max: 40 });
	});

	test('formats the percentage with the locale of the surrounding I18n', () => {
		const { container } = render(RangeLocaleHarness, { props: { locale: 'fr', value: 50 } });

		const meter = container.querySelector('[role="meter"]')!;
		expect(meter.getAttribute('aria-valuetext')).toMatch(/^50\s%$/);
		expect(meter.getAttribute('aria-valuetext')).not.toBe('50%');
	});

	test('the locale prop wins over the I18n locale', () => {
		const { container } = render(Meter, { props: { value: 50, label: 'Load', locale: 'fr' } });

		expect(container.querySelector('[role="meter"]')!.getAttribute('aria-valuetext')).toMatch(
			/^50\s%$/
		);
	});

	test('formats legend percentages in the locale', () => {
		const { container } = render(Meter, {
			props: { value: 50, showLegend: true, label: 'Load', locale: 'fr' }
		});

		expect(container.textContent).toMatch(/50\s%/);
	});
});
