import { describe, expect, test } from 'vitest';
import { componentInventory } from '$lib/generated/componentContract.js';
import { componentMcpRegistry } from '$lib/generated/componentMcpRegistry.js';
import { componentMarkdownResponse, llmsTxtResponse } from './agentDocs.server.js';

const origin = 'https://docs.example';

describe('llms.txt', () => {
	test('links one Markdown page per public component and entrypoint', async () => {
		const response = llmsTxtResponse(origin);
		expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
		const text = await response.text();
		expect(text.startsWith('# entasis\n\n> ')).toBe(true);
		const links = [...text.matchAll(/^- \[[^\]]+\]\(([^)]+)\)/gm)].map(([, href]) => href);
		const publicIds = componentInventory
			.filter((entry) => entry.visibility === 'public' && entry.subpath)
			.flatMap((entry) => [entry.id, ...entry.docs.map((doc) => doc.id)])
			.filter((id) => id in componentMcpRegistry);
		expect(new Set(links)).toEqual(new Set(publicIds.map((id) => `${origin}/components/${id}.md`)));
		expect(text).toContain(`- [Card](${origin}/components/card.md): \`entasis/card\`. `);
	});
});

describe('component Markdown', () => {
	test('serves the MCP description with its import and related pages', async () => {
		const response = componentMarkdownResponse('card', origin);
		expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
		const text = await response.text();
		expect(text).toContain(componentMcpRegistry.card.trim());
		expect(text).toMatch(/^- Import: `entasis\/card`, exporting `Card`, /m);
		expect(text).toContain(`- Documentation page: ${origin}/components/card`);
	});

	test('serves a documentation id that shares its entry, and refuses an unknown one', async () => {
		expect(await componentMarkdownResponse('grid-span', origin).text()).toContain(
			'- Category: Layout'
		);
		expect(() => componentMarkdownResponse('not-a-component', origin)).toThrow();
	});
});
