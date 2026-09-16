import { describe, expect, it } from 'vitest';
import { codeToHtml } from './code.highlighter.js';
import {
	bundledCodeLanguagesInfo,
	getLanguageLabel,
	resolveLanguage
} from './highlighter/code-languages.js';

describe('code highlighter (TanStack Highlight)', () => {
	it('bundles every shipped language by default', () => {
		const ids = bundledCodeLanguagesInfo.map((language) => language.id);
		expect(ids).toEqual(expect.arrayContaining(['ts', 'svelte', 'css', 'shell', 'python', 'json']));
		expect(ids.length).toBeGreaterThanOrEqual(30);
	});

	it('resolves aliases and falls back to plain text', () => {
		expect(resolveLanguage('typescript')).toBe('ts');
		expect(resolveLanguage('JS')).toBe('js');
		expect(resolveLanguage('bash')).toBe('shell');
		expect(resolveLanguage('c')).toBe('cpp');
		expect(resolveLanguage('text')).toBe('plaintext');
		expect(resolveLanguage(undefined)).toBe('plaintext');
		expect(resolveLanguage('rust')).toBe('plaintext');
		expect(getLanguageLabel('ts')).toBe('TypeScript');
		expect(getLanguageLabel('rust')).toBe('rust');
		expect(getLanguageLabel(undefined)).toBe('Text');
	});

	it('emits token classes and escapes the source', () => {
		const html = codeToHtml('const a = "<b>"; // hi', { language: 'ts' });
		expect(html).toMatch(/^<pre class="[^"]*th-code[^"]*th-code--ts"/);
		expect(html).toContain('th-keyword');
		expect(html).toContain('th-string');
		expect(html).toContain('th-comment');
		expect(html).toContain('&lt;b&gt;');
		expect(html).not.toContain('<b>');
	});

	it('tags lines for the gutter and drops the inter-line newlines', () => {
		const html = codeToHtml('a\nb\nc', { language: 'text', lineNumbers: true, wrap: true });
		expect(html).toContain('th-code--line-numbers');
		expect(html).toContain('data-wrap');
		expect(html.match(/class="th-line" data-line="\d+"/g)).toHaveLength(3);
		expect(html).not.toContain('</span>\n<span class="th-line"');
	});

	it('renders unknown languages as plain text without throwing', () => {
		const html = codeToHtml('fn main() {}', { language: 'rust' });
		expect(html).toContain('th-code--plaintext');
		expect(html).toContain('fn main() {}');
	});
});
