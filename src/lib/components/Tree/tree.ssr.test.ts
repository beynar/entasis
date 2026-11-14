// Tree's accessible name in the server markup. Pierre Trees serializes the role="tree" element
// inside a declarative shadow root, so an `aria-label` left on the outer wrapper (which has no
// role) named nothing until the client mounted, and not even then.
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Tree from './Tree.svelte';
import { labelTreeMarkup } from './tree.accessibility.js';

const body = (props: Record<string, unknown>) =>
	render(Tree, { props: { paths: ['docs/guide.md', 'readme.md'], ...props } }).body;

describe('Tree name in server markup', () => {
	test('aria-label lands on the role="tree" element, not on the wrapper', () => {
		const html = body({ 'aria-label': 'Project "files"' });
		expect(html.match(/<div[^>]*role="tree"[^>]*>/)?.[0]).toContain(
			'aria-label="Project &quot;files&quot;"'
		);
		expect(html.match(/<div[^>]*data-slot="tree"[^>]*>/)?.[0]).not.toContain('aria-label');
	});

	test('without a label the markup is left as Pierre Trees serialized it', () => {
		const markup = '<style>[role="tree"] {}</style><div role="tree"></div>';
		expect(labelTreeMarkup(markup, undefined)).toBe(markup);
		expect(labelTreeMarkup(markup, 'Files')).toBe(
			'<style>[role="tree"] {}</style><div role="tree" aria-label="Files"></div>'
		);
	});
});
