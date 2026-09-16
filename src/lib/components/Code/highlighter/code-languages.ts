import { allLanguages, type LanguageDefinition } from '@tanstack/highlight';

export type CodeLanguageInfo = {
	/** Canonical language id used by the highlighter and surfaced through `CodeHeaderPayload`. */
	id: string;
	/** Human-friendly display name shown in the header when no `title` is provided. */
	label: string;
	/** Ids that resolve to this language (`js` -> `javascript`, `sh` -> `shell`, ...). */
	aliases: readonly string[];
	/** The TanStack Highlight tokenizer. */
	definition: LanguageDefinition;
};

/** Display labels per canonical id; anything missing falls back to the id itself. */
const languageLabels: Record<string, string> = {
	apache: 'Apache',
	cmake: 'CMake',
	cpp: 'C++',
	css: 'CSS',
	diff: 'Diff',
	dockerfile: 'Dockerfile',
	ejs: 'EJS',
	env: '.env',
	go: 'Go',
	html: 'HTML',
	http: 'HTTP',
	js: 'JavaScript',
	json: 'JSON',
	jsx: 'JSX',
	markdown: 'Markdown',
	mermaid: 'Mermaid',
	nginx: 'Nginx',
	php: 'PHP',
	plaintext: 'Text',
	python: 'Python',
	scheme: 'Scheme',
	shell: 'Shell',
	sql: 'SQL',
	svelte: 'Svelte',
	toml: 'TOML',
	ts: 'TypeScript',
	tsrx: 'Octane',
	tsx: 'TSX',
	vue: 'Vue',
	yaml: 'YAML'
};

/** Aliases the tokenizers do not declare themselves but snippets commonly use. */
const extraAliases: Record<string, string> = {
	c: 'cpp',
	h: 'cpp',
	text: 'plaintext',
	plain: 'plaintext',
	mdx: 'markdown',
	jsonl: 'json',
	'docker-compose': 'yaml',
	powershell: 'shell',
	ps1: 'shell',
	svg: 'html'
};

/** The canonical id of the no-highlighting fallback. */
export const PLAIN_TEXT_LANGUAGE = 'plaintext';

/**
 * Every language TanStack Highlight ships, bundled by default so any snippet
 * highlights without per-language registration. Ids the tokenizers do not
 * cover (`rust`, `java`, ...) render as plain text.
 */
export const bundledCodeLanguagesInfo: readonly CodeLanguageInfo[] = allLanguages.map(
	(definition) => ({
		id: definition.name,
		label: languageLabels[definition.name] ?? definition.name,
		aliases: definition.aliases ?? [],
		definition
	})
);

/** The tokenizer set handed to `createHighlighter`. */
export const bundledCodeLanguages: readonly LanguageDefinition[] = allLanguages;

/** Maps every id and alias (lower-case) to its canonical id. */
const canonicalLanguageIds = new Map<string, string>();
for (const language of bundledCodeLanguagesInfo) {
	canonicalLanguageIds.set(language.id, language.id);
	for (const alias of language.aliases) canonicalLanguageIds.set(alias.toLowerCase(), language.id);
}
for (const [alias, id] of Object.entries(extraAliases)) {
	if (canonicalLanguageIds.has(id)) canonicalLanguageIds.set(alias, id);
}

/**
 * Normalizes a language id, resolving aliases and falling back to `plaintext`
 * for anything the bundled tokenizers cannot handle. SSR-safe (pure).
 */
export function resolveLanguage(language: string | undefined): string {
	const normalized = language?.trim().toLowerCase();
	if (!normalized) return PLAIN_TEXT_LANGUAGE;
	return canonicalLanguageIds.get(normalized) ?? PLAIN_TEXT_LANGUAGE;
}

/**
 * Human-friendly label for a language id (for the header). Unknown ids keep
 * the raw input so a `language="rust"` block is still titled "rust".
 */
export function getLanguageLabel(language: string | undefined): string {
	const normalized = language?.trim().toLowerCase();
	if (!normalized) return languageLabels[PLAIN_TEXT_LANGUAGE];
	const canonical = canonicalLanguageIds.get(normalized);
	if (canonical) return languageLabels[canonical] ?? canonical;
	return language ?? languageLabels[PLAIN_TEXT_LANGUAGE];
}
