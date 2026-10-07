import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import { spacingValues } from '$lib/tailwind/spacing.js';
import Marquee from './Marquee.svelte';
import { marqueeTheme } from './marquee.theme.js';

/*
 * The loop steps by one copy plus `--gap` while the copies are drawn `--gap` apart. Both read the
 * same declaration only while it lives on the root alone: a copy that redeclared it (the old
 * `[--gap:1rem]`) stepped 1rem whatever the size, and the loop jumped by the difference each cycle.
 */
const sizes = {
	small: spacingValues.md,
	normal: spacingValues.xl,
	large: spacingValues['layout-md']
} as const;

describe('Marquee gap', () => {
	for (const [size, token] of Object.entries(sizes) as [keyof typeof sizes, string][]) {
		test(`${size} declares --gap once, from the spacing scale, on the root`, () => {
			const root = marqueeTheme.root({ size });
			expect(root).toContain(`[--gap:${token.replace(/ /g, '')}]`);
			expect(root).toContain('gap-(--gap)');

			for (const direction of ['left', 'up'] as const) {
				const inner = marqueeTheme.inner({ size, direction });
				expect(inner).toContain('gap-(--gap)');
				expect(inner).not.toMatch(/\[--gap:/);
			}
		});
	}

	test('the rendered marquee writes no inline gap, so a root override reaches the loop', () => {
		const body = render(Marquee, {
			props: { size: 'large', class: '[--gap:var(--space-lg)]', children: 'Item' }
		}).body;

		const root = body.match(/<div[^>]*data-slot="marquee"[^>]*>/)?.[0] ?? '';
		expect(root).toContain('[--gap:var(--space-lg)]');
		// The consumer's value replaces the size's, rather than sitting beside it.
		expect(root).not.toContain('[--gap:var(--layout-space-md)]');
		expect(root).not.toMatch(/style="[^"]*--gap/);
		expect(body).not.toMatch(/data-slot="marquee-copy"[^>]*\[--gap:/);
	});
});
