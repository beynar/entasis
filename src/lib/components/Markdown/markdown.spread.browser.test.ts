// Options that change after mount, passed to Markdown with a spread or to a message as
// `markdownProps`. svelte-streamdown before 5.0.2 lost its context on the next render and threw.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './MarkdownSpreadHarness.test.svelte';

const host = () => document.querySelector<HTMLElement>('[data-testid="host"]')!;
const heading = () => host().querySelector('h1, h2, h3')?.textContent ?? '';

describe.each([
	['Markdown', false],
	['AIMessage', true]
])('%s', (_, message) => {
	test('changing an option after mount keeps the text drawn', async () => {
		const view = await render(Harness, {
			props: { content: '# Title\n\nSome **bold** text.', options: { lineNumbers: false }, message }
		});
		await expect.poll(heading).toBe('Title');

		await view.rerender({
			content: '# Title\n\nSome **bold** text.',
			options: { lineNumbers: true },
			message
		});
		await view.rerender({
			content: '# Other\n\nNew text.',
			options: { lineNumbers: true },
			message
		});
		await expect.poll(heading).toBe('Other');
		expect(host().querySelector('p')?.textContent).toBe('New text.');
	});
});
