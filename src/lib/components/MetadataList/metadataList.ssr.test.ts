import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import MetadataList from './MetadataList.svelte';

const draw = (props: Record<string, unknown>) =>
	render(MetadataList, { props: props as never }).body;

describe('MetadataList values from a row', () => {
	test.each(['javascript:alert(1)', ' JaVa\tScRiPt:alert(1)', 'data:text/html,x'])(
		'an href of %j draws no link and keeps the value',
		(href) => {
			const body = draw({ items: [{ label: 'Site', type: 'url', value: 'example.com', href }] });
			expect(body).not.toContain('<a ');
			expect(body).toContain('example.com');
		}
	);

	test('a value that is itself such an address draws no link', () => {
		const body = draw({ items: [{ label: 'Site', type: 'url', value: 'javascript:alert(1)' }] });
		expect(body).not.toContain('<a ');
	});

	test('a safe address is still a link, and so are email and phone', () => {
		const body = draw({
			items: [
				{ label: 'A', type: 'url', value: 'https://example.com/a' },
				{ label: 'B', type: 'url', value: 'shown', href: '/in-app' },
				{ label: 'E', type: 'url', value: 'shown', href: 'myapp://open' },
				{ label: 'C', type: 'email', value: 'a@example.com' },
				{ label: 'D', type: 'phone', value: '+33123456789' }
			]
		});
		for (const href of [
			'https://example.com/a',
			'/in-app',
			'myapp://open',
			'mailto:a@example.com',
			'tel:+33123456789'
		]) {
			expect(body).toContain(`href="${href}"`);
		}
	});

	test.each([
		'2;background:url(https://example.test/x)',
		'1) ; background:url(x',
		'calc(2)',
		-1,
		0,
		1.5,
		Number.NaN,
		Number.POSITIVE_INFINITY
	])('columns of %j add nothing to the style', (columns) => {
		const body = draw({ columns, items: [{ label: 'A', value: 'x' }] });
		expect(body).toContain('repeat(1, minmax(0, 1fr))');
		expect(body).not.toMatch(/url\(|background/);
	});

	test('a whole number of columns still lays them out', () => {
		expect(draw({ columns: 3, items: [] })).toContain('repeat(3, minmax(0, 1fr))');
	});
});
