import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Tabbar from './Tabbar.svelte';

const draw = (href: string) =>
	render(Tabbar, { props: { items: [{ label: 'Tab', href }] } as never }).body;

describe('Tabbar href', () => {
	test.each(['javascript:alert(1)', ' JaVa\tScRiPt:alert(1)', 'data:text/html,x'])(
		'%j draws a button, not a link',
		(href) => {
			const body = draw(href);
			expect(body).not.toContain('<a ');
			expect(body).not.toContain('href=');
			expect(body).toContain('Tab');
		}
	);

	test.each(['/dashboard', '#a', 'https://example.com/a', 'mailto:a@example.com', 'myapp://open'])(
		'%s is still a link',
		(href) => {
			expect(draw(href)).toContain(`href="${href}"`);
		}
	);
});
