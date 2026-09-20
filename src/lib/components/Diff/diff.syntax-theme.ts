import type { ThemeRegistration } from '@pierre/diffs';

type RawThemeSetting = NonNullable<ThemeRegistration['settings']>[number];

/**
 * A single Shiki theme (consumed by `@pierre/diffs`, which highlights with Shiki
 * under the hood) whose every color references a `--code-token-*` CSS variable.
 * The actual colors are defined in `Code/CodeTheme.svelte` in terms of our
 * `--color-*` design tokens, so diff highlighting shares Code's exact palette and
 * auto-adapts to light/dark for free.
 *
 * Scope mapping mirrors svelte-pro's `token-shiki-scopes.ts`, trimmed to the
 * roles we actually theme. Values are emitted verbatim into inline `style`
 * attributes by Shiki, e.g. `color:var(--code-token-keyword)`.
 */

const token = {
	background: 'var(--code-token-surface)',
	plain: 'var(--code-token-plain)',
	comment: 'var(--code-token-comment)',
	punctuation: 'var(--code-token-punctuation)',
	keyword: 'var(--code-token-keyword)',
	string: 'var(--code-token-string)',
	number: 'var(--code-token-number)',
	constant: 'var(--code-token-constant)',
	function: 'var(--code-token-function)',
	variable: 'var(--code-token-variable)',
	property: 'var(--code-token-property)',
	tag: 'var(--code-token-tag)',
	regex: 'var(--code-token-regex)',
	escape: 'var(--code-token-escape)',
	error: 'var(--code-token-error)',
	inserted: 'var(--code-token-inserted)',
	deleted: 'var(--code-token-deleted)',
	changed: 'var(--code-token-changed)',
	insertedBackground: 'var(--code-token-inserted-surface)',
	deletedBackground: 'var(--code-token-deleted-surface)',
	changedBackground: 'var(--code-token-changed-surface)'
} as const;

const settings: RawThemeSetting[] = [
	{ settings: { foreground: token.plain, background: token.background } },
	{
		scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
		settings: { foreground: token.comment, fontStyle: 'italic' }
	},
	{
		scope: [
			'punctuation',
			'meta.brace',
			'punctuation.section.embedded',
			'punctuation.definition.tag'
		],
		settings: { foreground: token.punctuation }
	},
	{
		scope: [
			'constant.numeric',
			'constant.language',
			'constant.character.numeric',
			'keyword.other.unit',
			'support.constant'
		],
		settings: { foreground: token.number }
	},
	{
		scope: [
			'constant',
			'entity.name.constant',
			'variable.other.constant',
			'variable.other.enummember',
			'variable.language',
			'meta.module-reference'
		],
		settings: { foreground: token.constant }
	},
	{
		scope: ['string', 'string punctuation.section.embedded source', 'string.quoted'],
		settings: { foreground: token.string }
	},
	{
		scope: [
			'source.regexp',
			'string.regexp',
			'string.regexp.character-class',
			'string.regexp source.ruby.embedded',
			'constant.other.reference.link',
			'string.other.link'
		],
		settings: { foreground: token.regex }
	},
	{
		scope: ['constant.character.escape', 'string.regexp constant.character.escape'],
		settings: { foreground: token.escape }
	},
	{
		scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control'],
		settings: { foreground: token.keyword }
	},
	{
		scope: [
			'entity.name.function',
			'support.function',
			'meta.function-call.generic',
			'meta.diff.range'
		],
		settings: { foreground: token.function }
	},
	{
		scope: [
			'support.type.property-name',
			'meta.property-name',
			'meta.object-literal.key',
			'entity.other.attribute-name',
			'support.variable',
			'variable.other.property'
		],
		settings: { foreground: token.property }
	},
	{
		scope: [
			'entity.name.tag',
			'support.class.component',
			'support.type.property-name.json',
			'meta.tag'
		],
		settings: { foreground: token.tag }
	},
	{
		scope: [
			'entity.name.type',
			'entity.name.class',
			'support.type',
			'support.class',
			'entity.other.inherited-class'
		],
		settings: { foreground: token.function }
	},
	{
		scope: [
			'variable',
			'entity.name',
			'meta.definition.variable',
			'variable.parameter',
			'variable.other.readwrite'
		],
		settings: { foreground: token.variable }
	},
	{
		scope: ['invalid', 'invalid.illegal', 'invalid.broken', 'invalid.deprecated', 'message.error'],
		settings: { foreground: token.error }
	},
	{
		scope: ['markup.deleted', 'meta.diff.header.from-file', 'punctuation.definition.deleted'],
		settings: { foreground: token.deleted, background: token.deletedBackground }
	},
	{
		scope: ['markup.inserted', 'meta.diff.header.to-file', 'punctuation.definition.inserted'],
		settings: { foreground: token.inserted, background: token.insertedBackground }
	},
	{
		scope: ['markup.changed', 'punctuation.definition.changed'],
		settings: { foreground: token.changed, background: token.changedBackground }
	},
	{ scope: 'markup.heading', settings: { foreground: token.keyword, fontStyle: 'bold' } },
	{ scope: 'markup.bold', settings: { foreground: token.plain, fontStyle: 'bold' } },
	{ scope: 'markup.italic', settings: { foreground: token.plain, fontStyle: 'italic' } },
	{ scope: 'markup.underline', settings: { fontStyle: 'underline' } },
	{ scope: 'markup.strikethrough', settings: { fontStyle: 'strikethrough' } },
	{ scope: ['markup.inline.raw', 'markup.raw'], settings: { foreground: token.string } },
	{
		scope: ['markup.quote', 'punctuation.definition.list.begin.markdown'],
		settings: { foreground: token.comment }
	}
];

/** Theme name registered with the highlighter (referenced by `codeToHtml`). */
export const CODE_SYNTAX_THEME_NAME = 'entasis-code-tokens';

let cachedTheme: ThemeRegistration | undefined;

/** Returns the singleton CSS-variable syntax theme registration. */
export function getCodeSyntaxTheme(): ThemeRegistration {
	cachedTheme ??= {
		name: CODE_SYNTAX_THEME_NAME,
		type: 'dark',
		semanticHighlighting: true,
		fg: token.plain,
		bg: token.background,
		colors: {
			foreground: token.plain,
			'editor.background': token.background,
			'editor.foreground': token.plain
		},
		settings
	};
	return cachedTheme;
}
