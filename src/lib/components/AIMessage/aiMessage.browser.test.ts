// Message typography, bubble geometry and action alignment, measured with the real stylesheet.
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './AIMessageHarness.test.svelte';

const q = <T extends Element = HTMLElement>(selector: string) =>
	document.querySelector<T>(selector) as T;
const style = (selector: string) => getComputedStyle(q(selector));
const prose = [
	'Body text with `inline code` in it.',
	'',
	'- A list item long enough to wrap onto a second line inside a narrow message column, so the hanging indent shows.',
	'- Short item',
	'',
	'## A heading',
	'',
	'| Gate | Owner |',
	'| --- | --- |',
	'| Copy | Marketing |'
].join('\n');

async function renderProse(props: Record<string, unknown> = {}) {
	await render(Harness, { props: { content: prose, width: 360, ...props } });
	await expect
		.poll(() => document.querySelector('[data-slot="ai-message-content"] td'))
		.not.toBeNull();
}

describe('AIMessage', () => {
	test('defaults to flat assistant prose at the compact text-sm size and a neutral user bubble', async () => {
		const screen = await render(Harness, { props: { content: 'Hello there' } });
		await expect.poll(() => document.querySelector('[data-slot="ai-message"]')).not.toBeNull();
		expect(q('[data-slot="ai-message"]').dataset.variant).toBe('minimal');
		expect(style('[data-slot="ai-message-content"]').backgroundColor).toBe('rgba(0, 0, 0, 0)');
		// `normal` reads at text-sm (14px in the default type scale): one step below body text.
		const fontSize = parseFloat(style('[data-slot="ai-message-content"] p').fontSize);
		expect(fontSize).toBeGreaterThanOrEqual(13);
		expect(fontSize).toBeLessThan(16);
		expect(
			parseFloat(style('[data-slot="ai-message-content"] p').lineHeight) /
				parseFloat(style('[data-slot="ai-message-content"] p').fontSize)
		).toBeCloseTo(1.625, 1);

		await screen.rerender({ from: 'user' });
		await expect.poll(() => q('[data-slot="ai-message"]').dataset.from).toBe('user');
		const neutral = style('[data-slot="ai-message-content"]').backgroundColor;
		expect(neutral).not.toBe('rgba(0, 0, 0, 0)');
		await screen.rerender({ color: 'primary' });
		await expect
			.poll(() => style('[data-slot="ai-message-content"]').backgroundColor)
			.not.toBe(neutral);
	});

	test('bubble tails follow the writing direction', async () => {
		const screen = await render(Harness, { props: { from: 'user', content: 'Hi' } });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-message-content"]'))
			.not.toBeNull();
		const ltr = style('[data-slot="ai-message-content"]');
		expect(parseFloat(ltr.borderBottomRightRadius)).toBeLessThan(
			parseFloat(ltr.borderBottomLeftRadius)
		);
		await screen.rerender({ dir: 'rtl' });
		await expect
			.poll(() => {
				const rtl = style('[data-slot="ai-message-content"]');
				return parseFloat(rtl.borderBottomLeftRadius) < parseFloat(rtl.borderBottomRightRadius);
			})
			.toBe(true);
	});

	test('lists hang-indent, inline code reads as a chip, tables sit at body size', async () => {
		await renderProse();
		const ul = style('[data-slot="ai-message-content"] ul');
		expect(ul.listStylePosition).toBe('outside');
		expect(parseFloat(ul.paddingInlineStart)).toBeGreaterThan(8);
		expect(parseFloat(ul.marginLeft)).toBe(0);

		const code = q('[data-slot="ai-message-content"] p code');
		const codeStyle = getComputedStyle(code);
		const bodySize = parseFloat(style('[data-slot="ai-message-content"] p').fontSize);
		expect(codeStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
		expect(parseFloat(codeStyle.fontSize) / bodySize).toBeCloseTo(0.9, 1);

		const cell = style('[data-slot="ai-message-content"] td');
		expect(parseFloat(cell.fontSize)).toBe(bodySize);
		expect(cell.minWidth === '0px' || cell.minWidth === 'auto').toBe(true);

		const heading = parseFloat(style('[data-slot="ai-message-content"] h2').fontSize);
		expect(heading / bodySize).toBeGreaterThan(1.1);
		expect(heading / bodySize).toBeLessThan(1.4);
	});

	test('table cells align to the logical start in RTL; an explicit column alignment still wins', async () => {
		// A short body cell under a long header, so start versus left alignment is visible.
		const table = ['| Release gate name | Owner |', '| --- | :---: |', '| Go | Marketing |'].join(
			'\n'
		);
		await render(Harness, { props: { content: table, dir: 'rtl', width: 360 } });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-message-content"] td'))
			.not.toBeNull();
		const [th, centredTh] = Array.from(
			document.querySelectorAll<HTMLElement>('[data-slot="ai-message-content"] th')
		);
		const [td, centredTd] = Array.from(
			document.querySelectorAll<HTMLElement>('[data-slot="ai-message-content"] td')
		);
		// A cell's text hugs the inline start edge, which is the right edge in RTL.
		const startGap = (cell: HTMLElement) => {
			const range = document.createRange();
			range.selectNodeContents(cell);
			const text = range.getBoundingClientRect();
			const box = cell.getBoundingClientRect();
			return box.right - parseFloat(getComputedStyle(cell).paddingRight) - text.right;
		};
		expect(Math.abs(startGap(th))).toBeLessThan(1);
		expect(Math.abs(startGap(td))).toBeLessThan(1);
		expect(getComputedStyle(centredTh).textAlign).toMatch(/center$/);
		expect(getComputedStyle(centredTd).textAlign).toMatch(/center$/);
	});

	test('a narrow message gives the user bubble its full width', async () => {
		const long = 'A user message long enough to wrap across the full width of the column.';
		const screen = await render(Harness, { props: { from: 'user', content: long, width: 300 } });
		await expect.poll(() => document.querySelector('[data-slot="ai-message-body"]')).not.toBeNull();
		expect(Math.round(q('[data-slot="ai-message-body"]').getBoundingClientRect().width)).toBe(300);
		await screen.rerender({ width: 700 });
		await expect
			.poll(() => Math.round(q('[data-slot="ai-message-body"]').getBoundingClientRect().width))
			.toBeLessThanOrEqual(Math.round(700 * 0.82));
	});

	test('a streaming reply shows a caret; a files-only message shows no empty bubble', async () => {
		const screen = await render(Harness, { props: { content: 'Typing', streaming: true } });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-message-caret"]'))
			.not.toBeNull();
		await screen.rerender({
			streaming: false,
			content: '',
			from: 'user',
			files: [{ name: 'a.md' }]
		});
		await expect.poll(() => document.querySelector('[data-slot="ai-message-caret"]')).toBeNull();
		await expect.poll(() => document.querySelector('[data-slot="ai-message-content"]')).toBeNull();
	});

	test('actions take layout space, line up with the text edge, and have tooltips', async () => {
		await render(Harness, { props: { content: 'Copy me' } });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-message-actions"] button'))
			.not.toBeNull();
		const actions = q('[data-slot="ai-message-actions"]');
		expect(getComputedStyle(actions).position).toBe('static');
		const text = q('[data-slot="ai-message-content"] p').getBoundingClientRect();
		const icon = actions.querySelector('svg')!.getBoundingClientRect();
		expect(Math.abs(icon.left - text.left)).toBeLessThanOrEqual(1.5);

		await userEvent.hover(actions.querySelector('button')!);
		await expect
			.poll(() => document.querySelector('[role="tooltip"]')?.textContent?.trim())
			.toBe('Copy');
	});

	test.each([
		['user', undefined],
		['assistant', undefined],
		['assistant', 'bubble']
	] as const)(
		'the action row never wraps under a one-word %s message (%s)',
		async (from, variant) => {
			await render(Harness, {
				props: { from, variant, content: 'yo', onEdit: () => {}, onRetry: () => {} }
			});
			await expect
				.poll(() => document.querySelectorAll('[data-slot="ai-message-actions"] button').length)
				.toBe(2);
			const buttons = [
				...document.querySelectorAll<HTMLElement>('[data-slot="ai-message-actions"] button')
			].map((button) => button.getBoundingClientRect());
			expect(buttons.every((rect) => Math.abs(rect.top - buttons[0]!.top) < 0.5)).toBe(true);
			expect(buttons[1]!.left).toBeGreaterThan(buttons[0]!.left);
			// User rows stay at the bubble's end edge, assistant rows at the start edge.
			const bubble = q('[data-slot="ai-message-content"]').getBoundingClientRect();
			const icons = [
				...document.querySelectorAll<SVGElement>('[data-slot="ai-message-actions"] svg')
			].map((icon) => icon.getBoundingClientRect());
			if (from === 'user') {
				expect(Math.abs(icons.at(-1)!.right - bubble.right)).toBeLessThanOrEqual(1.5);
			} else {
				expect(icons[0]!.left).toBeLessThanOrEqual(bubble.left + 1.5);
			}
		}
	);
});
