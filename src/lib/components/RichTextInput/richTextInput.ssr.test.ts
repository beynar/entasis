// RichTextInput, and what embeds it, renders on the server with every toolbar mode: no browser
// global (HTMLElement, document, window) may be read while rendering.
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Harness from './RichTextInputSsrHarness.test.svelte';

describe('server rendering', () => {
	test.each(['hover', 'both', 'fixed', 'none'] as const)(
		'a RichTextInput with toolbar="%s" renders',
		(toolbar) => {
			expect(render(Harness, { props: { kind: 'input', toolbar } }).body).toContain('Notes');
		}
	);

	test.each(['hover', 'both'] as const)(
		'a Form with a rich-text entry (toolbar="%s") renders',
		(toolbar) => {
			expect(render(Harness, { props: { kind: 'form', toolbar } }).body).toContain('Description');
		}
	);

	test('the AI composer renders', () => {
		expect(() => render(Harness, { props: { kind: 'composer' } })).not.toThrow();
	});
});
