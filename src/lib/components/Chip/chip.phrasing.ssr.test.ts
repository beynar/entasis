// A chip sits in running text: a static one, its prefix and its suffix render as phrasing content,
// so a chip inside a Markdown paragraph hydrates without `node_invalid_placement_ssr`.
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { expect, test } from 'vitest';
import Chip from './Chip.svelte';

const html = (value: string) => createRawSnippet(() => ({ render: () => `<i>${value}</i>` }));

test('a static chip and its prefix and suffix wrappers are spans', () => {
	const { body } = render(Chip, {
		props: { children: html('Ancien membre'), prefix: html('@'), suffix: html('×') }
	});
	expect(body).not.toMatch(/<div/);
	expect(body).toMatch(/^(?:<!--[^>]*-->)*<span[^>]*data-variant/);
	expect(body.match(/<span/g)).toHaveLength(3);
});

test('a chip that acts stays a button, with span wrappers inside', () => {
	const { body } = render(Chip, {
		props: { children: html('Léa'), prefix: html('@'), onclick: () => {} }
	});
	expect(body).toMatch(/<button/);
	expect(body).not.toMatch(/<div/);
});
