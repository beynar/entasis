import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Sparkline from './Sparkline.svelte';
import type { SparklineProps } from './sparkline.props.js';

/** The page the server renders, without Svelte's hydration markers. */
const html = (props: SparklineProps) =>
	render(Sparkline, { props }).body.replace(/<!--[^]*?-->/g, '');

describe('Sparkline server rendering', () => {
	test('renders the whole series, named for assistive technology', () => {
		const body = html({ data: [1, 3, 2, 5], label: 'Signups' });

		expect(body).toMatch(/<span[^>]*data-slot="sparkline"[^>]*role="img"/);
		expect(body).toContain(
			'aria-label="Signups, 4 values from 1 to 5, lowest 1, highest 5, trending up"'
		);
		expect(body).toMatch(/<svg[^>]*aria-hidden="true"/);
		expect(body).toContain('viewBox="0 0 100 100"');
		expect(body).toContain('preserveAspectRatio="none"');
		expect(body).toMatch(
			/data-slot="sparkline-line"[^>]*d="M0,100 L33\.333,50 L66\.667,75 L100,0"/
		);
	});

	test('an area has a gradient of its own, with an id the client renders the same', () => {
		const body = html({ data: [1, 3, 2], variant: 'area' });
		const id = body.match(/<linearGradient id="([^"]+)"/)![1];
		expect(body).toContain(`fill="url(#${id})"`);
	});

	test('markers, the lowest and the highest drawn last, and the trend arrow', () => {
		const body = html({ data: [5, 1, 9, 4], markers: ['max', 'min', 'last'], showTrend: true });
		const order = [...body.matchAll(/data-marker="(\w+)"/g)].map((match) => match[1]);
		expect(order).toEqual(['last', 'min', 'max']);

		expect(body).toMatch(/data-slot="sparkline-marker" data-marker="min" d="M33\.333,100 h0"/);
		expect(body).toMatch(/data-slot="sparkline-marker" data-marker="max"/);
		expect(body).toMatch(/data-slot="sparkline-trend" data-trend="down"[^>]*aria-hidden="true"/);
	});

	test('an empty series is named as having no data, and draws nothing', () => {
		const body = html({ data: [] });

		expect(body).toContain('aria-label="No data"');
		expect(body).not.toContain('sparkline-line');
	});
});
