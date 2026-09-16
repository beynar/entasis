import { describe, expect, it } from 'vitest';
import { motion, resolveMotionTokens, type MotionTheme } from './index.js';

const theme = (overrides?: Partial<MotionTheme>): MotionTheme => ({
	motion: resolveMotionTokens(),
	preferReducesMotion: false,
	...overrides
});

const drawer = motion({
	base: {
		in: { x: 0, y: 0, scale: 0.98, opacity: 0 },
		out: { x: 0, y: 0, scale: 0.98, opacity: 0 },
		duration: 'normal',
		easing: 'standard'
	},
	variants: {
		type: {
			modal: {},
			drawerRight: { in: { x: '100%' }, out: { x: '100%' } },
			sheet: { in: { y: '100%', scale: 1, opacity: 1 }, out: { y: '100%', scale: 1, opacity: 1 } },
			swift: { duration: 'fast', easing: 'enter' }
		}
	},
	defaultVariants: { type: 'modal' }
});

describe('motion()', () => {
	it('resolves the base spec and its default variant against the Theme tokens', () => {
		expect(drawer(undefined, { theme: theme() })).toEqual({
			in: { x: 0, y: 0, scale: 0.98, opacity: 0, duration: 200, easing: 'cubicInOut' },
			out: { x: 0, y: 0, scale: 0.98, opacity: 0, duration: 200, easing: 'cubicInOut' }
		});
	});

	it('deep-merges the matched variant over the base, per direction', () => {
		const { in: enter, out: exit } = drawer({ type: 'drawerRight' }, { theme: theme() });
		// Only `x` comes from the variant; `y`, `scale` and `opacity` survive from the base.
		expect(enter).toMatchObject({ x: '100%', y: 0, scale: 0.98, opacity: 0 });
		expect(exit).toMatchObject({ x: '100%', y: 0, scale: 0.98, opacity: 0 });
	});

	it('lets a variant replace base leaves it names', () => {
		expect(drawer({ type: 'sheet' }, { theme: theme() }).in).toMatchObject({
			y: '100%',
			scale: 1,
			opacity: 1
		});
	});

	it('resolves duration tokens to ms and easing roles to easing function names', () => {
		const swift = drawer({ type: 'swift' }, { theme: theme() });
		expect(swift.in.duration).toBe(100);
		expect(swift.in.easing).toBe('cubicOut');
		expect(swift.out.duration).toBe(100);
	});

	it('follows a retuned Theme motion scale', () => {
		const retuned = theme({
			motion: resolveMotionTokens({ duration: { normal: 50 }, easing: { standard: 'expoOut' } })
		});
		expect(drawer(undefined, { theme: retuned }).in).toMatchObject({
			duration: 50,
			easing: 'expoOut'
		});
	});

	it('accepts an explicit duration in ms and a raw easing name', () => {
		const explicit = drawer(undefined, {
			theme: theme(),
			overrides: { duration: 333, easing: 'backInOut' }
		});
		expect(explicit.in).toMatchObject({ duration: 333, easing: 'backInOut' });
	});

	it('keeps a per-direction duration/easing over the spec tokens', () => {
		const perSide = drawer(undefined, {
			theme: theme(),
			overrides: { in: { duration: 12, easing: 'linear' } }
		});
		expect(perSide.in).toMatchObject({ duration: 12, easing: 'linear' });
		expect(perSide.out).toMatchObject({ duration: 200, easing: 'cubicInOut' });
	});

	it('applies overrides lowest priority first', () => {
		const laddered = drawer(
			{ type: 'drawerRight' },
			{
				theme: theme(),
				overrides: [
					{ duration: 'slow', in: { scale: 0.5 } },
					{ duration: 'slower' },
					undefined,
					{ in: { scale: 0.25 } }
				]
			}
		);
		expect(laddered.in).toMatchObject({ x: '100%', scale: 0.25, duration: 500 });
		expect(laddered.out).toMatchObject({ x: '100%', scale: 0.98, duration: 500 });
	});

	it('lets a transition side replace the merged one, flat form replacing both', () => {
		const replaced = drawer(
			{ type: 'drawerRight' },
			{ theme: theme(), transition: { in: { y: 24 }, out: { duration: 0 } } }
		);
		// The named side replaces the preset outright, then picks the tokens back up.
		expect(replaced.in).toEqual({ y: 24, duration: 200, easing: 'cubicInOut' });
		expect(replaced.out).toEqual({ duration: 0, easing: 'cubicInOut' });
		// The flat form (no `in` / `out` key) applies to both directions, the semantics
		// `ThemeState.splitTransition` gave the props it replaced.
		const flat = drawer({ type: 'drawerRight' }, { theme: theme(), transition: { y: 24 } });
		expect(flat.in).toEqual({ y: 24, duration: 200, easing: 'cubicInOut' });
		expect(flat.out).toEqual({ y: 24, duration: 200, easing: 'cubicInOut' });
		const flatTiming = drawer(
			{ type: 'drawerRight' },
			{ theme: theme(), transition: { duration: 500 } }
		);
		expect(flatTiming.in.duration).toBe(500);
		expect(flatTiming.out.duration).toBe(500);
	});

	it('collapses every duration to 0 when motion must be reduced', () => {
		const reduced = theme({ preferReducesMotion: true });
		const resolved = drawer(
			{ type: 'swift' },
			{
				theme: reduced,
				overrides: { in: { duration: 400 } },
				transition: { out: { duration: 90 } }
			}
		);
		expect(resolved.in.duration).toBe(0);
		expect(resolved.out.duration).toBe(0);
	});

	it('falls back to the library scale when no Theme is passed', () => {
		expect(drawer().in).toMatchObject({ duration: 200, easing: 'cubicInOut' });
	});

	it('never mutates the config it was built from', () => {
		const preset = motion({ base: { in: { scale: 0.9 }, out: { scale: 0.9 } } });
		preset(undefined, { theme: theme(), overrides: { in: { scale: 0.1 } } });
		expect(preset(undefined, { theme: theme() }).in.scale).toBe(0.9);
	});
});

describe('resolveMotionTokens()', () => {
	it('fills omitted tokens with the defaults', () => {
		expect(resolveMotionTokens({ duration: { fast: 42 } })).toEqual({
			duration: { instant: 0, fast: 42, normal: 200, slow: 300, slower: 500 },
			easing: { standard: 'cubicInOut', enter: 'cubicOut', exit: 'cubicIn', emphasized: 'backOut' }
		});
	});

	it('rejects an unknown easing name and a negative duration', () => {
		expect(() => resolveMotionTokens({ easing: { standard: 'nope' as 'linear' } })).toThrow(
			/easing/
		);
		expect(() => resolveMotionTokens({ duration: { fast: -1 } })).toThrow(/duration/);
	});
});
