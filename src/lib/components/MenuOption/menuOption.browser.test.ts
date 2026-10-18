// Row geometry in a real browser: `size="small"` steps the row down half a notch at every density, so a
// small menu is shorter as well as smaller-type; `normal` keeps the density's own height.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MenuOption from './MenuOption.svelte';

const rowHeight = async (
	size: 'small' | 'normal',
	density: 'compact' | 'normal' | 'comfortable'
) => {
	const screen = await render(MenuOption, { props: { title: 'Rename', size, density } });
	const row = screen.container.querySelector<HTMLElement>('[data-density]')!;
	const height = row.getBoundingClientRect().height;
	screen.unmount();
	return height;
};

describe('menu row geometry', () => {
	test.each([
		['compact', 24, 24],
		['normal', 28, 32],
		['comfortable', 36, 40]
	] as const)('%s: a small row is %ipx, a normal one %ipx', async (density, small, normal) => {
		expect(await rowHeight('small', density)).toBe(small);
		expect(await rowHeight('normal', density)).toBe(normal);
	});
});
