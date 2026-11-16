// The server markup already shows the formatted value, the format as placeholder and the
// submitted value, so a page reads right before Maskito attaches.
import type { Component } from 'svelte';
import { expect, test } from 'vitest';
import { renderInThemeServer } from '../../Theme/renderInThemeServer.test-helper.js';
import MaskedInput from './MaskedInput.svelte';

const serverRender = async (props: Record<string, unknown>) =>
	(
		await renderInThemeServer(MaskedInput as unknown as Component<Record<string, unknown>>, {
			label: 'Plate',
			mask: 'AA-###-AA',
			...props
		})
	).body;

const inputTag = (html: string, test: RegExp) =>
	html.match(/<input\b[^>]*>/g)?.find((tag) => test.test(tag)) ?? '';

test('the server renders the formatted value and the format placeholder', async () => {
	const html = await serverRender({ defaultValue: 'AB123CD', name: 'plate' });
	const visible = inputTag(html, /type="text"/);
	expect(visible).toContain('value="AB-123-CD"');
	expect(visible).toContain('placeholder="__-___-__"');
	expect(visible).toContain('inputmode="text"');
	expect(visible).not.toMatch(/\sname=/);
	expect(inputTag(html, /name="plate"/)).toContain('value="AB123CD"');
});

test('showMask always renders the empty slots on the server', async () => {
	const html = await serverRender({ showMask: 'always', defaultValue: 'AB1' });
	expect(inputTag(html, /type="text"/)).toContain('value="AB-1__-__"');
});
