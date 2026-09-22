import { describe, it, expect } from 'vitest';
import { setContext } from 'svelte';
import { render } from '@testing-library/svelte';
import { cva } from './engine.js';
import { setComponentTheme, useComponentTheme, bindTheme } from './theme.js';
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

	// The `<Theme components>` registry is rung 2 of the ladder, under a `set*Theme`
	// subtree — it layers, it is not replaced by it. `useComponentMotion` resolves the
	// `motion` slot through the same three rungs.
	const withRegistry = (component: string, entry: Record<string, unknown>, fn: () => void) =>
		inComponent(() => {
			setContext('entasisTheme', { componentThemes: { [component]: entry } });
			fn();
		});

	it('merges a theme provided through the <Theme components> registry', () => {
		const defaultTheme = makeTheme();
		let result: string | undefined;
		withRegistry('btnRegistry', { button: { base: 'ring-1' } }, () => {
			const use = useComponentTheme('btnRegistry', defaultTheme);
			result = use().button({ size: 'sm' });
		});
		expect(result).toBe('rounded text-sm ring-1');
	});

	it('keeps the registry underneath a subtree set*Theme instead of dropping it', () => {
		const defaultTheme = { ...makeTheme(), icon: cva({ base: 'size-4' }) };
		let root: string | undefined, icon: string | undefined;
		withRegistry('btnRegistryCtx', { button: { base: 'ring-1' }, icon: { base: 'size-5' } }, () => {
			setComponentTheme('btnRegistryCtx')({ button: { base: 'shadow' } });
			const theme = useComponentTheme('btnRegistryCtx', defaultTheme)();
			root = theme.button({ size: 'sm' });
			icon = theme.icon({});
		});
		// Registry first, subtree second: the subtree wins a conflict but never erases the
		// slot it did not mention.
		expect(root).toBe('rounded text-sm ring-1 shadow');
		expect(icon).toBe('size-5');
	});

	it('honours override declared on the registry entry', () => {
		const defaultTheme = makeTheme();
		let result: string | undefined;
		withRegistry('btnRegistryOverride', { override: true, button: { base: 'shadow' } }, () => {
			result = useComponentTheme('btnRegistryOverride', defaultTheme)().button({ size: 'sm' });
		});
		expect(result).toBe('shadow');
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

describe('bindTheme', () => {
	const makeSlots = () => ({
		root: cva({
			base: 'rounded px-4',
			variants: { size: { sm: 'text-sm', lg: 'text-lg' }, tone: { loud: 'font-bold' } },
			defaultVariants: { size: 'sm' }
		}),
		icon: cva({ base: 'shrink-0', variants: { size: { sm: 'size-4', lg: 'size-5' } } }),
		motion: (() => ({})) as never
	});

	it('hands the shared props to every class slot', () => {
		const slots = bindTheme(makeSlots(), { size: 'lg', tone: 'loud' });
		expect(slots.root()).toBe('rounded px-4 text-lg font-bold');
		// `icon` declares no `tone`; it takes `size` and ignores the rest, as cva always has.
		expect(slots.icon()).toBe('shrink-0 size-5');
	});

	it('lets a slot override a shared prop and lands its class last', () => {
		const slots = bindTheme(makeSlots(), { size: 'lg' });
		expect(slots.root({ size: 'sm', className: 'px-8' })).toBe('rounded text-sm px-8');
		expect(slots.icon({ class: 'size-6' })).toBe('shrink-0 size-6');
	});

	it('skips the reserved motion slot', () => {
		const slots = bindTheme(makeSlots(), {});
		expect('motion' in slots).toBe(false);
		expect(Object.keys(slots)).toEqual(['root', 'icon']);
	});

	it('binds through the second resolver argument and reaches a themed slot', () => {
		const defaultTheme = makeSlots();
		let icon: string | undefined;
		inComponent(() => {
			// An override keyed on `size` for the icon: with per-slot calls it only applied when the
			// component remembered to pass `size` to the icon; bound, every slot sees it.
			setComponentTheme<typeof defaultTheme>('btnBind')({ icon: { size: { lg: 'ring-1' } } });
			const slots = useComponentTheme('btnBind', defaultTheme)(undefined, { size: 'lg' });
			icon = slots.icon();
		});
		expect(icon).toBe('shrink-0 size-5 ring-1');
	});
});
