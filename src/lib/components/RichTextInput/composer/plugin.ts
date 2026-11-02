// The RichTextInput's own edytor plugin, listed before rich text so its keys win: the suggestion
// menu's keys and the submit shortcut, the formats the input allows (shortcuts, native format
// commands, markdown typed or pasted), and the token atom.
import {
	withRulesAndTriggers,
	type EdytorInstance as Edytor,
	type InputRule,
	type InputRuleContext,
	type JSONDoc,
	type Plugin
} from 'edytor';
import type { RichTextInputFormat, RichTextInputSubmitShortcut } from '../richTextInput.props.js';
import {
	formatAIComposerTokenMarkdown,
	parseInline,
	readTokenTag,
	TOKEN_TYPE,
	tokenAtom,
	type AIComposerTokenData,
	type Marks
} from './markdown.js';
import { tokenAtom as tokenAtomSnippet } from './TokenAtom.svelte';

export type AIComposerSuggestionHandle = {
	moveHighlight: (delta: number) => void;
	selectHighlighted: () => boolean;
};

export type RichTextInputPluginOptions = {
	getFormats: () => readonly RichTextInputFormat[];
	getMenuOpen: () => boolean;
	getSuggestions: () => AIComposerSuggestionHandle | undefined;
	getSubmitShortcut: () => RichTextInputSubmitShortcut;
	getOnSubmitShortcut: () => ((event: KeyboardEvent) => void) | undefined;
	closeMenu: () => void;
	/** Alt+F10: move focus into the selection toolbar; answers whether it took it. */
	focusToolbar: () => boolean;
	/** A paste of text, as markdown. */
	paste: (markdown: string) => void;
	onChange: (value: JSONDoc) => void;
	onSelectionChange: () => void;
	onAttached: (node: HTMLElement) => (() => void) | void;
};

type Prevent = (callback?: () => void) => void;

/** The rich text plugin's mark chords, each with the format that allows it (none: never). */
const MARK_CHORDS = {
	'mod+b': 'bold',
	'mod+i': 'italic',
	'mod+e': 'code',
	'mod+shift+s': 'strikethrough',
	'mod+shift+x': 'strikethrough',
	'mod+u': null,
	'mod+shift+h': null
} as const satisfies Record<string, RichTextInputFormat | null>;

/** Native formatting commands (a phone's format menu), each with the format that allows it. */
const NATIVE_FORMATS: Record<string, RichTextInputFormat | null> = {
	formatBold: 'bold',
	formatItalic: 'italic',
	formatStrikeThrough: 'strikethrough',
	insertUnorderedList: 'bulletList',
	insertOrderedList: 'orderedList',
	formatUnderline: null,
	formatSuperscript: null,
	formatSubscript: null,
	formatFontColor: null,
	formatBackColor: null,
	formatFontName: null,
	formatJustifyCenter: null,
	formatJustifyFull: null,
	formatJustifyLeft: null,
	formatJustifyRight: null,
	formatIndent: null,
	formatOutdent: null
};

const ENTER = () => new KeyboardEvent('keydown', { key: 'Enter' });

export function createRichTextInputPlugin(options: RichTextInputPluginOptions): Plugin {
	return (edytor) => {
		const allows = (format: RichTextInputFormat) => options.getFormats().includes(format);

		const pick = (prevent: Prevent) => {
			if (!options.getMenuOpen()) return false;
			prevent(() => options.getSuggestions()?.selectHighlighted());
			return true;
		};
		const submit = (
			shortcut: RichTextInputSubmitShortcut,
			event: KeyboardEvent | undefined,
			prevent: Prevent
		) => {
			const onSubmit = options.getOnSubmitShortcut();
			if (!onSubmit || options.getSubmitShortcut() !== shortcut || event?.altKey) return;
			prevent(() => onSubmit(event ?? ENTER()));
		};
		const moveHighlight =
			(delta: number) =>
			({ prevent }: { prevent: Prevent }) => {
				if (options.getMenuOpen()) prevent(() => options.getSuggestions()?.moveHighlight(delta));
			};
		const gate =
			(format: RichTextInputFormat | null) =>
			({ prevent }: { prevent: Prevent }) => {
				if (!format || !allows(format)) prevent();
			};

		const definitions: ReturnType<Plugin> = {
			hotkeys: {
				arrowdown: moveHighlight(1),
				arrowup: moveHighlight(-1),
				tab: ({ prevent }) => void pick(prevent),
				escape: ({ prevent }) => {
					if (options.getMenuOpen()) prevent(options.closeMenu);
				},
				enter: ({ event, prevent }) => {
					if (event?.isComposing || pick(prevent)) return;
					submit('enter', event, prevent);
				},
				'shift+enter': ({ event, prevent }) => {
					if (event?.isComposing || pick(prevent)) return;
					submit('shift-enter', event, prevent);
				},
				'mod+enter': ({ event, prevent }) => {
					if (event?.isComposing || pick(prevent)) return;
					submit('command-enter', event, prevent);
				},
				'alt+f10': ({ prevent }) => {
					if (options.focusToolbar()) prevent();
				},
				...Object.fromEntries(
					Object.entries(MARK_CHORDS).map(([chord, format]) => [chord, gate(format)])
				)
			},
			inlineBlocks: {
				[TOKEN_TYPE]: {
					snippet: tokenAtomSnippet,
					plain: (data) => (data as AIComposerTokenData).label,
					markdown: (data) => formatAIComposerTokenMarkdown(data as AIComposerTokenData)
				}
			},
			onBeforeInput: ({ prevent, e }) => {
				const format = NATIVE_FORMATS[e.inputType];
				if (format !== undefined && (format === null || !allows(format))) prevent();
			},
			onPaste: ({ prevent, e }) => {
				const data = e.clipboardData;
				if (!data || data.types.includes('Files')) return;
				// A copy from an edytor keeps its tokens and marks: edytor pastes it.
				if (
					data.types.includes('application/x-edytor-fragment') ||
					data.getData('text/html').includes('data-edytor-fragment')
				) {
					return;
				}
				const markdown =
					data.getData('text/markdown') ||
					data.getData('text/x-markdown') ||
					data.getData('text/plain');
				if (markdown) prevent(() => options.paste(markdown));
			},
			onChange: options.onChange,
			onSelectionChange: () => options.onSelectionChange(),
			onEdytorAttached: ({ node }) => options.onAttached(node)
		};

		return withRulesAndTriggers(edytor, definitions, {
			inputRules: [
				...blockRules(edytor, allows),
				...inlineRules(edytor, allows, options.getFormats)
			]
		});
	};
}

type Allows = (format: RichTextInputFormat) => boolean;

/** Markdown typed at a paragraph's start turns it into a heading, a quote or a list item. */
function blockRules(edytor: Edytor, allows: Allows): InputRule[] {
	const rule = (
		find: RegExp,
		kind: (match: RegExpExecArray) => {
			format: RichTextInputFormat;
			block: Record<string, unknown>;
		}
	): InputRule => ({
		find,
		replace: (match, { block, from, remove }) => {
			if (from !== 0 || block.type !== 'paragraph') return false;
			const target = kind(match);
			if (!allows(target.format)) return false;
			let written = false;
			remove(() => {
				written = edytor.setBlock(block.id, target.block).status === 'applied';
			});
			return written;
		}
	});
	return [
		rule(/^(#{1,3}) $/, (match) => ({
			format: `heading${match[1].length}` as RichTextInputFormat,
			block: { type: 'heading', data: { level: `h${match[1].length}` } }
		})),
		rule(/^> $/, () => ({ format: 'quote', block: { type: 'quote' } })),
		rule(/^[-*+] $/, () => ({ format: 'bulletList', block: { type: 'bulleted-list-item' } })),
		rule(/^\d+[.)] $/, () => ({ format: 'orderedList', block: { type: 'numbered-list-item' } }))
	];
}

/**
 * A closing marker typed after marked-up text formats it (`**bold**`, `[text](url)`), and a typed
 * token tag becomes a token. Each only where the input allows its format.
 */
function inlineRules(
	edytor: Edytor,
	allows: Allows,
	getFormats: () => readonly RichTextInputFormat[]
): InputRule[] {
	const write = (
		{ block, to, remove, caret }: InputRuleContext,
		length: number,
		content: ReturnType<typeof parseInline>
	) => {
		const from = to - length;
		let offset = from;
		let written = false;
		remove(() => {
			for (const part of content) {
				const result =
					'text' in part
						? edytor.insertText(block.id, offset, part.text, part.marks)
						: edytor.insertInline(block.id, offset, part);
				if (result.status !== 'applied') return;
				offset += 'text' in part ? part.text.length : 1;
			}
			written = true;
		});
		if (!written) return false;
		caret(offset);
		// Typing on after the shortcut is unmarked.
		edytor.selection.stage({});
		return true;
	};
	const marked = (find: RegExp, formats: RichTextInputFormat[], marks: Marks): InputRule => ({
		find,
		replace: (match, context) => {
			if (!formats.every(allows)) return false;
			return write(context, match[0].length, parseInline(match[1], marks, getFormats()));
		}
	});
	return [
		{
			find: /<(?:File|Reference|Mention|Skill|Command)\s+[^>]*?\/>$/,
			replace: (match, context) => {
				const token = readTokenTag(match[0]);
				if (!token) return false;
				return write(context, match[0].length, [tokenAtom(token.data), { text: ' ' }]);
			}
		},
		{
			find: /(?<!`)`([^`\n]+)`$/,
			replace: (match, context) =>
				allows('code') &&
				write(context, match[0].length, [{ text: match[1], marks: { code: true } }])
		},
		{
			find: /\[([^\]\n]+)\]\(([^)\s]+)\)$/,
			replace: (match, context) =>
				allows('link') &&
				write(
					context,
					match[0].length,
					parseInline(match[1], { link: { href: match[2] } }, getFormats())
				)
		},
		marked(/(?<!\*)\*\*\*([^*\s](?:[^*]*[^*\s])?)\*\*\*$/, ['bold', 'italic'], {
			bold: true,
			italic: true
		}),
		marked(/(?<!\*)\*\*([^*\s](?:(?:[^*]|\*(?!\*))*[^*\s])?)\*\*$/, ['bold'], { bold: true }),
		marked(/(?<![_\w])__([^_\s](?:[^_]*[^_\s])?)__$/, ['bold'], { bold: true }),
		marked(/(?<!=)==([^=\s](?:[^=]*[^=\s])?)==$/, ['highlight'], { highlight: true }),
		marked(/(?<!~)~~([^~\s](?:[^~]*[^~\s])?)~~$/, ['strikethrough'], { strike: true }),
		marked(/(?<![*\w])\*([^*\s](?:[^*]*[^*\s])?)\*$/, ['italic'], { italic: true }),
		marked(/(?<![_\w])_([^_\s](?:[^_]*[^_\s])?)_$/, ['italic'], { italic: true })
	];
}
