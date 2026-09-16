import '@testing-library/jest-dom/vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Stat from './Stat.svelte';

const flowSlots = (container: HTMLElement) =>
	Array.from(container.querySelectorAll<HTMLElement>('[data-slot^="stat-"]'))
		.filter((node) => node.closest('[data-slot="stat-aside"]') === null)
		.map((node) => node.dataset.slot)
		.filter(
			(slot) => slot !== 'stat-unit' && slot !== 'stat-trend-icon' && slot !== 'stat-trend-text'
		);

describe('Stat order', () => {
	test('renders the default order and leaves the separator out', () => {
		const { container } = render(Stat, {
			props: {
				label: 'Tasks',
				value: '147',
				trend: 'On track',
				description: 'This sprint'
			}
		});

		expect(flowSlots(container)).toEqual([
			'stat-label',
			'stat-value',
			'stat-trend',
			'stat-description'
		]);
		expect(container.querySelector('[data-slot="stat-separator"]')).toBeNull();
	});

	test('follows a custom order and renders the separator when it is listed', () => {
		const { container } = render(Stat, {
			props: {
				order: ['label', 'value', 'description', 'separator', 'trend'],
				label: 'Tasks',
				value: '147',
				trend: 'On track',
				description: 'This sprint'
			}
		});

		expect(flowSlots(container)).toEqual([
			'stat-label',
			'stat-value',
			'stat-description',
			'stat-separator',
			'stat-trend'
		]);
	});

	test('omits a region that is absent from order even when its content is supplied', () => {
		const { container, queryByText } = render(Stat, {
			props: {
				order: ['value'],
				label: 'Tasks',
				value: '147',
				description: 'This sprint'
			}
		});

		expect(flowSlots(container)).toEqual(['stat-value']);
		expect(queryByText('Tasks')).toBeNull();
	});

	test('keeps the indicator in column 2 wherever it sits in order', () => {
		const { container } = render(Stat, {
			props: {
				order: ['indicator', 'label', 'value'],
				label: 'Tasks',
				value: '147',
				indicator: 'SLA'
			}
		});

		const indicator = container.querySelector('[data-slot="stat-indicator"]');
		expect(indicator?.closest('[data-slot="stat-aside"]')).not.toBeNull();
		expect(flowSlots(container)).toEqual(['stat-label', 'stat-value']);
	});
});

describe('Stat unit', () => {
	test('renders the unit inside the value region', () => {
		const { container, getByText } = render(Stat, {
			props: { label: 'Tasks', value: '147', unit: 'task' }
		});

		const unit = getByText('task');
		expect(unit).toHaveAttribute('data-slot', 'stat-unit');
		expect(unit.closest('[data-slot="stat-value"]')).not.toBeNull();
		expect(container.querySelector('[data-slot="stat-value"]')?.textContent).toContain('147');
	});
});

describe('Stat action', () => {
	test('renders a labelled button that calls onAction', async () => {
		const onAction = vi.fn();
		const { getByRole } = render(Stat, {
			props: {
				label: 'Tasks',
				value: '147',
				action: '⋯',
				actionLabel: 'More actions for Tasks',
				onAction
			}
		});

		const button = getByRole('button', { name: 'More actions for Tasks' });
		await fireEvent.click(button);

		expect(onAction).toHaveBeenCalledTimes(1);
		expect(onAction.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
	});

	test('honours actionDisabled', () => {
		const onAction = vi.fn();
		const { getByRole } = render(Stat, {
			props: {
				label: 'Tasks',
				value: '147',
				action: '⋯',
				actionLabel: 'More actions',
				actionDisabled: true,
				onAction
			}
		});

		// jsdom dispatches straight to the listener, so the disabled attribute is the contract here.
		expect(getByRole('button', { name: 'More actions' })).toBeDisabled();
		expect(onAction).not.toHaveBeenCalled();
	});

	test('stacks the action above the indicator in the aside', () => {
		const { container } = render(Stat, {
			props: {
				label: 'Tasks',
				value: '147',
				indicator: 'SLA',
				action: '⋯',
				actionLabel: 'More actions'
			}
		});

		const aside = container.querySelector('[data-slot="stat-aside"]');
		const asideSlots = Array.from(aside?.children ?? []).map(
			(node) => (node as HTMLElement).dataset.slot
		);
		expect(asideSlots).toEqual(['stat-action', 'stat-indicator']);
	});

	test('renders no aside when neither indicator nor action is supplied', () => {
		const { container } = render(Stat, { props: { label: 'Tasks', value: '147' } });

		expect(container.querySelector('[data-slot="stat-aside"]')).toBeNull();
	});
});

describe('Stat trend', () => {
	const arrowPath = (container: HTMLElement) =>
		container.querySelector('[data-slot="stat-trend-text"] svg path')?.getAttribute('d');

	test('appends an up-right arrow for trendDirection up', () => {
		const { container } = render(Stat, {
			props: { label: 'Tasks', value: '147', trend: '+12%', trendDirection: 'up' }
		});

		const path = arrowPath(container);
		expect(path).toBeTruthy();
		expect(path).toContain('M200,64V168');
	});

	test('appends a down-right arrow for trendDirection down', () => {
		const { container } = render(Stat, {
			props: { label: 'Tasks', value: '147', trend: '-4%', trendDirection: 'down' }
		});

		const path = arrowPath(container);
		expect(path).toBeTruthy();
		expect(path).toContain('M200,88V192');
	});

	test('appends no arrow for trendDirection neutral', () => {
		const { container } = render(Stat, {
			props: { label: 'Tasks', value: '147', trend: 'stable', trendDirection: 'neutral' }
		});

		expect(container.querySelector('[data-slot="stat-trend-text"] svg')).toBeNull();
	});

	test('keeps trendIcon neutral and colours only the trend text', () => {
		const { container } = render(Stat, {
			props: {
				label: 'Tasks',
				value: '147',
				trendIcon: '⚡',
				trend: '+12%',
				trendDirection: 'up'
			}
		});

		const row = container.querySelector<HTMLElement>('[data-slot="stat-trend"]');
		const icon = container.querySelector<HTMLElement>('[data-slot="stat-trend-icon"]');
		const text = container.querySelector<HTMLElement>('[data-slot="stat-trend-text"]');

		expect(row?.className).not.toContain('text-success-readable');
		expect(icon?.className).toContain('text-current/70');
		expect(text?.className).toContain('text-success-readable');
	});
});
