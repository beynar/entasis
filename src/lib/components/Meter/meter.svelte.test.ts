import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Meter from './Meter.svelte';

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
