// The markdown a RichTextInput reads and writes: what Lexical produced, kept through the move to
// edytor. A value round-trips unchanged, a disallowed format stays as typed, tokens are atoms.
import { describe, expect, test } from 'vitest';
import type { RichTextInputFormat } from '../richTextInput.props.js';
import { AI_COMPOSER_ALL_RICH_TEXT_FORMATS } from './selection-formatting.js';
import {
	docToMarkdown,
	formatAIComposerTokenMarkdown,
	isDocEmpty,
	markdownToDoc,
	readDocTokens,
	TOKEN_TYPE
} from './markdown.js';

const all = AI_COMPOSER_ALL_RICH_TEXT_FORMATS;
const roundTrip = (markdown: string, formats: readonly RichTextInputFormat[] = all) =>
	docToMarkdown(markdownToDoc(markdown, formats));

describe('round trip', () => {
	test.each([
		'Plain text',
		'Hello **bold** and *italic* and `code` and ~~strike~~ and ==highlight== and [link](https://a.b)',
		'***bold italic***',
		'# H1\n## H2\n### H3',
		'> a quote\n> on two lines',
		'- a\n- b\n    - nested\n- c',
		'1. one\n2. two\n3. three',
		'line one\nline two',
		'para one\n\npara two',
		'2 * 3 = 6 and a < b and snake_case_name',
		'**bold *and italic* inside**',
		'[**bold link**](https://example.com)',
		'Ask <Command id="summarize" label="Summarize" /> about <File id="f1" label="brief.md" path="docs/brief.md" /> please'
	])('%s', (markdown) => {
		expect(roundTrip(markdown)).toBe(markdown);
	});

	test('an empty value is an empty document', () => {
		expect(markdownToDoc('').children).toEqual([]);
		expect(docToMarkdown(markdownToDoc(''))).toBe('');
		expect(isDocEmpty(markdownToDoc(''))).toBe(true);
	});

	test('a trailing newline is not an extra line', () => {
		expect(roundTrip('one\n')).toBe('one');
	});
});

describe('formats', () => {
	test('the syntax of a format the input does not allow stays as typed', () => {
		const formats: RichTextInputFormat[] = ['bold'];
		expect(roundTrip('# Title\n*soft* **strong** `code`\n- item', formats)).toBe(
			'# Title\n*soft* **strong** `code`\n- item'
		);
		const doc = markdownToDoc('# Title\n**strong**', formats);
		expect(doc.children.map((block) => block.type)).toEqual(['paragraph', 'paragraph']);
		expect(doc.children[1].content).toEqual([{ text: 'strong', marks: { bold: true } }]);
	});

	test('reads marks and blocks into the editor kinds', () => {
		const doc = markdownToDoc('## Hi **there**\n- [x](https://x.y)', all);
		expect(doc.children[0]).toMatchObject({ type: 'heading', data: { level: 'h2' } });
		expect(doc.children[0].content).toEqual([
			{ text: 'Hi ' },
			{ text: 'there', marks: { bold: true } }
		]);
		expect(doc.children[1]).toMatchObject({
			type: 'bulleted-list-item',
			content: [{ text: 'x', marks: { link: { href: 'https://x.y' } } }]
		});
	});
});

describe('tokens', () => {
	test('a token tag is an atom with its data, and writes back as the same tag', () => {
		const markdown = 'See <Reference id="r1" label="Launch brief" path="docs/brief.md" />';
		const doc = markdownToDoc(markdown);
		const atom = doc.children[0].content![1];
		expect(atom).toMatchObject({ type: TOKEN_TYPE, data: { kind: 'reference', id: 'r1' } });
		expect(readDocTokens(doc)).toEqual([
			{
				kind: 'reference',
				id: 'r1',
				label: 'Launch brief',
				path: 'docs/brief.md',
				markdown: '<Reference id="r1" label="Launch brief" path="docs/brief.md" />'
			}
		]);
		expect(docToMarkdown(doc)).toBe(markdown);
	});

	test('a token inserted from a suggestion writes its tag', () => {
		expect(
			formatAIComposerTokenMarkdown({ kind: 'mention', id: 'ada', label: 'Ada "A" Lovelace' })
		).toBe(`<Mention id="ada" label="Ada 'A' Lovelace" />`);
	});

	test('a document with only a token is not empty', () => {
		expect(isDocEmpty(markdownToDoc('<Skill id="s" label="Plan" />'))).toBe(false);
	});
});

describe('document to markdown', () => {
	test('spaces at a marked run edge go outside its markers', () => {
		expect(
			docToMarkdown({
				children: [
					{
						type: 'paragraph',
						content: [{ text: 'bold ', marks: { bold: true } }, { text: 'plain' }]
					}
				]
			})
		).toBe('**bold** plain');
	});

	test('a soft line break inside a paragraph stays a newline', () => {
		expect(
			docToMarkdown({ children: [{ type: 'paragraph', content: [{ text: 'one\ntwo' }] }] })
		).toBe('one\ntwo');
	});

	test('a kind the input does not write reads as its text', () => {
		expect(docToMarkdown({ children: [{ type: 'todo-item', content: [{ text: 'task' }] }] })).toBe(
			'task'
		);
	});
});
