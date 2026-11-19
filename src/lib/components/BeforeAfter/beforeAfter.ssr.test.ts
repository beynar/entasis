import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import BeforeAfter from './BeforeAfter.svelte';

const before = { src: '/before.jpg', alt: 'The room before' };
const after = { src: '/after.jpg', alt: 'The room after' };

describe('BeforeAfter server rendering', () => {
	test('renders both images, the before one cut at the divider, and a range input', () => {
		const { body } = render(BeforeAfter, {
			props: { before, after, defaultValue: 30, ratio: '16x9', labels: true }
		});

		expect(body).toContain('alt="The room before"');
		expect(body).toContain('alt="The room after"');
		expect(body).toContain('clip-path: inset(0 70% 0 0)');
		expect(body).toContain('aspect-ratio: 16 / 9');
		expect(body).toMatch(/<input[^>]*type="range"[^>]*value="30"/);
		expect(body).toContain('aria-valuetext="Before 30%, After 70%"');
		expect(body).toContain('aria-label="Before and after comparison"');
	});

	test('a vertical comparison is cut from the bottom and counts its slider from there', () => {
		const { body } = render(BeforeAfter, {
			props: { before, after, defaultValue: 30, orientation: 'vertical' }
		});

		expect(body).toContain('clip-path: inset(0 0 70% 0)');
		expect(body).toMatch(/<input[^>]*type="range"[^>]*value="70"/);
		expect(body).toContain('aria-valuetext="Before 30%, After 70%"');
	});
});
