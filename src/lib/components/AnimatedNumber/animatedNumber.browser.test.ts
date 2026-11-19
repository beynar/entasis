// AnimatedNumber in real engines: which pieces move on a change, how far each wheel turns, what
// is left once the change has played, and what a person reads meanwhile.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './AnimatedNumberHarness.test.svelte';

const DELTA = '--_animated-number-d';

const root = () => document.querySelector<HTMLElement>('[data-slot="animated-number"]')!;
const text = () => root().querySelector<HTMLElement>('[data-slot="animated-number-text"]')!;
const visual = () => root().querySelector<HTMLElement>('[data-slot="animated-number-visual"]')!;
const section = (name: string) => root().querySelector<HTMLElement>(`[data-section="${name}"]`)!;
const char = (name: string, key: string) =>
	section(name).querySelector<HTMLElement>(`:scope > [data-key="${key}"]`);
const numerals = () => root().querySelectorAll('[data-slot="animated-number-numeral"]');
const exiting = () => root().querySelectorAll('[data-exiting]');
const running = () => root().getAnimations({ subtree: true });

/** What shows, without the characters that take no room. */
const shown = () => visual().textContent!.replace(/\u200b/g, '');

/** How far a wheel was told to turn, with its sign, or 0 when it was not. */
const turn = (node: HTMLElement | null) => {
	const animation = node
		?.getAnimations()
		.find((candidate) => DELTA in (candidate.effect as KeyframeEffect).getKeyframes()[0]);
	if (!animation) return 0;
	return -Number((animation.effect as KeyframeEffect).getKeyframes()[0][DELTA]);
};

/** Resolves once the change has played and what left the number is gone. */
const settled = async () => {
	await expect.poll(() => root().dataset.animating, { timeout: 4000 }).toBeUndefined();
	expect(running()).toHaveLength(0);
	expect(exiting()).toHaveLength(0);
};

describe('AnimatedNumber', () => {
	test('a11y:animated-number.text the number is read as plain text, and its characters are hidden', async () => {
		const view = await render(Harness, {
			props: { value: 1284, format: { style: 'currency', currency: 'USD' } }
		});

		expect(text().textContent).toBe('$1,284.00');
		expect(text().closest('[aria-hidden="true"]')).toBeNull();
		expect(visual().getAttribute('aria-hidden')).toBe('true');
		expect(shown()).toBe('$1,284.00');

		// The text is the number being shown from the start of a change, never a digit half way.
		await view.rerender({ value: 99 });
		expect(text().textContent).toBe('$99.00');
		expect(root().dataset.animating).toBe('');
		expect(running().length).toBeGreaterThan(0);

		await settled();
		expect(shown()).toBe('$99.00');
	});

	test('it is one box on its line, no taller than the text round it', async () => {
		const view = await render(Harness, { props: { value: 1284 } });
		const line = root().parentElement!.getBoundingClientRect().height;
		expect(line).toBe(60);
		// The window the wheels turn behind is larger than the number and takes no more room.
		expect(root().getBoundingClientRect().height).toBeLessThanOrEqual(41);

		await view.rerender({ variant: 'blur' });
		expect(root().parentElement!.getBoundingClientRect().height).toBe(60);
		expect(root().getBoundingClientRect().height).toBeLessThanOrEqual(41);
	});

	test('the digits in transit never make a scroll container round the number grow', async () => {
		const view = await render(Harness, {
			props: { value: 1284, scroller: true, duration: 300 }
		});
		const line = document.querySelector<HTMLElement>('[data-testid="line"]')!;
		expect(line.scrollHeight).toBe(line.clientHeight);

		await view.rerender({ value: 9753 });
		// Every wheel now holds a digit a line over the window and another a line under it.
		expect(numerals()).toHaveLength(40);
		expect(line.scrollHeight).toBe(line.clientHeight);
		for (const animation of running()) {
			animation.pause();
			animation.currentTime = 150;
		}
		expect(line.scrollHeight).toBe(line.clientHeight);
		for (const animation of running()) animation.finish();
		await settled();
	});

	test('a wheel carries its ten digits while it turns, and one at rest', async () => {
		const view = await render(Harness, { props: { value: 19, duration: 120 } });
		expect(numerals()).toHaveLength(2);

		await view.rerender({ value: 20 });
		expect(numerals()).toHaveLength(20);

		await settled();
		expect(numerals()).toHaveLength(2);
		expect(shown()).toBe('20');
	});

	test('a growing number turns its wheels upwards, the short way round', async () => {
		const view = await render(Harness, { props: { value: 19, duration: 120 } });

		await view.rerender({ value: 20 });
		// 9 to 0 is one step up, not nine down.
		expect(turn(char('integer', 'integer:0'))).toBe(1);
		expect(turn(char('integer', 'integer:1'))).toBe(1);
		await settled();

		await view.rerender({ value: 19 });
		expect(turn(char('integer', 'integer:0'))).toBe(-1);
		expect(turn(char('integer', 'integer:1'))).toBe(-1);
		await settled();
	});

	test('a digit that changes moves nothing else', async () => {
		const view = await render(Harness, { props: { value: 1284, duration: 300 } });
		const places = () =>
			['integer:3', 'group:0', 'integer:2', 'integer:1', 'integer:0'].map((key) =>
				Math.round(char('integer', key)!.getBoundingClientRect().left)
			);
		const before = places();

		await view.rerender({ value: 1285 });
		// Only the units turn: no character slides, and the window keeps its box.
		expect(turn(char('integer', 'integer:0'))).toBe(1);
		expect(running()).toHaveLength(1);
		expect(places()).toEqual(before);
		await settled();
	});

	test('the window goes to the width the new number really has', async () => {
		const view = await render(Harness, { props: { value: 1284, duration: 300 } });
		const number = root().querySelector<HTMLElement>('[data-slot="animated-number-number"]')!;
		const digit = char('integer', 'integer:0')!.getBoundingClientRect().width;

		await view.rerender({ value: 1848739 });
		// Read once every wheel shows its one new digit, not while it still holds the old one.
		expect(number.style.getPropertyValue('--_width')).toBe(String(number.offsetWidth));
		// The digits that stay keep their distance from one another all the way.
		for (const animation of running()) {
			animation.pause();
			animation.currentTime = 100;
		}
		const lefts = ['integer:3', 'integer:2', 'integer:1', 'integer:0'].map(
			(key) => char('integer', key)!.getBoundingClientRect().left
		);
		expect(lefts[2] - lefts[1]).toBeCloseTo(digit, 0);
		expect(lefts[3] - lefts[2]).toBeCloseTo(digit, 0);
		for (const animation of running()) animation.finish();
		await settled();
	});

	test('trend holds one way, or lets each digit go straight', async () => {
		const view = await render(Harness, { props: { value: 20, trend: 'down', duration: 120 } });

		// A countdown that wraps: 20 to 59 still goes downwards.
		await view.rerender({ value: 59 });
		expect(turn(char('integer', 'integer:1'))).toBe(-7);
		expect(turn(char('integer', 'integer:0'))).toBe(-1);
		await settled();

		await view.rerender({ value: 20, trend: 'nearest' });
		expect(turn(char('integer', 'integer:1'))).toBe(-3);
		expect(turn(char('integer', 'integer:0'))).toBe(-9);
		await settled();
	});

	test('continuous turns every digit under the one that changed', async () => {
		const view = await render(Harness, { props: { value: 120, continuous: true, duration: 120 } });

		await view.rerender({ value: 220 });
		expect(turn(char('integer', 'integer:2'))).toBe(1);
		expect(turn(char('integer', 'integer:1'))).toBe(10);
		expect(turn(char('integer', 'integer:0'))).toBe(10);
		await settled();

		// Without it, a digit that stays the same stays still.
		await view.rerender({ value: 320, continuous: false });
		expect(turn(char('integer', 'integer:2'))).toBe(1);
		expect(turn(char('integer', 'integer:1'))).toBe(0);
		await settled();
	});

	test('a digit that joins the number turns up from nought, and one that leaves is held then dropped', async () => {
		const view = await render(Harness, { props: { value: 987, duration: 120 } });
		const units = char('integer', 'integer:0')!;

		await view.rerender({ value: 1987 });
		// The units are the same element: the number grew on the other side.
		expect(char('integer', 'integer:0')).toBe(units);
		const thousands = char('integer', 'integer:3')!;
		expect(thousands).not.toBeNull();
		expect(turn(thousands)).toBe(1);
		expect(char('integer', 'group:0')).not.toBeNull();
		await settled();
		expect(shown()).toBe('1,987');

		await view.rerender({ value: 987 });
		// Still there, out of the line, while it fades.
		expect(thousands.isConnected).toBe(true);
		expect(thousands.dataset.exiting).toBe('');
		expect(getComputedStyle(thousands).position).toBe('absolute');
		expect(char('integer', 'integer:0')).toBe(units);

		await settled();
		expect(thousands.isConnected).toBe(false);
		expect(char('integer', 'group:0')).toBeNull();
		expect(shown()).toBe('987');
	});

	test('a digit that comes back while it is leaving is put back in the line', async () => {
		const view = await render(Harness, { props: { value: 1987, duration: 400 } });
		const thousands = char('integer', 'integer:3')!;

		await view.rerender({ value: 987 });
		expect(thousands.dataset.exiting).toBe('');

		await view.rerender({ value: 2987 });
		expect(char('integer', 'integer:3')).toBe(thousands);
		expect(thousands.dataset.exiting).toBeUndefined();
		expect(getComputedStyle(thousands).position).not.toBe('absolute');

		await settled();
		expect(shown()).toBe('2,987');
		expect(Number(getComputedStyle(thousands).opacity)).toBe(1);
	});

	test('a change in the middle of another ends on the last number', async () => {
		const view = await render(Harness, { props: { value: 5, duration: 300 } });

		await view.rerender({ value: 1234 });
		await view.rerender({ value: 87 });
		await view.rerender({ value: 4321.5 });
		expect(text().textContent).toBe('4,321.5');

		await settled();
		expect(shown()).toBe('4,321.5');
		expect(numerals()).toHaveLength(5);
	});

	test('a symbol that changes is crossed with the next one', async () => {
		const view = await render(Harness, {
			props: { value: 5, format: { signDisplay: 'always' }, duration: 120 }
		});
		const sign = char('pre', 'sign:0')!;
		expect(sign.textContent).toBe('+');

		await view.rerender({ value: -5 });
		expect(char('pre', 'sign:0')).toBe(sign);
		expect(sign.querySelector('[data-layer="current"]')!.textContent).not.toBe('+');
		expect(sign.querySelector('[data-layer="outgoing"]')!.textContent).toBe('+');

		await settled();
		expect(sign.querySelector('[data-layer="outgoing"]')).toBeNull();
	});

	test('the blur variant swaps the digits that changed and leaves the others still', async () => {
		const view = await render(Harness, {
			props: { value: 1284, variant: 'blur', duration: 120 }
		});
		expect(numerals()).toHaveLength(0);

		await view.rerender({ value: 1294 });
		const tens = char('integer', 'integer:1')!;
		expect(tens.querySelector('[data-layer="current"]')!.textContent).toBe('9');
		expect(tens.querySelector('[data-layer="outgoing"]')!.textContent).toBe('8');
		expect(tens.getAnimations({ subtree: true }).length).toBeGreaterThan(0);
		for (const key of ['integer:0', 'integer:2', 'integer:3', 'group:0']) {
			expect(char('integer', key)!.getAnimations({ subtree: true })).toHaveLength(0);
			expect(char('integer', key)!.querySelector('[data-layer="outgoing"]')).toBeNull();
		}

		await settled();
		expect(tens.querySelector('[data-layer="outgoing"]')).toBeNull();
		expect(shown()).toBe('1,294');
	});

	test('the blur variant takes its blur from the prop', async () => {
		await render(Harness, { props: { value: 1, variant: 'blur', blur: 12 } });
		expect(root().style.getPropertyValue('--animated-number-blur')).toBe('12px');
	});

	test('with animated off the number changes at once', async () => {
		const view = await render(Harness, { props: { value: 987, animated: false } });

		await view.rerender({ value: 12345 });
		expect(running()).toHaveLength(0);
		expect(exiting()).toHaveLength(0);
		expect(numerals()).toHaveLength(5);
		expect(shown()).toBe('12,345');
	});

	test('turning animated off in the middle of a change ends it', async () => {
		const view = await render(Harness, { props: { value: 1987, duration: 2000 } });

		await view.rerender({ value: 12 });
		expect(exiting().length).toBeGreaterThan(0);

		await view.rerender({ animated: false });
		expect(running()).toHaveLength(0);
		expect(exiting()).toHaveLength(0);
		expect(numerals()).toHaveLength(2);
		expect(shown()).toBe('12');
	});

	test('under reduced motion the number changes at once', async () => {
		const view = await render(Harness, { props: { value: 987, reduceMotion: true } });

		await view.rerender({ value: 12345 });
		expect(running()).toHaveLength(0);
		expect(exiting()).toHaveLength(0);
		expect(shown()).toBe('12,345');
	});

	test('a number that changes width slides its symbols to their new place', async () => {
		const view = await render(Harness, {
			props: { value: 5, format: { style: 'currency', currency: 'USD' }, duration: 400 }
		});
		const currency = char('pre', 'currency:0')!;
		const before = currency.getBoundingClientRect().left;

		await view.rerender({ value: 12345 });
		// The number grew to the right of its place: the currency did not move in the page.
		expect(Math.abs(currency.getBoundingClientRect().left - before)).toBeLessThan(1);
		// The fraction was pushed along, and starts from where it was.
		const cents = section('fraction');
		expect(cents.getAnimations().length).toBeGreaterThan(0);

		await settled();
		expect(shown()).toBe('$12,345.00');
	});

	test('a locale written from right to left puts its symbols on that side of the digits', async () => {
		await render(Harness, {
			props: { value: 0.25, locale: 'ar-EG', format: { style: 'percent' } }
		});

		expect(root().dir).toBe('rtl');
		const digits = section('integer').getBoundingClientRect();
		const percent = section('post').getBoundingClientRect();
		// The percent sign follows the number, which in this direction is to its left.
		expect(percent.right).toBeLessThanOrEqual(digits.left + 1);
		// The digits themselves still run from left to right: the tens before the units.
		const tens = char('integer', 'integer:1')!.getBoundingClientRect();
		const units = char('integer', 'integer:0')!.getBoundingClientRect();
		expect(tens.left).toBeLessThan(units.left);
	});

	test('the same number in a new format object is not a change', async () => {
		const view = await render(Harness, {
			props: { value: 1284, format: { maximumFractionDigits: 0 } }
		});

		await view.rerender({ format: { maximumFractionDigits: 0 } });
		expect(running()).toHaveLength(0);
		expect(numerals()).toHaveLength(4);
	});
});
