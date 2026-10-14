// Server-rendered half of the Theme platform tests (`theme.platform.svelte.test.ts` has the
// client half): the nonce reaches every injected tag and is escaped as an attribute value.
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import ThemePlatformHarness from './ThemePlatformHarness.test.svelte';

describe('Theme nonce in server-rendered markup (CX-8)', () => {
	test('stamps the boot scripts and the design-token stylesheet', () => {
		const { head } = render(ThemePlatformHarness, { props: { nonce: 'ssr-nonce' } });
		const tags = head.match(/<(?:script|style)\b[^>]*>/g) ?? [];
		// Theme boot script, viewport and reduced-motion script, design-token stylesheet.
		expect(tags.length).toBeGreaterThanOrEqual(3);
		expect(tags.filter((tag) => !tag.includes('nonce="ssr-nonce"'))).toEqual([]);
	});

	test('escapes the nonce as an attribute value', () => {
		const { head } = render(ThemePlatformHarness, { props: { nonce: 'a"b<c' } });
		expect(head).toContain('nonce="a&quot;b&lt;c"');
		expect(head).not.toContain('nonce="a"b');
	});

	test('emits no nonce attribute without one', () => {
		const { head } = render(ThemePlatformHarness);
		expect(head).not.toContain('nonce');
	});
});
