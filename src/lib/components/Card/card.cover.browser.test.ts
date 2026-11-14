// `cover` lays a block across the top of the card, flush with its edges and its top corners; the
// header follows with the card's usual spacing.
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './CardCoverHarness.test.svelte';

const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();

test.each(['compact', 'normal', 'comfortable'] as const)(
	'the cover is flush with the top and sides of a %s card',
	async (density) => {
		await render(Harness, { density });
		const card = box('[data-slot="card"]');
		const cover = box('[data-testid="cover"]');
		expect(cover.top).toBe(card.top);
		expect(cover.left).toBe(card.left);
		expect(cover.width).toBe(card.width);
		// The face and title come after it, inside the card's padding.
		const face = box('[data-testid="face"]');
		expect(face.top).toBeGreaterThan(cover.bottom);
		expect(face.left).toBeGreaterThan(card.left);
	}
);

test('the cover takes the card’s top corners', async () => {
	await render(Harness);
	const card = document.querySelector<HTMLElement>('[data-slot="card"]')!;
	const wrapper = document.querySelector('[data-testid="cover"]')!.parentElement!;
	const radius = getComputedStyle(card).borderTopLeftRadius;
	expect(radius).not.toBe('0px');
	expect(getComputedStyle(wrapper).borderTopLeftRadius).toBe(radius);
	expect(getComputedStyle(wrapper).borderBottomLeftRadius).toBe('0px');
	expect(getComputedStyle(wrapper).overflow).toBe('hidden');
});
