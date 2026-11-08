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
