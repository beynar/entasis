// Markdown <-> edytor document, for the formats a RichTextInput allows. The editor stores a
// `JSONDoc`; the component's value is markdown. Both directions are written here, not taken from
// `edytor/export`, so the markdown stays what a prompt needs: one block per line, newlines kept,
// nothing escaped, tokens as `<File id label path />` tags, `==highlight==`, and the syntax of a
// format the input does not allow left as typed.
import type { JSONBlock, JSONDoc, JSONInlineBlock, JSONText } from 'edytor';
import type { RichTextInputFormat, RichTextInputTokenKind } from '../richTextInput.props.js';

export type AIComposerTokenKind = RichTextInputTokenKind;

export type AIComposerTokenData = {
	kind: AIComposerTokenKind;
	id: string;
	label: string;
	path?: string;
	markdown?: string;
	promptText?: string;
};

/** The inline atom a token is in the editor's document. */
export const TOKEN_TYPE = 'ai-token';

export type Marks = NonNullable<JSONText['marks']>;
type Content = JSONText | JSONInlineBlock;

const TOKEN_RE = /^<(File|Reference|Mention|Skill|Command)\s+([^>]*?)\s*\/>/;
const ATTR_RE = /(\w+)="([^"]*)"/g;
const TAGS: Record<AIComposerTokenKind, string> = {
	file: 'File',
	reference: 'Reference',
	mention: 'Mention',
	skill: 'Skill',
	command: 'Command'
};

function tokenKindFromTag(tag: string): AIComposerTokenKind {
	const entry = Object.entries(TAGS).find(([, name]) => name === tag);
	return (entry?.[0] as AIComposerTokenKind | undefined) ?? 'file';
}

function cleanAttributeValue(value: string) {
	return value
		.replace(/"/g, "'")
		.replace(/[<>\n\r\t]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function attribute(name: string, value: string | undefined) {
	if (!value) return '';
	return ` ${name}="${cleanAttributeValue(value)}"`;
}

const hasPath = (kind: AIComposerTokenKind) => kind === 'file' || kind === 'reference';

export function formatAIComposerTokenMarkdown(data: AIComposerTokenData) {
	if (data.markdown) return data.markdown;
	return `<${TAGS[data.kind]}${attribute('id', data.id)}${attribute('label', data.label)}${attribute(
		'path',
		hasPath(data.kind) ? data.path : undefined
	)} />`;
}

/** A token tag at the start of `input`, with the length it takes. */
export function readTokenTag(input: string): { data: AIComposerTokenData; length: number } | null {
	const match = TOKEN_RE.exec(input);
	if (!match) return null;
	const attributes: Record<string, string> = {};
	for (const [, name, value] of match[2].matchAll(ATTR_RE)) attributes[name] = value;
	if (!attributes.id || !attributes.label) return null;
	const kind = tokenKindFromTag(match[1]);
	return {
		data: {
			kind,
			id: attributes.id,
			label: attributes.label,
			path: hasPath(kind) ? attributes.path : undefined,
			markdown: match[0]
		},
		length: match[0].length
	};
}

export function tokenAtom(data: AIComposerTokenData): JSONInlineBlock {
	const clean = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
	return { type: TOKEN_TYPE, data: clean };
}

export const isTokenAtom = (part: Content): part is JSONInlineBlock =>
	'type' in part && part.type === TOKEN_TYPE;

const allows = (formats: readonly RichTextInputFormat[] | undefined, format: RichTextInputFormat) =>
	!formats || formats.includes(format);

// --- Markdown to document -------------------------------------------------------------------

type InlineDelimiter = { open: string; marks: Marks; format: RichTextInputFormat[] };

const DELIMITERS: InlineDelimiter[] = [
	{ open: '***', marks: { bold: true, italic: true }, format: ['bold', 'italic'] },
	{ open: '___', marks: { bold: true, italic: true }, format: ['bold', 'italic'] },
	{ open: '**', marks: { bold: true }, format: ['bold'] },
	{ open: '__', marks: { bold: true }, format: ['bold'] },
	{ open: '==', marks: { highlight: true }, format: ['highlight'] },
	{ open: '~~', marks: { strike: true }, format: ['strikethrough'] },
	{ open: '*', marks: { italic: true }, format: ['italic'] },
	{ open: '_', marks: { italic: true }, format: ['italic'] }
];

const LINK_RE = /^\[([^\]\n]+)\]\(([^)\s]+)\)/;
const isWordCharacter = (character: string | undefined) => !!character && /\w/.test(character);

/** Where `open` closes after `from`: non-empty content, not padded with spaces. */
function findClosing(text: string, from: number, open: string) {
	let at = text.indexOf(open, from);
	while (at !== -1) {
		const content = text.slice(from, at);
		const next = text[at + open.length];
		const longer = open.length === 1 && next === open;
		if (content.length > 0 && content.trim() === content && !longer) {
			// An underscore closes only at a word's end (`snake_case_name` stays text).
			if (open[0] !== '_' || !isWordCharacter(next)) return at;
		}
		at = text.indexOf(open, at + (longer ? 2 : 1));
	}
	return -1;
}

function pushText(parts: Content[], text: string, marks: Marks) {
	if (!text) return;
	const last = parts[parts.length - 1];
	if (last && !isTokenAtom(last) && sameMarks((last as JSONText).marks ?? {}, marks)) {
		(last as JSONText).text += text;
		return;
	}
	parts.push(Object.keys(marks).length > 0 ? { text, marks: { ...marks } } : { text });
}

/** Inline markdown as content: text runs with their marks, and token atoms. */
export function parseInline(
	text: string,
	marks: Marks,
	formats: readonly RichTextInputFormat[] | undefined,
	parts: Content[] = []
): Content[] {
	let literal = '';
	const flush = () => {
		pushText(parts, literal, marks);
		literal = '';
	};
	let index = 0;
	while (index < text.length) {
		const rest = text.slice(index);
		const character = text[index];

		if (character === '<') {
			const token = readTokenTag(rest);
			if (token) {
				flush();
				parts.push(tokenAtom(token.data));
				index += token.length;
				continue;
			}
		}

		if (character === '`' && !marks.code && allows(formats, 'code')) {
			const closing = text.indexOf('`', index + 1);
			if (closing > index + 1) {
				flush();
				pushText(parts, text.slice(index + 1, closing), { ...marks, code: true });
				index = closing + 1;
				continue;
			}
		}

		if (character === '[' && !marks.link && allows(formats, 'link')) {
			const link = LINK_RE.exec(rest);
			if (link) {
				flush();
				parseInline(link[1], { ...marks, link: { href: link[2] } }, formats, parts);
				index += link[0].length;
				continue;
			}
		}

		const delimiter = DELIMITERS.find(
			(candidate) =>
				rest.startsWith(candidate.open) &&
				candidate.format.every((format) => allows(formats, format)) &&
				Object.keys(candidate.marks).every((mark) => !marks[mark]) &&
				// An underscore opens only at a word's start.
				(candidate.open[0] !== '_' || !isWordCharacter(text[index - 1]))
		);
		if (delimiter) {
			const from = index + delimiter.open.length;
			const closing = findClosing(text, from, delimiter.open);
			if (closing !== -1) {
				flush();
				parseInline(text.slice(from, closing), { ...marks, ...delimiter.marks }, formats, parts);
				index = closing + delimiter.open.length;
				continue;
			}
		}

		literal += character;
		index += 1;
	}
	flush();
	return parts;
}

const HEADING_RE = /^(#{1,3}) (.*)$/;
const QUOTE_RE = /^> ?(.*)$/;
const BULLET_RE = /^(\s*)[-*+] (.*)$/;
const NUMBER_RE = /^(\s*)\d+[.)] (.*)$/;

const block = (type: string, content: Content[], data?: JSONBlock['data']): JSONBlock =>
	data ? { type, data, content } : { type, content };

/** Markdown as the editor's document: one block per line, the allowed formats read. */
export function markdownToDoc(markdown: string, formats?: readonly RichTextInputFormat[]): JSONDoc {
	const children: JSONBlock[] = [];
	// The open list items by depth, so an indented line nests under the one before it.
	let listStack: JSONBlock[] = [];
	const inline = (text: string) => parseInline(text, {}, formats);

	for (const line of markdown.replace(/\r\n?/g, '\n').split('\n')) {
		const heading = HEADING_RE.exec(line);
		if (heading && allows(formats, `heading${heading[1].length}` as RichTextInputFormat)) {
			listStack = [];
			children.push(block('heading', inline(heading[2]), { level: `h${heading[1].length}` }));
			continue;
		}

		const quote = QUOTE_RE.exec(line);
		if (quote && allows(formats, 'quote')) {
			listStack = [];
			const previous = children[children.length - 1];
			if (previous?.type === 'quote') {
				pushText(previous.content!, '\n', {});
				previous.content!.push(...inline(quote[1]));
			} else {
				children.push(block('quote', inline(quote[1])));
			}
			continue;
		}

		const bullet = BULLET_RE.exec(line);
		const numbered = bullet ? null : NUMBER_RE.exec(line);
		const list = bullet
			? { match: bullet, type: 'bulleted-list-item', format: 'bulletList' as const }
			: numbered
				? { match: numbered, type: 'numbered-list-item', format: 'orderedList' as const }
				: null;
		if (list && allows(formats, list.format)) {
			const indent = list.match[1].replace(/\t/g, '    ').length;
			const depth = Math.min(Math.floor(indent / 2), listStack.length);
			const item = block(list.type, inline(list.match[2]));
			const parent = depth > 0 ? listStack[depth - 1] : null;
			if (parent) (parent.children ??= []).push(item);
			else children.push(item);
			listStack = [...listStack.slice(0, depth), item];
			continue;
		}

		listStack = [];
		children.push(block('paragraph', inline(line)));
	}

	// A trailing newline is no extra empty line (markdown files end with one).
	const last = children[children.length - 1];
	if (children.length > 1 && last.type === 'paragraph' && last.content!.length === 0) {
		children.pop();
	}
	if (children.length === 1 && children[0].type === 'paragraph' && !children[0].content!.length) {
		return { children: [] };
	}
	return { children };
}

// --- Document to markdown -------------------------------------------------------------------

const MARK_ORDER = ['link', 'bold', 'italic', 'strike', 'highlight', 'code'] as const;
type MarkName = (typeof MARK_ORDER)[number];
const MARKERS: Record<Exclude<MarkName, 'link'>, string> = {
	bold: '**',
	italic: '*',
	strike: '~~',
	highlight: '==',
	code: '`'
};

const markKey = (name: MarkName, marks: Marks) => {
	const value = marks[name];
	if (value === undefined || value === null || value === false) return null;
	return name === 'link' ? `link:${(value as { href?: string }).href ?? ''}` : name;
};

function sameMarks(a: Marks, b: Marks) {
	return MARK_ORDER.every((name) => markKey(name, a) === markKey(name, b));
}

type Segment = { text: string; marks: Marks; atom?: JSONInlineBlock };

function inlineToMarkdown(content: readonly Content[] | undefined) {
	let output = '';
	let pendingSpace = '';
	const open: { key: string; name: MarkName; href?: string }[] = [];

	const close = (count: number) => {
		for (let index = 0; index < count; index++) {
			const mark = open.pop()!;
			output += mark.name === 'link' ? `](${mark.href ?? ''})` : MARKERS[mark.name];
		}
	};

	const write = (segment: Segment) => {
		const wanted = MARK_ORDER.map((name) => ({ name, key: markKey(name, segment.marks) })).filter(
			(mark): mark is { name: MarkName; key: string } => mark.key !== null
		);
		const wantedKeys = new Set(wanted.map((mark) => mark.key));
		// Close from the innermost mark down to the first one this segment does not keep.
		const keep = open.findIndex((mark) => !wantedKeys.has(mark.key));
		if (keep !== -1) close(open.length - keep);
		output += pendingSpace;
		pendingSpace = '';
		for (const mark of wanted) {
			if (open.some((current) => current.key === mark.key)) continue;
			const href =
				mark.name === 'link' ? (segment.marks.link as { href?: string }).href : undefined;
			open.push({ key: mark.key, name: mark.name, href });
			output += mark.name === 'link' ? '[' : MARKERS[mark.name];
		}
		output += segment.atom
			? formatAIComposerTokenMarkdown(segment.atom.data as AIComposerTokenData)
			: segment.text;
	};

	for (const part of content ?? []) {
		if ('type' in part) {
			if (isTokenAtom(part)) write({ text: '', marks: {}, atom: part });
			continue;
		}
		const marks = part.marks ?? {};
		if (Object.keys(marks).length === 0 || marks.code) {
			write({ text: part.text, marks });
			continue;
		}
		// Spaces at a marked run's edges sit outside its markers (`**bold** `, never `**bold **`).
		const [, leading, core, trailing] = /^(\s*)([\s\S]*?)(\s*)$/.exec(part.text)!;
		if (!core) {
			pendingSpace += part.text;
			continue;
		}
		pendingSpace += leading;
		write({ text: core, marks });
		pendingSpace += trailing;
	}
	close(open.length);
	return output + pendingSpace;
}

function blockToLines(block: JSONBlock, depth: number, number: number): string[] {
	const text = inlineToMarkdown(block.content);
	const indent = '    '.repeat(depth);
	const nested = listItemsToLines(block.children ?? [], depth + 1);
	switch (block.type) {
		case 'heading': {
			const level = Number(String(block.data?.level ?? 'h1').slice(1)) || 1;
			return [`${'#'.repeat(level)} ${text}`, ...nested];
		}
		case 'quote':
			return [...text.split('\n').map((line) => `> ${line}`), ...nested];
		case 'bulleted-list-item':
			return [`${indent}- ${text}`, ...nested];
		case 'numbered-list-item':
			return [`${indent}${number}. ${text}`, ...nested];
		default:
			return [depth > 0 ? `${indent}${text}` : text, ...nested];
	}
}

function listItemsToLines(blocks: readonly JSONBlock[], depth: number) {
	const lines: string[] = [];
	let number = 0;
	for (const child of blocks) {
		number = child.type === 'numbered-list-item' ? number + 1 : 0;
		lines.push(...blockToLines(child, depth, number));
	}
	return lines;
}

/** The editor's document as markdown: blocks one per line, as the input reads them back. */
export function docToMarkdown(doc: JSONDoc | null | undefined): string {
	return listItemsToLines(doc?.children ?? [], 0)
		.join('\n')
		.trimEnd();
}

// --- Reads ----------------------------------------------------------------------------------

function* contentParts(blocks: readonly JSONBlock[]): Generator<Content> {
	for (const block of blocks) {
		yield* block.content ?? [];
		yield* contentParts(block.children ?? []);
	}
}

/** The tokens a document holds, in order. */
export function readDocTokens(doc: JSONDoc | null | undefined): AIComposerTokenData[] {
	const tokens: AIComposerTokenData[] = [];
	for (const part of contentParts(doc?.children ?? [])) {
		if (isTokenAtom(part)) tokens.push(part.data as AIComposerTokenData);
	}
	return tokens;
}

/** No text and no token: no block, or one paragraph holding only spaces. */
export function isDocEmpty(doc: JSONDoc | null | undefined) {
	const blocks = doc?.children ?? [];
	if (blocks.length === 0) return true;
	if (blocks.length > 1) return false;
	const [only] = blocks;
	if (only.type !== 'paragraph' || (only.children?.length ?? 0) > 0) return false;
	return (only.content ?? []).every((part) => !('type' in part) && part.text.trim() === '');
}
