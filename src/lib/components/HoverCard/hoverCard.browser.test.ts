// A card that is still closing reopens at once (OV-21). The close transition runs for real here,
// which jsdom does not do.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import HoverCardHarness from './HoverCardHarness.test.svelte';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const trigger = () => page.getByRole('button', { name: 'Card trigger' }).element() as HTMLElement;
const body = () => page.getByText('Card body');

describe('reopening while the card closes (OV-21)', () => {
	test('pointing at the trigger again during the close transition opens at once', async () => {
		render(HoverCardHarness, {
			props: {
				scenario: 'single',
				card: {
					delay: 900,
					closeDelay: 0,
					transition: { in: { duration: 0 }, out: { duration: 1500 } }
				}
			}
		});
		// The first hover of the page waits out the whole delay.
		await userEvent.hover(trigger());
		await sleep(150);
		expect(trigger().getAttribute('aria-expanded')).toBe('false');
		await expect
			.poll(() => trigger().getAttribute('aria-expanded'), { timeout: 2500 })
			.toBe('true');

		await userEvent.unhover(trigger());
		await expect.poll(() => trigger().getAttribute('aria-expanded')).toBe('false');
		// Past the hover group's 400 ms warm-up window, with the card still on its way out.
		await sleep(550);
		await expect.element(body()).toBeInTheDocument();

		await userEvent.hover(trigger());
		await sleep(80);
		expect(trigger().getAttribute('aria-expanded')).toBe('true');
	});

	test('once the close transition has ended, the delay applies again', async () => {
		render(HoverCardHarness, {
			props: {
				scenario: 'single',
				card: {
					delay: 700,
					closeDelay: 0,
					transition: { in: { duration: 0 }, out: { duration: 100 } }
				}
			}
		});
		await userEvent.hover(trigger());
		await expect
			.poll(() => trigger().getAttribute('aria-expanded'), { timeout: 2000 })
			.toBe('true');
		await userEvent.unhover(trigger());
		await expect.element(body()).not.toBeInTheDocument();
		await sleep(500);

		await userEvent.hover(trigger());
		await sleep(150);
		expect(trigger().getAttribute('aria-expanded')).toBe('false');
		await expect
			.poll(() => trigger().getAttribute('aria-expanded'), { timeout: 2000 })
			.toBe('true');
	});
});

// A trigger that breaks across lines (OV-20b): the card follows the line the pointer entered, and
// `anchorTo` overrides what `wrap` picks.
describe('a wrapping trigger', () => {
	const link = () => page.getByRole('link').element() as HTMLElement;
	const card = () => document.querySelector<HTMLElement>('dialog[open] > div');
	const lines = () => [...(link().parentElement as HTMLElement).getClientRects()];
	const hoverLine = async (index: number) => {
		const rect = lines()[index];
		const box = link().getBoundingClientRect();
		await userEvent.hover(link(), {
			position: {
				x: rect.left + rect.width / 2 - box.left,
				y: rect.top + rect.height / 2 - box.top
			}
		});
	};
	const cardTop = async () => {
		await expect.poll(card).not.toBeNull();
		await expect.poll(() => card()!.getBoundingClientRect().height).toBeGreaterThan(0);
		return card()!.getBoundingClientRect().top;
	};

	test('wrap anchors the card to the hovered line', async () => {
		render(HoverCardHarness, { props: { scenario: 'wrap', card: { wrap: true } } });
		const all = lines();
		expect(all.length).toBeGreaterThan(1);
		await hoverLine(0);
		expect(Math.abs((await cardTop()) - (all[0].bottom + 4))).toBeLessThan(2);
	});

	test('anchorTo="box" keeps the card under the whole trigger box even when it wraps', async () => {
		render(HoverCardHarness, {
			props: { scenario: 'wrap', card: { wrap: true, anchorTo: 'box' } }
		});
		const all = lines();
		const box = (link().parentElement as HTMLElement).getBoundingClientRect();
		await hoverLine(0);
		const top = await cardTop();
		expect(Math.abs(top - (box.bottom + 4))).toBeLessThan(2);
		expect(top).toBeGreaterThan(all[0].bottom + 4 + 2);
	});

	test('anchorTo="line" anchors to the line without wrap', async () => {
		render(HoverCardHarness, {
			props: { scenario: 'wrap', card: { wrap: false, anchorTo: 'line' } }
		});
		const all = lines();
		await hoverLine(0);
		const top = await cardTop();
		expect(Math.abs(top - (all[0].bottom + 4))).toBeLessThan(2);
	});
});

describe('arrow', () => {
	test('arrow draws a pointer on the card that reports its side', async () => {
		render(HoverCardHarness, {
			props: { scenario: 'single', card: { arrow: true, delay: 0, position: 'bottom' } }
		});
		await userEvent.hover(trigger());
		await expect.poll(() => document.querySelector('dialog[open]')).not.toBeNull();
		const arrow = document.querySelector<HTMLElement>(
			'dialog[open] [data-side][aria-hidden="true"]'
		);
		expect(arrow).not.toBeNull();
		await expect.poll(() => arrow!.getAttribute('data-side')).toBe('bottom');
	});

	test('no arrow by default', async () => {
		render(HoverCardHarness, { props: { scenario: 'single', card: { delay: 0 } } });
		await userEvent.hover(trigger());
		await expect.poll(() => document.querySelector('dialog[open]')).not.toBeNull();
		expect(document.querySelector('dialog[open] [data-side][aria-hidden="true"]')).toBeNull();
	});
});
