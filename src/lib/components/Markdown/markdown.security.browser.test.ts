// Markdown draws text a model or a stranger wrote: a row, an email, a web page. Whatever a tag in that
// text says, it makes no active element and sets no attribute the built-in does not document.
import { afterEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AIMessageSecurityHarness from './AIMessageSecurityHarness.test.svelte';
import MarkdownSecurityHarness from './MarkdownSecurityHarness.test.svelte';

const PWNED = '__markdownPwned';
const win = window as unknown as Record<string, unknown>;

const draw = async (content: string) => {
	const screen = await render(MarkdownSecurityHarness, { props: { content } });
	await new Promise((resolve) => setTimeout(resolve));
	return screen.container as HTMLElement;
};

// Anything that fetches, navigates, runs or takes over.
const ACTIVE =
	'a, area, iframe, frame, frameset, object, embed, applet, script, style, link, meta, base, form, input, button, select, textarea, video, audio, source, img, svg, math, details, dialog, marquee';

const expectInert = (root: HTMLElement) => {
	expect(root.querySelector(ACTIVE)).toBeNull();
	for (const element of root.querySelectorAll('*')) {
		for (const { name, value } of element.attributes) {
			const attribute = name.toLowerCase();
			expect(attribute.startsWith('on'), `${element.tagName} ${name}`).toBe(false);
			expect(
				[
					'href',
					'src',
					'srcdoc',
					'action',
					'formaction',
					'xlink:href',
					'data',
					'ping',
					'background'
				].includes(attribute),
				`${element.tagName} ${name}=${value}`
			).toBe(false);
			expect(value, `${element.tagName} ${name}`).not.toMatch(/^\s*(javascript|data|vbscript):/i);
		}
	}
};

afterEach(() => {
	delete win[PWNED];
});

describe('tags in the text', () => {
	test.each([
		// The two reported.
		'<Stack as="a" HREF="javascript:alert(1)">x</Stack>',
		'<Stack as="iframe" src="https://evil.example">x</Stack>',
		// The same, encoded and spelled otherwise.
		'<Stack as="a" HREF="java&#115;cript:alert(1)">x</Stack>',
		'<Stack as="a" href="%6A%61%76%61%73%63%72%69%70%74:alert(1)">x</Stack>',
		'<Stack AS="a" HrEf="JaVaScRiPt:alert(1)">x</Stack>',
		'<Stack as="A" href="javascript:alert(1)">x</Stack>',
		'<Stack as="iframe" SRC="data:text/html,<script>alert(1)</script>">x</Stack>',
		'<Stack as="iframe" srcdoc="<script>parent.__markdownPwned=1</script>">x</Stack>',
		'<Stack as="iframe" SRCDOC="<script>parent.__markdownPwned=1</script>">x</Stack>',
		// Every other way to make an active element.
		...[
			'object',
			'embed',
			'script',
			'style',
			'link',
			'meta',
			'base',
			'form',
			'button',
			'input',
			'img',
			'svg',
			'video',
			'audio',
			'details',
			'dialog',
			'textarea',
			'select',
			'area'
		].map(
			(tag) =>
				`<Stack as="${tag}" src="https://evil.example" data="https://evil.example" action="https://evil.example">x</Stack>`
		),
		// Every built-in.
		'<Card href="javascript:alert(1)" title="t">x</Card>',
		'<Card HREF="javascript:alert(1)" title="t">x</Card>',
		'<Card as="a" Href="https://evil.example" title="t">x</Card>',
		'<Stat as="a" HREF="javascript:alert(1)" label="l" value="v" />',
		'<Grid as="iframe" SRC="javascript:alert(1)">x</Grid>',
		'<GridSpan as="a" HREF="javascript:alert(1)">x</GridSpan>'
	])('%s draws nothing active', async (content) => {
		expectInert(await draw(content));
		expect(win[PWNED]).toBeUndefined();
	});

	test.each([
		'<Stack ONCLICK="window.__markdownPwned=1">x</Stack>',
		'<Stack onClick="window.__markdownPwned=1">x</Stack>',
		'<Stack OnMouseOver="window.__markdownPwned=1">x</Stack>',
		'<Card ONCLICK="window.__markdownPwned=1" title="t">x</Card>',
		'<Stat ONCLICK="window.__markdownPwned=1" label="l" value="v" />'
	])('%s runs nothing when pressed', async (content) => {
		const root = await draw(content);
		expectInert(root);
		for (const element of root.querySelectorAll<HTMLElement>('*')) element.click();
		expect(win[PWNED]).toBeUndefined();
	});

	test.each([
		'style',
		'STYLE',
		'Style',
		'class',
		'CLASS',
		'id',
		'ID',
		'name',
		'NAME',
		'slot',
		'tabindex',
		'contenteditable',
		'autofocus',
		'popover',
		'draggable',
		'form',
		'data-dnd-handle'
	])('%s is not set from the text', async (attribute) => {
		const root = await draw(`<Stack ${attribute}="position:fixed;inset:0">x</Stack>`);
		expect(root.innerHTML).not.toContain('position:fixed');
		const lower = attribute.toLowerCase();
		for (const element of root.querySelectorAll('*')) {
			if (lower === 'class' || lower === 'style') {
				expect(element.getAttribute(lower) ?? '').not.toContain('position:fixed');
			} else {
				expect(element.hasAttribute(lower), `${element.tagName} ${lower}`).toBe(false);
			}
		}
	});
});

describe('the rest of the text', () => {
	test.each([
		'[x](javascript:alert(1))',
		'[x](JaVaScRiPt:alert(1))',
		'[x](java&#115;cript:alert(1))',
		'[x](data:text/html,x)',
		'[x](vbscript:msgbox(1))',
		'![x](javascript:alert(1))',
		'![x](data:image/svg+xml,x)'
	])('%s is not a link or an image', async (content) => {
		expectInert(await draw(content));
	});

	test.each([
		'<a href="javascript:alert(1)">x</a>',
		'<A HREF="javascript:alert(1)">x</A>',
		'<iframe src="https://evil.example"></iframe>',
		'<IFRAME SRC="https://evil.example"></IFRAME>',
		'<script>window.__markdownPwned=1</script>',
		'<img src=x onerror="window.__markdownPwned=1">',
		'<svg onload="window.__markdownPwned=1"></svg>',
		'<Iframe src="https://evil.example">x</Iframe>',
		'<Script>window.__markdownPwned=1</Script>'
	])('%s makes no element', async (content) => {
		expectInert(await draw(content));
		expect(win[PWNED]).toBeUndefined();
	});
});

describe('in a model message', () => {
	test('AIMessage inherits the same filter', async () => {
		const screen = await render(AIMessageSecurityHarness, {
			props: {
				content: [
					'<Stack as="a" HREF="javascript:alert(1)">one</Stack>',
					'<Stack as="iframe" src="https://evil.example">two</Stack>',
					'<Stack ONCLICK="window.__markdownPwned=1">three</Stack>',
					'[four](//evil.example)'
				].join('\n\n')
			}
		});
		await new Promise((resolve) => setTimeout(resolve));
		const root = screen.container as HTMLElement;
		expect(root.querySelector('iframe')).toBeNull();
		expect(root.querySelector('[href^="javascript" i], [HREF^="javascript" i]')).toBeNull();
		expect(root.textContent).toContain('three');
		for (const element of root.querySelectorAll<HTMLElement>('[onclick]')) {
			expect(element).toBeNull();
		}
	});
});

describe('what the built-ins document still works', () => {
	test('a layout keeps its own props and a passive element', async () => {
		const root = await draw(
			'<Stack as="section" orientation="horizontal" gap="md" align="center">x</Stack>'
		);
		const stack = root.querySelector('section');
		expect(stack).not.toBeNull();
		expect(stack?.textContent).toContain('x');
	});

	test('a Card, a Stat and a Grid draw what they were given', async () => {
		const root = await draw(
			[
				'<Grid columns={2} gap="lg">',
				'<GridSpan columns="full">',
				'<Card title="Release" description="Candidate" variant="outline">',
				'<Stack gap="md">Everything is **ready**.</Stack>',
				'</Card>',
				'</GridSpan>',
				'<Stat label="Coverage" value="94%" trend="+3.2%" trendDirection="up" color="success" variant="soft" />',
				'</Grid>'
			].join('\n')
		);
		const text = root.textContent ?? '';
		for (const part of ['Release', 'Candidate', 'ready', 'Coverage', '94%', '+3.2%']) {
			expect(text).toContain(part);
		}
		expect(root.querySelector('strong')?.textContent).toBe('ready');
	});

	test('an ordinary link still is one', async () => {
		const root = await draw('[x](https://example.com/a)');
		expect(root.querySelector('a')?.getAttribute('href')).toBe('https://example.com/a');
	});

	test('an unknown tag draws its children', async () => {
		const root = await draw('<Unknown HREF="javascript:alert(1)">kept</Unknown>');
		expect(root.textContent).toContain('kept');
		expectInert(root);
	});
});
