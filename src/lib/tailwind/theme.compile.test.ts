import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';
import themePlugin from './theme.js';

/**
 * The two `@plugin` blocks from `src/app.css`, compiled the way the Vite plugin does it.
 * A bare declaration handed to `addBase` (a `border-color: …;` at rule level) makes the CSS
 * parser swallow the selector of the rule that follows it, which once silently dropped the
 * whole `html[data-theme="dark"]` palette — dark mode "stopped working" with no error anywhere.
 */
const themeCss = `
@plugin './theme' {
	name: light;
	default: true;
	colorscheme: light;
	surface: #fafafa;
	neutral: #18181b;
	primary: #5f62ef;
}
@plugin './theme' {
	name: dark;
	colorscheme: dark;
	surface: #09090b;
	neutral: #fafafa;
	primary: #5f62ef;
}
@tailwind utilities;
`;

const compileThemeCss = async (candidates: string[] = []) => {
	const compiler = await compile(themeCss, {
		base: '/',
		loadModule: async (id) => ({ path: id, base: '/', module: themePlugin })
	});
	return compiler.build(candidates);
};

describe('theme plugin CSS', () => {
	it('emits every theme palette under its own selector and never a bare declaration', async () => {
		const css = await compileThemeCss();
		const lines = css.split('\n');
		const paletteSelectors = lines
			.map((line, index) => (/^\s*--color-primary:/.test(line) ? lines[index - 1] : null))
			.filter((line): line is string => line !== null)
			.map((line) => line.trim().replace(/\s*\{$/, ''));
		expect(paletteSelectors).toEqual(
			expect.arrayContaining(['html', '.light', 'html[data-theme="dark"]', '.dark'])
		);
		// A `prop: value;` line straight after a closed rule sits at rule level: invalid CSS
		// that the browser recovers from by discarding the rule that follows it.
		const bare = lines.filter(
			(line, index) => /^\s*[a-z-]+: [^{}]+;$/.test(line) && /\}\s*$/.test(lines[index - 1] ?? '')
		);
		expect(bare).toEqual([]);
	});

	it('lifts without a border and stays on the elevation ramp', async () => {
		const css = await compileThemeCss(['lift-3', 'lift-none', 'raised-3']);
		expect(css).toMatch(
			/\.lift-3 \{\s*--tw-shadow: inset 0 0 0 9999px var\(--elevation-tint-3\), var\(--elevation-3\);\s*box-shadow: var\(--tw-inset-shadow/
		);
		// The border is what separates `lift-*` from `raised-*`: a thumb or an indicator floats
		// without a hairline, so neither the set nor the reset may emit one.
		expect(css.match(/\.lift-3 \{[^}]*\}/)?.[0]).not.toMatch(/border/);
		expect(css.match(/\.lift-none \{[^}]*\}/)?.[0]).not.toMatch(/border/);
		expect(css).toMatch(/\.lift-none \{\s*--tw-shadow: 0 0 #0000;/);
		expect(css.match(/\.raised-3 \{[^}]*\}/)?.[0]).toMatch(/border: var\(--raised-border/);
	});

	it('emits the geometry tokens for icons and rows', async () => {
		const css = await compileThemeCss(['size-icon-xs', 'size-icon-xl', 'h-row-md', 'min-h-row-lg']);
		expect(css).toMatch(
			/\.size-icon-xs \{\s*width: var\(--icon-size-xs\);\s*height: var\(--icon-size-xs\);/
		);
		expect(css).toMatch(
			/\.size-icon-xl \{\s*width: var\(--icon-size-xl\);\s*height: var\(--icon-size-xl\);/
		);
		expect(css).toMatch(/\.h-row-md \{\s*height: var\(--row-height-md\);/);
		expect(css).toMatch(/\.min-h-row-lg \{\s*min-height: var\(--row-height-lg\);/);
		// The variables the utilities read are declared by the engine, on the `html` base layer.
		expect(css).toMatch(/--icon-size-xs: calc\(var\(--spacing\) \* 3\);/);
		expect(css).toMatch(/--icon-size-xl: calc\(var\(--spacing\) \* 6\);/);
		expect(css).toMatch(/--row-height-md: calc\(var\(--spacing\) \* 10\);/);
		expect(css).toMatch(/--row-height-lg: calc\(var\(--spacing\) \* 12\);/);
	});

	it('emits the whole current-role colour family, fill and stroke included', async () => {
		const css = await compileThemeCss([
			'text-color-contrast',
			'fill-color-contrast',
			'stroke-color'
		]);
		expect(css).toMatch(/\.text-color-contrast \{\s*color: var\(--color-contrast\)/);
		expect(css).toMatch(/\.fill-color-contrast \{\s*fill: var\(--color-contrast\)/);
		expect(css).toMatch(/\.stroke-color \{\s*stroke: var\(--color\)/);
	});

	// The four STATE ROLES are the one colour family that is *not* declared anywhere by default:
	// `--color-focus`, `--color-selected*`, `--color-hover` and `--color-pressed` only exist once a
	// theme pins one. So every use site has to carry the fallback to the current role inline —
	// a missing fallback would not fail loudly, it would silently paint the ring transparent.
	it('rings on the focus state role and falls back to the current role', async () => {
		const css = await compileThemeCss(['ring-focus', 'ring-focus/50', 'border-focus']);
		expect(css).toMatch(/\.ring-focus \{\s*--tw-ring-color: var\(--color-focus, var\(--color\)\)/);
		expect(css).toMatch(
			/--tw-ring-color: color-mix\(in oklab, var\(--color-focus, var\(--color\)\) 50%, transparent\)/
		);
		expect(css).toMatch(/\.border-focus \{\s*border-color: var\(--color-focus, var\(--color\)\)/);
		// The variable itself is never declared: an unpinned theme must render exactly as it did
		// when the ring named the current role outright.
		expect(css).not.toMatch(/--color-focus:/);
	});

	it('fills on the selected state role and falls back to the matching current-role tint', async () => {
		const css = await compileThemeCss([
			'bg-selected',
			'bg-selected-muted',
			'bg-color-muted',
			'text-selected-muted-readable',
			'text-selected-contrast',
			'border-selected',
			'ring-selected'
		]);
		expect(css).toMatch(
			/\.bg-selected \{\s*background-color: var\(--color-selected, var\(--color\)\)/
		);
		// The soft fill is the one member of the family that is NOT a plain variable: it
		// composites the role at `--state-selected-opacity` so the same selection reads on a
		// raised or floating surface instead of being an opaque tint of the base one. Tailwind
		// wraps every `color-mix()` in an `@supports` guard, so the declaration is read out of
		// the rule rather than matched straight after the selector.
		const rule = (name: string) => css.slice(css.indexOf(`.${name} {`)).split('\n}')[0];
		expect(rule('bg-selected-muted')).toMatch(
			/background-color: color-mix\(in oklab, var\(--color-selected, var\(--color\)\) calc\(var\(--state-selected-opacity\) \* 100%\), transparent\);/
		);
		// `bg-color-muted`, the non-state family, keeps the opaque tint: it is a surface colour,
		// not a state on top of one.
		expect(css).toMatch(/\.bg-color-muted \{\s*background-color: var\(--color-muted\)/);
		// Both schemes declare the alpha, and dark runs higher — a dark surface needs more ink
		// to shift the same perceived amount.
		expect(css).toMatch(/--state-selected-opacity: 0\.07;/);
		expect(css).toMatch(/--state-selected-opacity: 0\.1;/);
		expect(css).toMatch(
			/\.text-selected-muted-readable \{\s*color: var\(--color-selected-muted-readable, var\(--color-muted-readable\)\)/
		);
		expect(css).toMatch(
			/\.text-selected-contrast \{\s*color: var\(--color-selected-contrast, var\(--color-contrast\)\)/
		);
		expect(css).toMatch(
			/\.border-selected \{\s*border-color: var\(--color-selected, var\(--color\)\)/
		);
		expect(css).toMatch(
			/\.ring-selected \{\s*--tw-ring-color: var\(--color-selected, var\(--color\)\)/
		);
		expect(css).not.toMatch(/--color-selected(?:-[a-z-]+)?:/);
	});

	it('tints the state layer through the hover and pressed state roles', async () => {
		const css = await compileThemeCss(['state-layer']);
		const layer = css.slice(css.indexOf('.state-layer {'), css.indexOf('@layer base'));
		expect(layer).toMatch(/background-color: var\(--color-hover, currentColor\)/);
		// `pressed` degrades to `hover` before it degrades to the ink, so pinning only
		// `hoverColor` keeps the press on that same colour instead of snapping back to currentColor.
		expect(layer).toMatch(
			/background-color: var\(--color-pressed, var\(--color-hover, currentColor\)\)/
		);
		expect(css).not.toMatch(/--color-hover:|--color-pressed:/);
	});

	// NESTED RADIUS is computed by the cascade: `rounded-<step>` and `p|px|py-<step>` publish
	// their value to their children, `rounded-<step>-concentric` reads its own step capped at
	// parent radius minus parent padding. Compiling both halves proves the variables one side
	// emits are the ones the other consumes.
	it('publishes radius and padding to children and reads them back in rounded-<step>-concentric', async () => {
		const css = await compileThemeCss([
			'rounded-lg',
			'rounded-2xl',
			'p-md',
			'px-sm',
			'py-xs',
			'rounded-md-concentric',
			'rounded-t-lg-concentric',
			'rounded-b-sm-concentric'
		]);
		// Zero specificity on the publish so the same box's `p-md > *` beats the reset in any order.
		expect(css).toMatch(
			/:where\(\.rounded-lg\) > \* \{\s*--radius-parent: var\(--radius-lg\);\s*--pad-parent-x: 0px;\s*--pad-parent-y: 0px;/
		);
		expect(css).toMatch(/:where\(\.rounded-2xl\) > \* \{\s*--radius-parent: var\(--radius-2xl\);/);
		expect(css).toMatch(
			/\.p-md \{\s*padding: var\(--space-md\);\s*& > \* \{\s*--pad-parent-x: var\(--space-md\);\s*--pad-parent-y: var\(--space-md\);/
		);
		expect(css).toMatch(
			/\.px-sm \{\s*padding-inline: var\(--space-sm\);\s*& > \* \{\s*--pad-parent-x: var\(--space-sm\);/
		);
		expect(css).toMatch(
			/\.py-xs \{\s*padding-block: var\(--space-xs\);\s*& > \* \{\s*--pad-parent-y: var\(--space-xs\);/
		);
		const formula = (step: string) =>
			`min\\(var\\(--radius-${step}\\), calc\\(var\\(--radius-parent, calc\\(infinity \\* 1px\\)\\) - max\\(var\\(--pad-parent-x, 0px\\), var\\(--pad-parent-y, 0px\\)\\)\\)\\)`;
		expect(css).toMatch(
			new RegExp(`\\.rounded-md-concentric \\{\\s*border-radius: ${formula('md')};`)
		);
		expect(css).toMatch(
			new RegExp(
				`\\.rounded-t-lg-concentric \\{\\s*border-top-left-radius: ${formula('lg')};\\s*border-top-right-radius: ${formula('lg')};`
			)
		);
		expect(css).toMatch(
			new RegExp(
				`\\.rounded-b-sm-concentric \\{\\s*border-bottom-left-radius: ${formula('sm')};\\s*border-bottom-right-radius: ${formula('sm')};`
			)
		);
		// A concentric box cannot publish its computed radius, so it publishes its nominal step
		// and closes the padding boundary for its own children, like any rounded box.
		expect(css).toMatch(
			/\.rounded-md-concentric \{[^}]*:where\(&\) > \* \{\s*--radius-parent: var\(--radius-md\);\s*--pad-parent-x: 0px;\s*--pad-parent-y: 0px;/
		);
		expect(css).not.toMatch(/@property --pad-parent/);
		// The bare child half is not a class: the step is part of the name.
		expect(await compileThemeCss(['rounded-concentric', 'rounded-nested'])).not.toMatch(
			/concentric|nested/
		);
		// A pill or square container is a rounded boundary too: its flush children stay pills
		// or squares instead of inheriting some grandparent's corner.
		const ends = await compileThemeCss(['rounded-full', 'rounded-none']);
		expect(ends).toMatch(
			/:where\(\.rounded-full\) > \* \{\s*--radius-parent: calc\(infinity \* 1px\);\s*--pad-parent-x: 0px;/
		);
		expect(ends).toMatch(/:where\(\.rounded-none\) > \* \{\s*--radius-parent: 0px;/);
		// An arbitrary radius has no step to publish; one-sided padding is not a uniform gap.
		const stray = await compileThemeCss(['rounded-[3px]', 'pt-md']);
		expect(stray).not.toMatch(/--radius-parent/);
		expect(stray).not.toMatch(/--pad-parent-[xy]:/);
	});

	it('re-declares the geometry tokens next to a scoped --spacing', async () => {
		const { spacingVariable } = await import('./scales.js');
		const scoped = spacingVariable('large');
		expect(scoped['--spacing']).toBe('0.3rem');
		expect(scoped['--control-height-md']).toBe('calc(var(--spacing) * 8)');
		expect(scoped['--icon-size-lg']).toBe('calc(var(--spacing) * 5)');
		expect(scoped['--row-height-lg']).toBe('calc(var(--spacing) * 12)');
	});
});
