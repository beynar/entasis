// Separator in real engines: the gradient variant fades the line toward its outer ends, whatever
// the label's place, the orientation and the reading direction; the solid one is left alone.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './SeparatorHarness.test.svelte';

const root = () => document.querySelector<HTMLElement>('[role="separator"]')!;

/** The mask of one half of the line: its direction, and the stops as `clear` and `ink`. */
const mask = (half: '::before' | '::after') => {
	const style = getComputedStyle(root(), half);
	const image = style.maskImage || style.webkitMaskImage;
	if (!image || image === 'none') return null;
	const direction = image.match(/to (right|left|bottom|top)/)?.[1] ?? 'bottom';
	const stops = [...image.matchAll(/rgba?\(([^)]+)\)|transparent|black/g)].map((stop) =>
		stop[0] === 'transparent' || /^rgba\((\s*\d+\s*,){3}\s*0\s*\)$/.test(stop[0]) ? 'clear' : 'ink'
	);
	return `${direction}: ${stops.join(' ')}`;
};

/** The length of one half of the line, in pixels. */
const length = (half: '::before' | '::after', side: 'width' | 'height' = 'width') =>
	parseFloat(getComputedStyle(root(), half)[side]) || 0;

describe('Separator', () => {
	test('a solid separator draws an even line', async () => {
		render(Harness, { props: {} });

		expect(root().dataset.variant).toBe('solid');
		expect(mask('::before')).toBeNull();
		expect(mask('::after')).toBeNull();
		expect(length('::before')).toBe(200);
		expect(length('::after')).toBe(200);
		expect(getComputedStyle(root(), '::before').borderTopWidth).toBe('1px');
	});

	test('a gradient separator fades out at both ends', async () => {
		render(Harness, { props: { variant: 'gradient' } });

		expect(root().dataset.variant).toBe('gradient');
		// Two halves that meet in the middle: the first fades in, the second fades out.
		expect(mask('::before')).toBe('right: clear ink');
		expect(mask('::after')).toBe('right: ink clear');
		expect(length('::before')).toBe(200);
		expect(length('::after')).toBe(200);
	});

	test('it keeps the colour and the thickness of the line', async () => {
		render(Harness, { props: { variant: 'gradient', color: 'primary', thickness: 3 } });

		const solid = getComputedStyle(root(), '::before');
		expect(solid.borderTopWidth).toBe('3px');
		expect(solid.borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
	});

	test('with a label, each half fades away from it', async () => {
		render(Harness, { props: { variant: 'gradient', children: 'OR' } });

		expect(mask('::before')).toBe('right: clear ink');
		expect(mask('::after')).toBe('right: ink clear');
		expect(length('::before')).toBeLessThan(200);
		expect(length('::before')).toBeGreaterThan(100);
	});

	test('a line in one piece fades at both ends, and away from a label at its start or end', async () => {
		const view = await render(Harness, { props: { variant: 'gradient', align: 'start' } });
		// No label: the second half is the whole line.
		expect(length('::before')).toBe(0);
		expect(length('::after')).toBe(400);
		expect(mask('::after')).toBe('right: clear ink clear');

		await view.rerender({ children: 'Details' });
		expect(mask('::after')).toBe('right: ink clear');

		await view.rerender({ align: 'end', children: undefined });
		expect(length('::before')).toBe(400);
		expect(mask('::before')).toBe('right: clear ink clear');

		await view.rerender({ children: 'More' });
		expect(mask('::before')).toBe('right: clear ink');
	});

	test('a vertical one fades from top to bottom', async () => {
		render(Harness, { props: { variant: 'gradient', orientation: 'vertical' } });

		expect(mask('::before')).toBe('bottom: clear ink');
		expect(mask('::after')).toBe('bottom: ink clear');
		expect(length('::before', 'height')).toBe(100);
		expect(length('::after', 'height')).toBe(100);
	});

	test('from right to left the fade follows the reading direction', async () => {
		render(Harness, {
			props: { variant: 'gradient', dir: 'rtl', align: 'start', children: 'Details' }
		});

		// The label sits on the right: the line fades away from it, toward the left.
		expect(mask('::after')).toBe('left: ink clear');
	});
});
