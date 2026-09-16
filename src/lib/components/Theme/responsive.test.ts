import { describe, expect, it } from 'vitest';
import {
	breakpoints,
	containerBreakpoints,
	resolveContainerBreakpoint,
	resolveResponsive,
	responsiveContainerClasses,
	responsiveVariables,
	type ContainerBreakpoint
} from './responsive.js';

describe('containerBreakpoints', () => {
	it('is strictly increasing across the ladder above xs', () => {
		const rems = (breakpoints.filter((breakpoint) => breakpoint !== 'xs') as ContainerBreakpoint[])
			.map((breakpoint) => containerBreakpoints[breakpoint])
			.map((width) => Number.parseFloat(width));

		expect(rems).toHaveLength(4);
		for (const rem of rems) expect(Number.isFinite(rem)).toBe(true);
		for (let index = 1; index < rems.length; index++)
			expect(rems[index]).toBeGreaterThan(rems[index - 1]);
	});

	it('names a width in rem, so the JS threshold and the container query mean the same length', () => {
		for (const width of Object.values(containerBreakpoints)) expect(width).toMatch(/^[\d.]+rem$/);
	});

	it('has no entry for the xs floor', () => {
		expect(Object.keys(containerBreakpoints)).toStrictEqual(['sm', 'md', 'lg', 'xl']);
	});
});

describe('resolveResponsive — value form', () => {
	it('uses a plain value at every breakpoint', () => {
		for (const breakpoint of breakpoints) expect(resolveResponsive(3, breakpoint, 1)).toBe(3);
	});

	it('falls back only for undefined and null, never for a falsy value the caller passed', () => {
		expect(resolveResponsive(undefined, 'md', 'modal')).toBe('modal');
		expect(resolveResponsive(null, 'md', 'modal')).toBe('modal');
		expect(resolveResponsive(false, 'md', true)).toBe(false);
		expect(resolveResponsive(0, 'md', 4)).toBe(0);
		expect(resolveResponsive('', 'md', 'modal')).toBe('');
	});

	it('passes an object through when its keys are not breakpoints', () => {
		const transition = { in: { y: 4 }, out: { y: 0 } };
		expect(resolveResponsive(transition, 'lg', { in: { y: 0 }, out: { y: 0 } })).toBe(transition);

		const columns: { minWidth: number; max?: number } = { minWidth: 240, max: 4 };
		expect(resolveResponsive(columns, 'xs', { minWidth: 0 })).toBe(columns);
	});

	it('passes an array through rather than reading it as a record', () => {
		const value = [1, 2, 3];
		expect(resolveResponsive(value, 'md', [])).toBe(value);
	});
});

describe('resolveResponsive — record form', () => {
	it('takes the nearest defined key at or below the active breakpoint', () => {
		const props = { sm: 2, lg: 4 };
		expect(resolveResponsive(props, 'sm', 1)).toBe(2);
		expect(resolveResponsive(props, 'md', 1)).toBe(2);
		expect(resolveResponsive(props, 'lg', 1)).toBe(4);
		expect(resolveResponsive(props, 'xl', 1)).toBe(4);
	});

	it('falls back to the component default below the narrowest defined key', () => {
		expect(resolveResponsive({ md: 3 }, 'xs', 1)).toBe(1);
		expect(resolveResponsive({ md: 3 }, 'sm', 1)).toBe(1);
		expect(resolveResponsive({ md: 3 }, 'md', 1)).toBe(3);
	});

	it('honours an xs key as the floor for every wider breakpoint', () => {
		for (const breakpoint of breakpoints)
			expect(resolveResponsive({ xs: 9 }, breakpoint, 1)).toBe(9);
	});

	it('resolves an empty record to the fallback', () => {
		expect(resolveResponsive({}, 'xl', 1)).toBe(1);
	});

	it('never goes backwards as the container widens', () => {
		const props = { xs: 1, md: 2, xl: 3 };
		const resolved = breakpoints.map((breakpoint) => resolveResponsive(props, breakpoint, 0));
		expect(resolved).toStrictEqual([1, 1, 2, 2, 3]);
	});

	it('keeps a defined falsy value instead of skipping to a narrower key', () => {
		expect(resolveResponsive({ xs: true, md: false }, 'lg', true)).toBe(false);
	});
});

describe('resolveResponsive — a function is a plain value, not a form', () => {
	// The function form is gone: `ResponsiveProps<T>` is `T | Partial<Record<Breakpoint, T>>`, so a
	// callable only reaches this resolver when `T` is itself callable, and it must be handed back
	// untouched rather than invoked.
	it('returns a callable T unchanged instead of calling it', () => {
		const value = () => 'never called';
		expect(
			breakpoints.map((breakpoint) => resolveResponsive(value, breakpoint, value))
		).toStrictEqual(breakpoints.map(() => value));
	});
});

describe('resolveContainerBreakpoint', () => {
	it('names the step from the container width, matching the table', () => {
		expect(resolveContainerBreakpoint(360, 16)).toBe('xs');
		expect(resolveContainerBreakpoint(575, 16)).toBe('xs');
		expect(resolveContainerBreakpoint(576, 16)).toBe('sm');
		expect(resolveContainerBreakpoint(671, 16)).toBe('sm');
		expect(resolveContainerBreakpoint(672, 16)).toBe('md');
		expect(resolveContainerBreakpoint(895, 16)).toBe('md');
		expect(resolveContainerBreakpoint(896, 16)).toBe('lg');
		expect(resolveContainerBreakpoint(1151, 16)).toBe('lg');
		expect(resolveContainerBreakpoint(1152, 16)).toBe('xl');
	});

	it('flips on exactly the widths in the table, whatever they are', () => {
		for (const breakpoint of ['sm', 'md', 'lg', 'xl'] as const) {
			const rem = Number.parseFloat(containerBreakpoints[breakpoint]);
			expect(resolveContainerBreakpoint(rem * 16, 16)).toBe(breakpoint);
			expect(resolveContainerBreakpoint(rem * 16 - 1, 16)).not.toBe(breakpoint);
		}
	});

	it('scales with the document root font size, like rem in a container query', () => {
		expect(resolveContainerBreakpoint(576, 20)).toBe('xs');
		expect(resolveContainerBreakpoint(720, 20)).toBe('sm');
	});

	it('never falls below xs for a zero or unmeasured width', () => {
		expect(resolveContainerBreakpoint(0, 16)).toBe('xs');
	});
});

describe('responsiveVariables', () => {
	it('emits one property per breakpoint with the cascade already flattened', () => {
		expect(responsiveVariables('grid-columns', { sm: 2, lg: 4 }, 1)).toStrictEqual({
			'--grid-columns-xs': '1',
			'--grid-columns-sm': '2',
			'--grid-columns-md': '2',
			'--grid-columns-lg': '4',
			'--grid-columns-xl': '4'
		});
	});

	it('accepts a name written with or without the leading dashes', () => {
		expect(responsiveVariables('--gap', 4, 0)).toStrictEqual(responsiveVariables('gap', 4, 0));
	});

	it('formats each value through toCss, which also receives the breakpoint', () => {
		expect(
			responsiveVariables('gap', { xs: 8, lg: 24 }, 8, (value, breakpoint) =>
				breakpoint === 'xl' ? `${value * 2}px` : `${value}px`
			)
		).toStrictEqual({
			'--gap-xs': '8px',
			'--gap-sm': '8px',
			'--gap-md': '8px',
			'--gap-lg': '24px',
			'--gap-xl': '48px'
		});
	});

	it('flattens a record into one value per breakpoint', () => {
		expect(responsiveVariables('cols', { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }, 1)).toStrictEqual({
			'--cols-xs': '1',
			'--cols-sm': '2',
			'--cols-md': '3',
			'--cols-lg': '4',
			'--cols-xl': '5'
		});
	});

	it('fills every breakpoint from the fallback when the prop is absent', () => {
		expect(responsiveVariables('cols', undefined, 1)).toStrictEqual({
			'--cols-xs': '1',
			'--cols-sm': '1',
			'--cols-md': '1',
			'--cols-lg': '1',
			'--cols-xl': '1'
		});
	});
});

describe('responsiveContainerClasses', () => {
	it('declares the property at the base and again at every container width', () => {
		expect(responsiveContainerClasses('grid-columns', 'grid-template-columns')).toBe(
			'[grid-template-columns:var(--grid-columns-xs)] ' +
				'@min-[36rem]:[grid-template-columns:var(--grid-columns-sm)] ' +
				'@min-[42rem]:[grid-template-columns:var(--grid-columns-md)] ' +
				'@min-[56rem]:[grid-template-columns:var(--grid-columns-lg)] ' +
				'@min-[72rem]:[grid-template-columns:var(--grid-columns-xl)]'
		);
	});

	it('is built from containerBreakpoints, not from hand-written widths', () => {
		const classes = responsiveContainerClasses('gap', 'column-gap');
		for (const breakpoint of ['sm', 'md', 'lg', 'xl'] as const)
			expect(classes).toContain(
				`@min-[${containerBreakpoints[breakpoint]}]:[column-gap:var(--gap-${breakpoint})]`
			);
	});

	// The library bans viewport variants outright (tooling/check-semantic-theme-tokens.mjs): every
	// width query here has to be a `@`-prefixed CONTAINER variant, or a component styled from this
	// helper would reflow on the device instead of on the box it was handed.
	it('uses only container variants, never viewport ones', () => {
		const classes = responsiveContainerClasses('gap', 'column-gap');
		expect(classes).not.toMatch(/(?:^|\s)(?:min|max)-\[/);
		expect(classes).not.toMatch(/(?:^|\s)(?:max-)?(?:sm|md|lg|xl|2xl):/);
		for (const width of Object.values(containerBreakpoints))
			expect(classes).toContain(`@min-[${width}]:`);
	});

	it('accepts a name written with the leading dashes', () => {
		expect(responsiveContainerClasses('--gap', 'gap')).toBe(
			responsiveContainerClasses('gap', 'gap')
		);
	});

	it('queries a named container when one is given, so a consumer wrapper cannot capture it', () => {
		expect(responsiveContainerClasses('gap', 'column-gap', 'carousel')).toBe(
			'[column-gap:var(--gap-xs)] ' +
				'@min-[36rem]/carousel:[column-gap:var(--gap-sm)] ' +
				'@min-[42rem]/carousel:[column-gap:var(--gap-md)] ' +
				'@min-[56rem]/carousel:[column-gap:var(--gap-lg)] ' +
				'@min-[72rem]/carousel:[column-gap:var(--gap-xl)]'
		);
	});
});
