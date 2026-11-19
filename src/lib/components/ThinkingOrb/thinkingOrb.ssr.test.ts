import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import ThinkingOrb from './ThinkingOrb.svelte';

describe('ThinkingOrb server rendering', () => {
	test('renders an image named by its state, with a canvas to draw on', () => {
		const { body } = render(ThinkingOrb, { props: { state: 'searching', color: 'primary' } });

		expect(body).toMatch(/<span[^>]*role="img"/);
		expect(body).toContain('aria-label="Searching…"');
		expect(body).toContain('data-slot="thinking-orb"');
		expect(body).toContain('data-state="searching"');
		expect(body).toContain('data-color="primary"');
		expect(body).toMatch(/<canvas[^>]*aria-hidden="true"/);
	});

	test('defaults to working, in the neutral ink, and is not marked as held', () => {
		const { body } = render(ThinkingOrb, { props: {} });

		expect(body).toContain('aria-label="Working…"');
		expect(body).toContain('data-state="working"');
		expect(body).toContain('data-color="neutral"');
		expect(body).not.toContain('data-paused');
	});

	test('a diameter sizes the root, a label names it, and paused marks it', () => {
		const { body } = render(ThinkingOrb, {
			props: { state: 'breathing', diameter: 48, label: 'Reading the file', paused: true }
		});

		expect(body).toContain('--thinking-orb-size: 48px');
		expect(body).toContain('aria-label="Reading the file"');
		expect(body).toContain('data-paused');
	});
});
