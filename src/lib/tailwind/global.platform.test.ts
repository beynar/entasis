// The plugin CSS the platform behaviours lean on: the scroll-lock rule (OV-4, CX-11), the
// keyboard inset default (OV-INFRA-7) and the drag-and-drop base styles (CX-8).
import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';
import themePlugin from './theme.js';

const themeCss = `
@plugin './theme' {
	name: light;
	default: true;
	colorscheme: light;
	surface: #fafafa;
	neutral: #18181b;
	primary: #5f62ef;
}
@tailwind utilities;
`;

const css = async () =>
	(
		await compile(themeCss, {
			base: '/',
			loadModule: async (id) => ({ path: id, base: '/', module: themePlugin })
		})
	).build([]);

/** The declarations of the first rule whose selector is exactly `selector`. */
const rule = (source: string, selector: string) => {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return source.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
};

describe('scroll lock rules', () => {
	it('hides overflow on whatever carries the lock attribute', async () => {
		expect(rule(await css(), '[data-entasis-scroll-lock]')).toMatch(
			/overflow:\s*hidden\s*!important/
		);
	});

	it('keeps the scrollbar gutter while locked, unless the page already reserves it', async () => {
		const source = await css();
		const compensated = `[data-entasis-scroll-lock]:not([data-entasis-scroll-lock='uncompensated'])`;
		expect(rule(source, compensated)).toMatch(/scrollbar-gutter:\s*stable\s*!important/);
		// Padding by the published width is the fallback where the property is unsupported.
		const fallback = source.match(
			/@supports not \(scrollbar-gutter: stable\)\s*\{[\s\S]*?\n\s*\}\s*\n\s*\}/
		);
		expect(fallback?.[0]).toMatch(/padding-inline-end:\s*var\(--entasis-scrollbar-width, 0px\)/);
		expect(fallback?.[0]).toContain(`[data-entasis-scroll-lock='uncompensated']`);
	});

	it('defaults --keyboard-inset to 0px on html', async () => {
		expect(await css()).toMatch(/--keyboard-inset:\s*0px/);
	});
});

describe('drag-and-drop base styles', () => {
	it('dims the dragged item and tints an empty drop target from the plugin CSS', async () => {
		const source = await css();
		expect(rule(source, '[data-dnd-dragging]')).toMatch(/opacity:\s*0\.4/);
		expect(source).toMatch(
			/:where\(\[data-dnd-over="true"\]:not\(:has\(\[data-dnd-item\]\)\)\)\s*\{[^}]*color-mix/
		);
	});
});
