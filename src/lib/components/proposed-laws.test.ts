// Server-rendered entries for the proposed laws (decisions.md); the client entries and the
// `pending` convention are described in `proposed-laws.svelte.test.ts`.
import { createRawSnippet, type Component } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Theme from './Theme/Theme.svelte';

describe('law 14 · CSP (F9 · CX-8)', () => {
	test('every script and style Theme puts in the head carries its nonce', () => {
		const nonce = 'law-14-nonce';
		// Theme is generic over its theme names; the cast keeps the props record untyped.
		const { head } = render(Theme as unknown as Component<Record<string, unknown>>, {
			props: {
				nonce,
				children: createRawSnippet(() => ({ render: () => '<p>Page</p>' }))
			}
		});
		const tags = head.match(/<(?:script|style)\b[^>]*>/g) ?? [];
		expect(tags.length).toBeGreaterThan(0);
		expect(tags.filter((tag) => !tag.includes(`nonce="${nonce}"`))).toEqual([]);
	});
});
