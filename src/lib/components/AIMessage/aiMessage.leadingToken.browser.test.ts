// A message that starts with a token: the chip starts where the text of the other lines does, with
// no space before it, also when the app draws it inside a HoverCard (a Popover trigger).
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './AIMessageLeadingTokenHarness.test.svelte';

const paragraph = () => document.querySelector<HTMLElement>('[data-slot="ai-message-content"] p');

test('a hover-card mention at the start of a line has no space before it', async () => {
	await render(Harness, { custom: true, content: '<Mention id="u1" label="Léa" /> salut' });
	await expect.poll(paragraph).not.toBeNull();
	const p = paragraph()!;
	const chip = p.querySelector<HTMLElement>('[data-variant]')!;
	const before: string[] = [];
	for (let node = p.firstChild; node && !node.contains(chip); node = node.nextSibling) {
		if (node.nodeType === Node.TEXT_NODE) before.push(node.textContent ?? '');
	}
	// Only the zero-width mark that keeps the token inline.
	expect(before.join('').replace(/\u200B/g, '')).toBe('');
	expect(chip.getBoundingClientRect().left).toBe(p.getBoundingClientRect().left);
});
