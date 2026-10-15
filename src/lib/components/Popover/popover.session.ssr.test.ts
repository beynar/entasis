// An open popover renders on the server with its open-only session (CX-10): the session
// registers its layer and hooks during SSR without touching the DOM.
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import PopoverInlineHarness from './PopoverInlineHarness.test.svelte';

describe('Popover on the server', () => {
	test('an open inline popover renders its panel', () => {
		const { body } = render(PopoverInlineHarness, { props: { inline: true, open: true } });
		expect(body).toContain('Inside popover');
		expect(body).toMatch(/aria-expanded="true"/);
	});

	test('a closed popover renders only its trigger', () => {
		const { body } = render(PopoverInlineHarness, { props: { inline: true, open: false } });
		expect(body).toContain('Open popover');
		expect(body).not.toContain('Inside popover');
	});
});
