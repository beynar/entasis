import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import { cva } from './engine.js';
import { setComponentTheme, useComponentTheme } from './theme.js';
import Harness from './CvaHarness.test.svelte';

// Runs `fn` inside a live component so getContext/setContext work.
const inComponent = (fn: () => void) => render(Harness, { props: { run: fn } });

const makeTheme = () => ({
	button: cva({
		base: 'rounded',
		variants: { size: { sm: 'text-sm', lg: 'text-lg' } },
		defaultVariants: { size: 'sm' }
	})
});

describe('useComponentTheme', () => {
	it('returns the default theme untouched when there is no context and no theme', () => {
		const defaultTheme = makeTheme();
		let result: ReturnType<typeof defaultTheme.button> | undefined;
		inComponent(() => {
			const use = useComponentTheme('btnDefault', defaultTheme);
			const theme = use();
			expect(theme).toBe(defaultTheme);
			result = theme.button({ size: 'lg' });
		});
		expect(result).toBe('rounded text-lg');
	});

	it('composes a local theme on top of the default (default classes kept)', () => {
		const defaultTheme = makeTheme();
		let result: string | undefined;
		inComponent(() => {
			const use = useComponentTheme('btnLocal', defaultTheme);
			const theme = use({ button: { base: 'shadow', size: { sm: 'font-bold' } } });
			result = theme.button({ size: 'sm' });
		});
		expect(result).toBe('rounded text-sm shadow font-bold');
	});

	it('replaces the default theme entirely when override is true', () => {
		const defaultTheme = makeTheme();
		let result: string | undefined;
		inComponent(() => {
			const use = useComponentTheme('btnOverride', defaultTheme);
			const theme = use({ override: true, button: { base: 'shadow', size: { sm: 'font-bold' } } });
			result = theme.button({ size: 'sm' });
		});
		expect(result).toBe('shadow font-bold');
		expect(result).not.toContain('rounded');
	});

	it('merges a theme provided through context via setComponentTheme', () => {
		const defaultTheme = makeTheme();
		let result: string | undefined;
		inComponent(() => {
			setComponentTheme('btnCtx')({ button: { base: 'ring-1' } });
			const use = useComponentTheme('btnCtx', defaultTheme);
			result = use().button({ size: 'sm' });
		});
		expect(result).toBe('rounded text-sm ring-1');
	});

	it('merges context and local theme, concatenating base classes', () => {
		const defaultTheme = makeTheme();
		let result: string | undefined;
		inComponent(() => {
			setComponentTheme('btnBoth')({ button: { base: 'ring-1' } });
			const use = useComponentTheme('btnBoth', defaultTheme);
			result = use({ button: { base: 'shadow' } }).button({ size: 'sm' });
		});
		expect(result).toBe('rounded text-sm ring-1 shadow');
	});

	it('lets a later base override an earlier one on tailwind conflicts', () => {
		const defaultTheme = makeTheme();
		let result: string | undefined;
		inComponent(() => {
			const use = useComponentTheme('btnConflict', defaultTheme);
			result = use({ button: { base: 'rounded-lg' } }).button({ size: 'sm' });
		});
		expect(result).toBe('text-sm rounded-lg');
	});

	it('produces identical classes for every consumer of the same context theme', () => {
		const defaultTheme = makeTheme();
		const results: string[] = [];
		inComponent(() => {
			setComponentTheme('btnShared')({ button: { base: 'ring-1' } });
			const use = useComponentTheme('btnShared', defaultTheme);
			results.push(use().button({ size: 'sm' }), use().button({ size: 'sm' }));
		});
		expect(results[0]).toBe('rounded text-sm ring-1');
		expect(results[1]).toBe(results[0]);
	});

	it('applies the instance class after theme overrides', () => {
		const defaultTheme = makeTheme();
		let result: string | undefined;
		inComponent(() => {
			const use = useComponentTheme('btnInstance', defaultTheme);
			result = use({ button: { base: 'px-4' } }).button({ size: 'sm', class: 'px-8' });
		});
		expect(result).toBe('rounded text-sm px-8');
	});

	it('returns the shared default instance on the fast path', () => {
		const defaultTheme = makeTheme();
		let a: unknown, b: unknown;
		inComponent(() => {
			a = useComponentTheme('btnFastA', defaultTheme)();
			b = useComponentTheme('btnFastB', defaultTheme)();
		});
		expect(a).toBe(defaultTheme);
		expect(b).toBe(defaultTheme);
	});

	it('applies overrides keyed by boolean and numeric variant values', () => {
		const defaultTheme = {
			button: cva({
				base: 'rounded',
				variants: { loading: { true: 'opacity-50', false: '' }, depth: { 0: 'z-0', 1: 'z-10' } }
			})
		};
		let result: string | undefined;
		inComponent(() => {
			const use = useComponentTheme('btnBool', defaultTheme);
			const theme = use({ button: { loading: { true: 'grayscale' }, depth: { 0: 'shadow' } } });
			result = theme.button({ loading: true, depth: 0 });
		});
		expect(result).toBe('rounded opacity-50 z-0 grayscale shadow');
	});

	it('override only replaces the slots it mentions', () => {
		const defaultTheme = { ...makeTheme(), icon: cva({ base: 'size-4' }) };
		let root: string | undefined, icon: string | undefined;
		inComponent(() => {
			const use = useComponentTheme('btnSlots', defaultTheme);
			const theme = use({ override: true, button: { base: 'shadow' } });
			root = theme.button({ size: 'sm' });
			icon = theme.icon({});
		});
		expect(root).toBe('shadow');
		expect(icon).toBe('size-4');
	});

	it('lets a local variant class beat the context one on conflicts', () => {
		const defaultTheme = makeTheme();
		let result: string | undefined;
		inComponent(() => {
			setComponentTheme<typeof defaultTheme>('btnVariantOrder')({
				button: { size: { sm: 'p-2' } }
			});
			const use = useComponentTheme('btnVariantOrder', defaultTheme);
			result = use({ button: { size: { sm: 'p-4' } } }).button({ size: 'sm' });
		});
		expect(result).toBe('rounded text-sm p-4');
	});

	it('reads a theme from its exact component context', () => {
		const defaultTheme = makeTheme();
		let result: string | undefined;
		inComponent(() => {
			setComponentTheme('text-input')({
				button: { base: 'ring-1' }
			});
			const use = useComponentTheme('text-input', defaultTheme);
			result = use().button({ size: 'sm' });
		});
		expect(result).toBe('rounded text-sm ring-1');
	});
});
