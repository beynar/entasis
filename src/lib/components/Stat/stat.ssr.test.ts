import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Stat from './Stat.svelte';
import type { StatProps } from './stat.props.js';

/** The page the server renders, without Svelte's hydration markers. */
const html = (props: StatProps) => render(Stat, { props }).body.replace(/<!--[^]*?-->/g, '');

describe('Stat server rendering', () => {
	test('renders its regions and a numeric value as the plain number to read', () => {
		const body = html({
			label: 'Revenue',
			value: 45231,
			animatedNumber: { format: { style: 'currency', currency: 'USD' } },
			trend: '+20.1%',
			trendDirection: 'up',
			description: 'This month'
		});

		expect(body).toMatch(/data-slot="stat-label"[^>]*>Revenue</);
		expect(body).toMatch(/<div[^>]*data-slot="stat-value"/);
		expect(body).toMatch(/data-slot="animated-number"/);
		expect(body).toMatch(/data-slot="animated-number-text"[^>]*>\$45,231\.00</);
		expect(body).toContain('data-trend="up"');
		expect(body).toMatch(/data-slot="stat-description"[^>]*>This month</);
	});

	test('animatedNumber false renders the plain number only', () => {
		const body = html({ label: 'Orders', value: 1284, animatedNumber: false });

		expect(body).not.toContain('animated-number');
		expect(body).toContain('1,284');
	});

	test('a string value renders as it is', () => {
		const body = html({ label: 'Revenue', value: '$45,231' });

		expect(body).not.toContain('animated-number');
		expect(body).toContain('$45,231');
	});

	test('renders the sparkline across the card', () => {
		const body = html({ label: 'Visits', value: 1284, sparkline: [3, 5, 4, 8] });

		expect(body).toMatch(/<div[^>]*data-slot="stat-sparkline"/);
		expect(body).toContain(
			'aria-label="Visits, 4 values from 3 to 8, lowest 3, highest 8, trending up"'
		);
		expect(body).toMatch(/data-slot="sparkline-line"/);
	});
});
