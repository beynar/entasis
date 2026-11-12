// RichTextInput on edytor, in real browsers (Chromium and WebKit): markdown typed, pasted and
// loaded reads as the formats the input allows and publishes back as the same markdown; the
// toolbars format the selection; the handle edits at the caret; read-only and disabled inputs hold.
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame } from '$lib/testing/browser.test-helper.js';
import { AI_COMPOSER_ALL_RICH_TEXT_FORMATS } from './composer/selection-formatting.js';
import Harness from './RichTextInputBrowserHarness.test.svelte';

type Props = NonNullable<Parameters<typeof Harness>[1]>;
const mount = (props: Props = {}) => render(Harness, { props: { toolbar: 'none', ...props } });
const editor = () => document.querySelector<HTMLElement>('[data-rich-text-input-editor]')!;
const value = () => document.querySelector('[data-testid="value"]')!.textContent;
const button = (name: string | RegExp) => page.getByRole('button', { name });
const all = AI_COMPOSER_ALL_RICH_TEXT_FORMATS;

async function typeAtEnd(text = '') {
	await userEvent.click(button('Focus'));
	await expect.poll(() => editor().contains(document.activeElement)).toBe(true);
	if (text) await userEvent.keyboard(text);
}

/** Select `count` characters after the first `skip` of the first line, in document order. */
async function selectInFirstLine(skip: number, count: number) {
	await userEvent.click(button('Focus'));
	await userEvent.keyboard('{ControlOrMeta>}{ArrowUp}{/ControlOrMeta}{Home}');
	for (let index = 0; index < skip; index++) await userEvent.keyboard('{ArrowRight}');
	for (let index = 0; index < count; index++)
		await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
	await nextFrame();
}

function paste(data: Record<string, string>) {
	const transfer = new DataTransfer();
	for (const [type, text] of Object.entries(data)) transfer.setData(type, text);
	editor().dispatchEvent(
		new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true })
	);
}

describe('markdown typed', () => {
	test('shortcuts format what the input allows, and publish as markdown', async () => {
		mount({ formats: all });
		await typeAtEnd('# Title{Enter}');
		// `[[` types a `[` (a single one opens a key name).
		await userEvent.keyboard('**b** *i* `c` ~~s~~ ==h== [[l](https://x.y) end{Enter}');
		await userEvent.keyboard('- item{Enter}');
		await userEvent.keyboard('{Enter}1. first{Enter}');
		await userEvent.keyboard('{Enter}> quoted');
		await expect
			.poll(value)
			.toBe('# Title\n**b** *i* `c` ~~s~~ ==h== [l](https://x.y) end\n- item\n1. first\n> quoted');
		expect(editor().querySelector('h1')?.textContent).toBe('Title');
		expect(editor().querySelector('strong')?.textContent).toBe('b');
		expect(editor().querySelector('a')?.getAttribute('href')).toBe('https://x.y');
	});

	test('the syntax of a format the input does not allow stays as typed', async () => {
		mount({ formats: ['bold'] });
		await typeAtEnd('# not a heading{Enter}');
		await userEvent.keyboard('*soft* `code` **strong**');
		await expect.poll(value).toBe('# not a heading\n*soft* `code` **strong**');
		expect(editor().querySelector('h1')).toBeNull();
		expect(editor().querySelector('em')).toBeNull();
		expect(editor().querySelector('code')).toBeNull();
		expect(editor().querySelector('strong')?.textContent).toBe('strong');
	});

	test('a shortcut the input does not allow does nothing (Mod+B without bold)', async () => {
		mount({ formats: ['italic'], value: 'a word here' });
		await selectInFirstLine(2, 4);
		await userEvent.keyboard('{ControlOrMeta>}b{/ControlOrMeta}');
		await nextFrame();
		expect(editor().querySelector('strong')).toBeNull();
		expect(value()).toBe('a word here');
	});

	test('undo gives the typed markers back', async () => {
		mount({ formats: all });
		await typeAtEnd('**b**');
		await expect.poll(() => editor().querySelector('strong')?.textContent).toBe('b');
		await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
		await expect.poll(() => editor().querySelector('strong')).toBeNull();
		expect(editor().textContent).toBe('**b**');
	});
});

describe('value', () => {
	test('a parent value loads silently, and a typed edit publishes markdown and tokens', async () => {
		const onValueChange = vi.fn();
		mount({
			formats: all,
			value: 'Hello **world**',
			next: '- one\n- two <File id="f1" label="brief.md" />',
			onValueChange
		});
		expect(editor().querySelector('strong')?.textContent).toBe('world');
		await userEvent.click(button('Set value'));
		await expect.poll(() => editor().querySelectorAll('li').length).toBe(2);
		expect(editor().querySelector('[data-ai-token="file"]')?.textContent).toBe('brief.md');
		expect(onValueChange).not.toHaveBeenCalled();

		await typeAtEnd('!');
		await expect.poll(() => onValueChange.mock.calls.length).toBe(1);
		expect(onValueChange.mock.calls[0][0]).toEqual({
			markdown: '- one\n- two <File id="f1" label="brief.md" />!',
			tokens: [
				{
					kind: 'file',
					id: 'f1',
					label: 'brief.md',
					markdown: '<File id="f1" label="brief.md" />'
				}
			],
			isEmpty: false
		});
	});

	test('clear publishes an empty value once and shows the placeholder', async () => {
		const onValueChange = vi.fn();
		mount({ value: 'Draft', onValueChange, placeholder: 'Write here' });
		await userEvent.click(button('Clear'));
		await expect.poll(() => onValueChange.mock.calls.length).toBe(1);
		expect(onValueChange.mock.calls[0][0]).toEqual({ markdown: '', tokens: [], isEmpty: true });
		expect(
			document.querySelector('[data-slot="rich-text-input-placeholder"]')?.textContent
		).toContain('Write here');
		await userEvent.click(button('Clear'));
		await nextFrame();
		expect(onValueChange).toHaveBeenCalledOnce();
	});

	test('focus() puts the caret at the end of a loaded value', async () => {
		mount({ value: 'start', next: 'Filled from a suggestion' });
		await userEvent.click(button('Set value'));
		await userEvent.click(button('Focus'));
		await expect.poll(() => editor().contains(document.activeElement)).toBe(true);
		await userEvent.keyboard('!');
		await expect.poll(value).toBe('Filled from a suggestion!');
	});

	test('insertText and insertToken write at the end when the input was never focused', async () => {
		mount({ value: 'Draft' });
		await userEvent.click(button('Insert token'));
		// The token's trailing space is in the document; the published markdown is trimmed at its end.
		await expect.poll(value).toBe('Draft<File id="f1" label="brief.md" path="docs/brief.md" />');
		await userEvent.click(button('Insert text'));
		await expect
			.poll(value)
			.toBe('Draft<File id="f1" label="brief.md" path="docs/brief.md" /> inserted');
	});
});

describe('toolbars', () => {
	test('the fixed toolbar bolds the selected text', async () => {
		mount({ toolbar: 'fixed', value: 'hello world again' });
		await selectInFirstLine(6, 5);
		await userEvent.click(button(/^Bold/));
		await expect.poll(value).toBe('hello **world** again');
	});

	test('the fixed toolbar links the selected text', async () => {
		mount({ toolbar: 'fixed', value: 'hello world again' });
		await selectInFirstLine(6, 5);
		await userEvent.click(button(/^Link/));
		const field = page.getByRole('textbox', { name: /link/i });
		await expect.element(field).toBeVisible();
		await userEvent.fill(field, 'https://example.com');
		await userEvent.keyboard('{Enter}');
		await expect.poll(value).toBe('hello [world](https://example.com) again');
	});

	test('the fixed toolbar turns the caret line into a heading, back, and into a list', async () => {
		mount({ toolbar: 'fixed', formats: all, value: 'hello' });
		await typeAtEnd();
		await nextFrame();
		await userEvent.click(page.getByRole('radio', { name: 'Heading 2' }));
		await expect.poll(value).toBe('## hello');
		await userEvent.click(page.getByRole('radio', { name: 'Paragraph' }));
		await expect.poll(value).toBe('hello');
		await userEvent.click(button(/^Unordered list/));
		await expect.poll(value).toBe('- hello');
	});
});

describe('paste', () => {
	test('pasted markdown reads as the input formats', async () => {
		mount({ formats: all, value: 'Start: ' });
		await typeAtEnd();
		paste({ 'text/plain': '**bold** and <Mention id="ada" label="Ada" />' });
		await expect.poll(value).toBe('Start: **bold** and <Mention id="ada" label="Ada" />');
		expect(editor().querySelector('[data-ai-token="mention"]')?.textContent).toBe('Ada');
	});

	test('several pasted lines become blocks', async () => {
		mount({ formats: all, value: 'Intro' });
		await typeAtEnd('{Enter}');
		paste({ 'text/plain': '- one\n- two' });
		await expect.poll(value).toBe('Intro\n- one\n- two');
	});

	test('a URL pasted over selected text links it', async () => {
		mount({ value: 'see docs here' });
		await selectInFirstLine(4, 4);
		paste({ 'text/plain': 'https://example.com/docs' });
		await expect.poll(value).toBe('see [docs](https://example.com/docs) here');
	});
});

describe('states', () => {
	test('a disabled input is neither editable nor focusable', async () => {
		mount({ value: 'locked', disabled: true });
		const root = editor();
		expect(root.getAttribute('contenteditable')).toBe('false');
		expect(root.getAttribute('aria-disabled')).toBe('true');
		expect(root.hasAttribute('tabindex')).toBe(false);
	});

	test('a read-only input is focusable and announced, and typing changes nothing', async () => {
		mount({ value: 'kept', readOnly: true });
		const root = editor();
		expect(root.getAttribute('aria-readonly')).toBe('true');
		expect(root.getAttribute('tabindex')).toBe('0');
		root.focus();
		await userEvent.keyboard('typed');
		await nextFrame();
		expect(value()).toBe('kept');
		expect(root.textContent).toBe('kept');
	});
});

describe('whole-block selection', () => {
	test('a block selected by repeated select-all is drawn, once per selection', async () => {
		mount({ value: 'First paragraph\n\nSecond paragraph' });
		await typeAtEnd();
		await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
		await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
		await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
		await expect
			.poll(() => editor().querySelectorAll('[data-edytor-selected]').length)
			.toBeGreaterThan(0);

		const surface = getComputedStyle(editor()).backgroundColor;
		for (const block of editor().querySelectorAll<HTMLElement>('[data-edytor-selected]')) {
			const background = getComputedStyle(block).backgroundColor;
			const nested = block.parentElement?.closest('[data-edytor-selected]');
			if (nested) expect(background).toBe('rgba(0, 0, 0, 0)');
			else {
				expect(background).not.toBe('rgba(0, 0, 0, 0)');
				expect(background).not.toBe(surface);
			}
		}
	});
});

describe('the toolbar over a selection', () => {
	const hoverFormats = [
		'heading2',
		'heading3',
		'bold',
		'italic',
		'strikethrough',
		'link',
		'bulletList',
		'orderedList',
		'quote'
	] as const;

	test('its buttons act on the selected text, as the fixed toolbar does', async () => {
		mount({ toolbar: 'hover', formats: [...hoverFormats], value: 'Bonjour le monde' });
		await selectInFirstLine(11, 5);
		const strike = page.getByRole('button', { name: /^Strikethrough/ });
		await expect.element(strike).toBeVisible();
		await userEvent.click(strike);
		await expect.poll(value).toBe('Bonjour le ~~monde~~');
		await expect.element(strike).toHaveAttribute('aria-pressed', 'true');
	});

	test('a press on a block or list control turns the selected line', async () => {
		mount({ toolbar: 'hover', formats: [...hoverFormats], value: 'Bonjour le monde' });
		await selectInFirstLine(11, 5);
		await userEvent.click(page.getByRole('button', { name: /^Unordered list/ }));
		await expect.poll(value).toBe('- Bonjour le monde');
	});

	test('over the first word of a line it stays within the input', async () => {
		mount({
			toolbar: 'hover',
			formats: [...hoverFormats],
			value: 'Bonjour le monde, une ligne assez longue pour la barre',
			wrapperStyle: 'margin-left: 240px; width: 520px'
		});
		await selectInFirstLine(0, 7);
		const toolbar = page.getByRole('toolbar', { name: /formatting/i });
		await expect.element(toolbar).toBeVisible();
		await nextFrame();
		const input = document
			.querySelector('[data-slot="rich-text-input-root"]')!
			.getBoundingClientRect();
		await expect
			.poll(() => (toolbar.element() as HTMLElement).getBoundingClientRect().left)
			.toBeGreaterThanOrEqual(Math.floor(input.left));
		expect((toolbar.element() as HTMLElement).getBoundingClientRect().right).toBeLessThanOrEqual(
			Math.ceil(input.right)
		);
	});
});
