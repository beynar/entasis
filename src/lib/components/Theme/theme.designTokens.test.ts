import { describe, expect, it } from 'vitest';
import { compileThemeDesignTokens } from './theme.designTokens.js';

const compile = (tokens: Record<string, unknown>) =>
	compileThemeDesignTokens({
		designTokens: { light: tokens } as never,
		attribute: 'data-theme',
		value: { light: 'light' }
	});

describe('state role design tokens', () => {
	it('pins the focus ring on a role without touching the current role', () => {
		const css = compile({ focusColor: 'primary' });
		expect(css).toBe('html[data-theme="light"]{--color-focus:var(--color-primary);}');
		// `focusColor` moves rings only. The chrome around them keeps whatever `--color` it had,
		// which is the whole reason the state roles are separate from `defaultColor`.
		expect(css).not.toMatch(/--color:|--color-contrast:/);
	});

	it('emits the whole selected kit so a soft and a solid selection stay legible', () => {
		expect(compile({ selectedColor: 'primary' })).toBe(
			'html[data-theme="light"]{' +
				'--color-selected:var(--color-primary);' +
				'--color-selected-muted:var(--color-primary-muted);' +
				'--color-selected-contrast:var(--color-primary-contrast);' +
				'--color-selected-muted-readable:var(--color-primary-muted-readable);' +
				'--color-selected-readable:var(--color-primary-readable);' +
				'}'
		);
	});

	it('emits the transient pair one variable each', () => {
		expect(compile({ hoverColor: 'info', pressedColor: 'danger' })).toBe(
			'html[data-theme="light"]{--color-hover:var(--color-info);--color-pressed:var(--color-danger);}'
		);
	});

	it('emits nothing for a theme that pins no state role', () => {
		// The variables must stay undeclared, because every use site falls back to the current
		// role: declaring them empty here would break that fallback everywhere at once.
		expect(compile({ radius: 'small' })).not.toMatch(
			/--color-focus|--color-selected|--color-hover|--color-pressed/
		);
	});

	it('throws on a role outside the kit, naming the token that carried it', () => {
		for (const token of ['focusColor', 'selectedColor', 'hoverColor', 'pressedColor'])
			expect(() => compile({ [token]: 'accent' })).toThrow(`Unknown ${token} "accent".`);
		expect(() => compile({ defaultColor: 'accent' })).toThrow('Unknown defaultColor "accent".');
	});
});
