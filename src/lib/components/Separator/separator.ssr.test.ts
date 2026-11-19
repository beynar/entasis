import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Separator from './Separator.svelte';

describe('Separator server rendering', () => {
	test('renders a horizontal, solid separator by default', () => {
		const { body } = render(Separator, { props: {} });

		expect(body).toMatch(/<div[^>]*role="separator"/);
		expect(body).toContain('aria-orientation="horizontal"');
		expect(body).toContain('data-orientation="horizontal"');
		expect(body).toContain('data-variant="solid"');
		expect(body).toContain('data-color="neutral"');
		expect(body).not.toContain('mask-image');
	});

	test('the gradient variant is marked and masks its line', () => {
		const { body } = render(Separator, {
			props: { variant: 'gradient', orientation: 'vertical', color: 'primary', thickness: 2 }
		});

		expect(body).toContain('data-variant="gradient"');
		expect(body).toContain('aria-orientation="vertical"');
		expect(body).toContain('mask-image');
		expect(body).toContain('--separator-border-width: 2px');
	});

	test('a decorative separator has no role, and a label is rendered inside it', () => {
		const { body } = render(Separator, { props: { decorative: true, children: 'OR' } });

		expect(body).toContain('role="none"');
		expect(body).toContain('OR');
	});
});
