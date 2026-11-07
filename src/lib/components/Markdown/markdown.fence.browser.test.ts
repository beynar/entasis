// A ```mermaid fence that cannot draw. While it is being written that is expected, so the frame
// stays. Once it is whole, the reader gets what the model wrote instead of an empty box.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './MarkdownFenceHarness.test.svelte';

const BROKEN = 'flowchart TD\n  A[[[';
const GOOD = 'flowchart TD\n  A --> B';
const fence = (source: string, closed = true) => `\`\`\`mermaid\n${source}\n${closed ? '```' : ''}`;

const host = () => document.querySelector<HTMLElement>('[data-testid="host"]')!;
const frame = () => host().querySelector('[class*="group/mermaid"]');
const shownSource = () => host().querySelector('pre')?.textContent ?? '';
// Long enough for the renderer to load and answer.
const settle = () => new Promise((resolve) => setTimeout(resolve, 1500));

describe.each([
	['Markdown', false],
	['AIMessage', true]
])('%s', (_, message) => {
	test('a whole fence that cannot draw shows its source', async () => {
		await render(Harness, { props: { content: fence(BROKEN), message } });
		await expect.poll(shownSource, { timeout: 8000 }).toContain('A[[[');
		expect(frame()).toBeNull();
	});

	test('a fence still being written keeps its frame', async () => {
		await render(Harness, { props: { content: fence(BROKEN, false), message } });
		await settle();
		expect(frame()).not.toBeNull();
		expect(shownSource()).toBe('');
	});

	test('it shows its source once the fence closes on the same text', async () => {
		const view = await render(Harness, { props: { content: fence(BROKEN, false), message } });
		await settle();
		await view.rerender({ content: fence(BROKEN), message });
		await expect.poll(shownSource, { timeout: 8000 }).toContain('A[[[');
		expect(frame()).toBeNull();
	});

	test('under `static` an unclosed fence is finished, so it shows its source', async () => {
		await render(Harness, { props: { content: fence(BROKEN, false), message, isStatic: true } });
		await expect.poll(shownSource, { timeout: 8000 }).toContain('A[[[');
		expect(frame()).toBeNull();
	});

	test('a diagram that draws stays a diagram', async () => {
		await render(Harness, { props: { content: fence(GOOD), message } });
		await expect
			.poll(() => frame()?.querySelector('svg text, svg path') ?? null, { timeout: 8000 })
			.not.toBeNull();
		expect(shownSource()).toBe('');
	});

	test('new text that draws brings the diagram back', async () => {
		const view = await render(Harness, { props: { content: fence(BROKEN), message } });
		await expect.poll(shownSource, { timeout: 8000 }).toContain('A[[[');
		await view.rerender({ content: fence(GOOD), message });
		await expect.poll(frame, { timeout: 8000 }).not.toBeNull();
		await settle();
		expect(shownSource()).toBe('');
	});
});
