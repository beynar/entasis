// The compiler has its own unit tests; this one checks the other half of the claim the docs make
// — that `<Theme designTokens>` actually *emits* what the compiler returns into the document, so
// a theme that pins a state role really does declare `--color-focus` / `--color-selected*` for
// every `ring-focus` and `bg-selected*` in the tree to fall back off.
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import ThemeHarness from './ThemeHarness.test.svelte';

const emittedCss = () =>
	Array.from(document.head.querySelectorAll('style'))
		.map((style) => style.textContent ?? '')
		.join('\n');

describe('Theme designTokens state roles', () => {
	test('emits the pinned focus and selected variables on the theme root', () => {
		render(ThemeHarness, {
			props: { designTokens: { light: { focusColor: 'primary', selectedColor: 'primary' } } }
		});

		const css = emittedCss();
		expect(css).toContain('html[data-theme="light"]');
		expect(css).toContain('--color-focus:var(--color-primary);');
		expect(css).toContain('--color-selected:var(--color-primary);');
		expect(css).toContain('--color-selected-muted:var(--color-primary-muted);');
		expect(css).toContain('--color-selected-contrast:var(--color-primary-contrast);');
		expect(css).toContain('--color-selected-muted-readable:var(--color-primary-muted-readable);');
	});

	test('emits no state-role variable for a theme that pins none', () => {
		render(ThemeHarness, { props: { designTokens: { light: { radius: 'small' } } } });

		// The fallback is the whole design: an unpinned theme must leave the variables undeclared
		// so `ring-focus` keeps resolving to `var(--color)`.
		expect(emittedCss()).not.toMatch(
			/--color-focus|--color-selected|--color-hover|--color-pressed/
		);
	});
});
