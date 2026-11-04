// The server path: Svelte writes `style` into the HTML as one string, so a `;` in a value starts a
// new declaration before any browser API could refuse it.
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import MarkdownSecurityHarness from './MarkdownSecurityHarness.test.svelte';
import { mdxAttributeNames, type MarkdownMdxTag } from './markdown.mdx.js';

const TAGS: readonly MarkdownMdxTag[] = ['Stack', 'Grid', 'GridSpan', 'Card', 'Stat'];
const HOSTILE = '1px;background:url(https://example.test/leak);position:fixed';

const declarations = (body: string) =>
	[...body.matchAll(/\sstyle="([^"]*)"/g)].flatMap(([, style]) =>
		style
			.split(';')
			.map((declaration) => declaration.trim())
			.filter(Boolean)
	);

const draw = (content: string) => render(MarkdownSecurityHarness, { props: { content } }).body;

const everyAttribute = TAGS.flatMap((tag) => mdxAttributeNames(tag).map((name) => [tag, name]));

describe('a value on the server', () => {
	test.each(everyAttribute)('%s %s adds no declaration', (tag, name) => {
		// Theme writes its own styles, so what counts is the same tag without the attribute.
		const own = new Set(declarations(draw(`<${tag}>x</${tag}>`)));
		for (const written of [`${name}="${HOSTILE}"`, `${name}={${HOSTILE}}`]) {
			const body = draw(`<${tag} ${written}>x</${tag}>`);
			expect(body, written).toContain('x');
			for (const declaration of declarations(body)) {
				expect(own.has(declaration), `${written}: ${declaration}`).toBe(true);
			}
		}
	});

	test.each([
		'<Stack width="1px;background:url(https://example.test/x)">a</Stack>',
		'<Stack wrap="nowrap;background:url(https://example.test/x)">a</Stack>',
		'<Grid maxWidth="1px;background:url(https://example.test/x)">a</Grid>',
		'<Stack minHeight="1px;background:url(https://example.test/x)">a</Stack>',
		'<Stack width="100vw;position:fixed;top:0;left:0;height:100vh;z-index:99999">a</Stack>'
	])('%s writes nothing of it', (content) => {
		const tag = content.slice(1, content.indexOf(' '));
		const own = new Set(declarations(draw(`<${tag}>a</${tag}>`)));
		const body = draw(content);
		expect(body).toContain('a');
		for (const declaration of declarations(body))
			expect(own.has(declaration), declaration).toBe(true);
	});

	test('a value the component can take still reaches its style', () => {
		const stack = draw(
			'<Stack width="100%" height="50vh" maxWidth="40rem" minHeight={120} wrap="wrap">a</Stack>'
		);
		expect(stack).toContain('width: 100%');
		expect(stack).toContain('height: 50vh');
		expect(stack).toContain('max-width: 40rem');
		expect(stack).toContain('min-height: 120px');
		expect(stack).toContain('--stack-wrap-xs:wrap');

		const grid = draw('<Grid width="12rem" columns={2} gap="md">a</Grid>');
		expect(grid).toContain('width: 12rem');
		expect(grid).toContain('repeat(2, minmax(0, 1fr))');
	});

	test('a literal value does not throw a whole message away', () => {
		const body = draw(
			'<Stat label={true} value={42} unit={0}>a</Stat>\n\n<Card title={true}>b</Card>'
		);
		expect(body).toContain('42');
		expect(body).toContain('b');
	});
});
