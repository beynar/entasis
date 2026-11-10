// `inline` draws one line in the type of what holds it: no block, no scale of its own.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './MarkdownInlineHarness.test.svelte';

const title = () => document.querySelector<HTMLElement>('[data-testid="title"]')!;

describe('Markdown inline', () => {
	test('draws inline Markdown in a span, in the type of its holder', async () => {
		await render(Harness, { props: { content: 'Plan **Q3** with `code`' } });
		await expect.poll(() => title().querySelector('strong')?.textContent).toBe('Q3');
		const line = title().querySelector<HTMLElement>('.line')!;
		expect(line.tagName).toBe('SPAN');
		expect(title().querySelector('div, p')).toBeNull();
		expect(getComputedStyle(line).fontSize).toBe('30px');
		expect(title().textContent).toBe('Plan Q3 with code');
	});

	test('a heading marker stays text', async () => {
		await render(Harness, { props: { content: '# Not a heading' } });
		await expect.poll(() => title().textContent).toBe('# Not a heading');
		expect(title().querySelector('h1')).toBeNull();
	});
});

const block = () => document.querySelector<HTMLElement>('[data-testid="block"]')!;
const LINK = 'Voir [le devis](https://example.com/d-12)';

describe('Markdown inline keeps the root theme', () => {
	test('a registry root class reaches the inline line, and the block', async () => {
		await render(Harness, {
			props: { content: LINK, components: { markdown: { root: { base: 'test-link-colour' } } } }
		});
		await expect.poll(() => title().querySelector('a')?.textContent).toBe('le devis');
		const line = title().querySelector<HTMLElement>('.line')!;
		expect(line.classList).toContain('test-link-colour');
		expect(block().firstElementChild?.classList).toContain('test-link-colour');
	});

	test('the instance theme reaches the inline line', async () => {
		await render(Harness, {
			props: { content: LINK, theme: { root: { base: 'test-instance-root' } } }
		});
		await expect.poll(() => title().querySelector('a')?.textContent).toBe('le devis');
		expect(title().querySelector('.line')?.classList).toContain('test-instance-root');
	});

	test('the inline line drops only the size scale and the block width', async () => {
		await render(Harness, { props: { content: LINK } });
		await expect.poll(() => title().querySelector('a')?.textContent).toBe('le devis');
		const inlineClasses = [...title().querySelector('.line')!.classList];
		expect(
			inlineClasses.filter((name) => /^(text-(xs|sm|base)|leading-|w-full)/.test(name))
		).toEqual([]);
		const blockClasses = [...block().firstElementChild!.classList];
		expect(blockClasses).toEqual(expect.arrayContaining(['w-full', 'text-sm', 'leading-relaxed']));
	});

	test('a link carries no palette colour, inline or as a block', async () => {
		await render(Harness, { props: { content: LINK } });
		await expect.poll(() => title().querySelector('a')?.textContent).toBe('le devis');
		for (const link of [title().querySelector('a')!, block().querySelector('a')!]) {
			expect(link.className).not.toMatch(/\b(blue|gray|slate|zinc)-\d/);
			expect(link.classList).toContain('hover:text-primary-readable/70');
		}
	});
});
