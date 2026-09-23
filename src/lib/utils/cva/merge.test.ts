import { describe, it, expect } from 'vitest';
import { defaultConfig } from 'cn/config';
import { cx } from './engine.js';
import { mergeConfig } from './merge.js';

/**
 * Conflict-resolution contract for the merge engine behind `cx`.
 *
 * These cases are the reason the library needs a tailwind-merge-class engine (now shadcn's `cn`) at
 * all: every one of them is a "last class wins" decision that a plain clsx
 * cannot make. The custom groups (raised-*, lift-*, h-control-*, h-row-*, size-icon-*,
 * duration-*, ease-*) and the semantic spacing scale (p-md, gap-layout-lg, ...)
 * are entasis utilities, so the engine must be configured to know about them.
 */
describe('cx conflict resolution', () => {
	describe('tailwind core scales', () => {
		it('resolves numeric spacing', () => {
			expect(cx('p-2', 'p-4')).toBe('p-4');
		});

		it('lets a shorthand override the axis utility before it', () => {
			expect(cx('px-2', 'p-4')).toBe('p-4');
		});

		it('resolves font size', () => {
			expect(cx('text-sm', 'text-lg')).toBe('text-lg');
		});

		it('resolves radius against an arbitrary value', () => {
			expect(cx('rounded-md', 'rounded-[var(--r)]')).toBe('rounded-[var(--r)]');
		});

		it('treats an opacity modifier as the same group', () => {
			expect(cx('bg-primary', 'bg-primary/20')).toBe('bg-primary/20');
		});
	});

	describe('entasis semantic spacing scale', () => {
		it('resolves semantic against semantic', () => {
			expect(cx('p-md', 'p-lg')).toBe('p-lg');
		});

		it('resolves numeric against semantic', () => {
			expect(cx('p-2', 'p-md')).toBe('p-md');
		});

		it('resolves layout-* spacing on margin and gap too', () => {
			expect(cx('m-xs', 'm-layout-lg')).toBe('m-layout-lg');
			expect(cx('gap-4', 'gap-micro')).toBe('gap-micro');
		});
	});

	describe('entasis custom utility groups', () => {
		it('resolves raised-* elevation', () => {
			expect(cx('raised-2', 'raised-4')).toBe('raised-4');
			expect(cx('raised-md', 'raised-none')).toBe('raised-none');
		});

		it('resolves lift-* elevation', () => {
			expect(cx('lift-2', 'lift-4')).toBe('lift-4');
			expect(cx('lift-md', 'lift-none')).toBe('lift-none');
			expect(cx('lift', 'lift-none')).toBe('lift-none');
		});

		it('resolves h-control-* sizing', () => {
			expect(cx('h-control-sm', 'h-control-lg')).toBe('h-control-lg');
		});

		it('resolves h-row-* and min-h-row-* densities', () => {
			expect(cx('h-row-sm', 'h-row-lg')).toBe('h-row-lg');
			expect(cx('min-h-row-sm', 'min-h-row-md')).toBe('min-h-row-md');
		});

		it('resolves size-icon-* sizing', () => {
			expect(cx('size-icon-sm', 'size-icon-lg')).toBe('size-icon-lg');
			expect(cx('size-icon-xs', 'size-icon-xl')).toBe('size-icon-xl');
		});

		it('resolves the bare raised utility', () => {
			expect(cx('raised', 'raised-none')).toBe('raised-none');
			expect(cx('raised-lg', 'raised')).toBe('raised');
		});

		it('resolves min-size-hit-* hit areas', () => {
			expect(cx('min-size-hit-sm', 'min-size-hit-lg')).toBe('min-size-hit-lg');
		});

		it('resolves ps-indent-* indents', () => {
			expect(cx('ps-indent-sm', 'ps-indent-lg')).toBe('ps-indent-lg');
		});

		it('resolves motion tokens', () => {
			expect(cx('duration-fast', 'duration-slow')).toBe('duration-slow');
			expect(cx('ease-enter', 'ease-exit')).toBe('ease-exit');
		});
	});

	describe('entasis plugin utilities the config must know about', () => {
		it('resolves viewport sizes against the core h-* and w-* groups', () => {
			expect(cx('h-full', 'h-window')).toBe('h-window');
			expect(cx('h-window', 'h-full')).toBe('h-full');
			expect(cx('w-screen', 'w-window')).toBe('w-window');
		});

		it('resolves scroll-fade axis forms and none, keeps combinable edges', () => {
			expect(cx('scroll-fade-x', 'scroll-fade-none')).toBe('scroll-fade-none');
			expect(cx('scroll-fade', 'scroll-fade-y')).toBe('scroll-fade-y');
			expect(cx('scroll-fade-t', 'scroll-fade-b')).toBe('scroll-fade-t scroll-fade-b');
			expect(cx('scroll-fade-s', 'scroll-fade-l')).toBe('scroll-fade-l');
			expect(cx('scroll-fade-t', 'scroll-fade-none')).toBe('scroll-fade-none');
			expect(cx('scroll-fade-static', 'scroll-fade-x')).toBe('scroll-fade-static scroll-fade-x');
		});

		it('resolves shimmer modes and parameter scales, keeps modifiers', () => {
			expect(cx('shimmer', 'shimmer-none')).toBe('shimmer-none');
			expect(cx('shimmer-once', 'shimmer-reverse')).toBe('shimmer-once shimmer-reverse');
			expect(cx('shimmer-color-primary', 'shimmer-color-neutral/40')).toBe(
				'shimmer-color-neutral/40'
			);
			expect(cx('shimmer-duration-1200', 'shimmer-duration-[3s]')).toBe('shimmer-duration-[3s]');
			expect(cx('shimmer-spread-2', 'shimmer-spread-4')).toBe('shimmer-spread-4');
			expect(cx('shimmer-angle-45', 'shimmer-angle-90')).toBe('shimmer-angle-90');
		});

		it('resolves the colour-role utilities against core colours', () => {
			expect(cx('bg-primary', 'bg-color')).toBe('bg-color');
			expect(cx('text-color-muted-readable', 'text-neutral')).toBe('text-neutral');
			expect(cx('ring-primary/50', 'ring-color/50')).toBe('ring-color/50');
			expect(cx('border-s-primary', 'border-s-color')).toBe('border-s-color');
			// The `selected` state role is a background colour like any other, so an override
			// written after it still wins.
			expect(cx('bg-primary', 'bg-selected-muted')).toBe('bg-selected-muted');
			expect(cx('bg-selected-muted', 'bg-primary')).toBe('bg-primary');
		});

		it('resolves rounded-<step>-concentric against the core corner groups', () => {
			// `rounded-md-concentric` is a radius: an override after it wins, and it overrides one
			// before it.
			expect(cx('rounded-lg', 'rounded-md-concentric')).toBe('rounded-md-concentric');
			expect(cx('rounded-md-concentric', 'rounded-lg')).toBe('rounded-lg');
			expect(cx('rounded-sm-concentric', 'rounded-md-concentric')).toBe('rounded-md-concentric');
			expect(cx('rounded-t-lg', 'rounded-t-md-concentric')).toBe('rounded-t-md-concentric');
			expect(cx('rounded-b-md-concentric', 'rounded-b-sm')).toBe('rounded-b-sm');
		});
	});

	describe('entasis utilities against the core groups they shadow', () => {
		it('resolves control heights against h-* and size-*', () => {
			expect(cx('h-control-md', 'h-9')).toBe('h-9');
			expect(cx('h-9', 'h-control-md')).toBe('h-control-md');
			expect(cx('h-control-md', 'size-8')).toBe('size-8');
		});

		it('resolves icon sizes against size-*, w-* and h-*', () => {
			expect(cx('size-4', 'size-icon-md')).toBe('size-icon-md');
			expect(cx('size-icon-md', 'size-4')).toBe('size-4');
			expect(cx('size-icon-md', 'h-5')).toBe('h-5');
		});

		it('resolves raised-* against shadow-*', () => {
			expect(cx('shadow-lg', 'raised-none')).toBe('raised-none');
			expect(cx('raised-lg', 'shadow-none')).toBe('shadow-none');
		});

		it('resolves lift-* against raised-* and shadow-*', () => {
			expect(cx('raised-3', 'lift-3')).toBe('lift-3');
			expect(cx('lift-3', 'raised-3')).toBe('raised-3');
			expect(cx('shadow-lg', 'lift-none')).toBe('lift-none');
			expect(cx('lift-lg', 'shadow-none')).toBe('shadow-none');
		});

		it('resolves row heights against h-*, size-* and the control scale', () => {
			expect(cx('h-row-md', 'h-10')).toBe('h-10');
			expect(cx('h-10', 'h-row-md')).toBe('h-row-md');
			expect(cx('h-control-md', 'h-row-md')).toBe('h-row-md');
			expect(cx('h-row-md', 'h-control-md')).toBe('h-control-md');
			expect(cx('min-h-row-md', 'min-h-0')).toBe('min-h-0');
			expect(cx('min-h-0', 'min-h-row-md')).toBe('min-h-row-md');
			expect(cx('min-size-hit-md', 'min-h-row-md')).toBe('min-h-row-md');
		});

		it('resolves hit areas against min-w-* and min-h-*', () => {
			expect(cx('min-size-hit-md', 'min-w-0')).toBe('min-w-0');
			expect(cx('min-w-0', 'min-size-hit-md')).toBe('min-size-hit-md');
		});

		it('resolves indents against the padding shorthands', () => {
			expect(cx('ps-indent-sm', 'ps-lg')).toBe('ps-lg');
			expect(cx('ps-indent-sm', 'p-lg')).toBe('p-lg');
			expect(cx('ps-lg', 'ps-indent-sm')).toBe('ps-indent-sm');
		});

		// `duration` / `ease` extend the built-in groups rather than declaring a conflict,
		// so this is the pair that would silently stop resolving if that ever changed —
		// and an instance `duration-200` would then lose to a theme's `duration-fast`.
		it('resolves motion tokens against the core duration-* and ease-* groups', () => {
			expect(cx('duration-200', 'duration-fast')).toBe('duration-fast');
			expect(cx('duration-fast', 'duration-200')).toBe('duration-200');
			expect(cx('duration-fast', 'duration-[250ms]')).toBe('duration-[250ms]');
			expect(cx('ease-out', 'ease-standard')).toBe('ease-standard');
			expect(cx('ease-standard', 'ease-out')).toBe('ease-out');
		});
	});

	describe('clsx input shapes', () => {
		it('flattens arrays, objects and skips undefined', () => {
			expect(cx(['a', { b: true, c: false }], undefined, 'd')).toBe('a b d');
		});
	});
});

/**
 * Drift guard: every utility family the Tailwind plugin registers must either be
 * covered by a core tailwind-merge group (the colour-role utilities resolve through
 * the built-in colour validator) or be declared in merge.ts. A new plugin utility
 * that lands without a merge group would silently stop obeying "last class wins".
 */
describe('plugin utility coverage', () => {
	it('declares a merge group for every plugin utility family', async () => {
		// Vite serves the sources as raw strings, so no node types are needed here.
		const pluginSources = import.meta.glob('../../tailwind/*.ts', {
			query: '?raw',
			import: 'default',
			eager: true
		}) as Record<string, string>;
		const mergeSource = (await import('./merge.ts?raw')).default as string;
		const families = new Set<string>();
		for (const [file, source] of Object.entries(pluginSources)) {
			if (file.endsWith('.test.ts')) continue;
			for (const match of source.matchAll(
				/'\.([a-z][a-z-]*?)(?:-(?:sm|md|lg|xl|x|y|t|b|s|e|l|r|none|static|once|reverse|window|\$\{[^}]+\}))?'/g
			))
				families.add(match[1]);
			for (const match of source.matchAll(/^\s*'?([a-z][a-z-]+)'?:\s*\(value/gm))
				families.add(match[1]);
			for (const match of source.matchAll(/\.\.\.sizedUtilities\('([a-z-]+)'/g))
				families.add(match[1]);
		}
		// Resolved by tailwind-merge's own groups: colour roles are `<util>-<colour>` values.
		const coreCovered = new Set([
			// The `selected` STATE ROLE family is spelled `bg-selected`/`bg-selected-muted`, which the
			// core `bg` colour group already resolves — `bg-primary bg-selected-muted` collapses to
			// the last one, which is the whole point of listing it here rather than shadowing it.
			'bg-selected',
			'text-color',
			'bg-color',
			'ring-color',
			'ring-offset-color',
			'border-color',
			'border-top-color',
			'border-right-color',
			'border-bottom-color',
			'border-left-color',
			'border-s-color',
			'border-e-color',
			'shadow-color',
			'gap',
			'gap-x',
			'gap-y',
			'p',
			'px',
			'py',
			'pt',
			'pb',
			'pl',
			'pr',
			'ps',
			'pe',
			'm',
			'mx',
			'my',
			'mt',
			'mb',
			'ml',
			'mr',
			'ms',
			'me',
			'inset',
			'inset-x',
			'inset-y',
			'top',
			'bottom',
			'left',
			'right',
			'start',
			'end',
			'space-x',
			'space-y',
			'duration',
			'ease',
			'ui-spinner'
		]);
		// Edge forms (`scroll-fade-t`, `-s`, ...) belong to the family they suffix — including the
		// ones where the edge sits in the middle of the name (`rounded-t-md-concentric` is the top-corner
		// form of `rounded-md-concentric`, because Tailwind's corner utilities name the edge first).
		const normalised = new Set(
			[...families].map((family) =>
				family
					.replace(/-(?:t|b|s|e|l|r)$/, '')
					.replace(/^rounded-(?:t|b|s|e|l|r|tl|tr|br|bl|ss|se|ee|es)-/, 'rounded-')
			)
		);
		const uncovered = [...normalised].filter(
			(family) =>
				!coreCovered.has(family) &&
				!new RegExp(`['"\`]${family}['"\`]|'${family}':|\\b${family}:`).test(mergeSource)
		);
		expect(uncovered).toEqual([]);
	});
});

/**
 * The guarantee the theming docs make in "Switching a house utility off": a consumer's plain
 * Tailwind class beats the entasis utility it targets, whichever comes first, and a utility that
 * is not a plain class (`state-layer`, `shimmer`, `scroll-fade-*`) carries its own `none`.
 * Read off the registered config, so the rule holds for the next token added, not just today's.
 */
describe('house class groups stay overridable', () => {
	const core = new Set(Object.keys(defaultConfig().classGroups));
	const house: Record<string, unknown> = mergeConfig.extend.classGroups;
	const conflicts: Record<string, readonly string[]> = mergeConfig.extend.conflictingClassGroups;
	const hasOffSwitch = (group: string) => /"(?:none|0)"|-none"/.test(JSON.stringify(house[group]));
	const switchable = Object.keys(house).filter(hasOffSwitch);

	it('every registered group yields to a Tailwind group or has an off switch', () => {
		const offenders = Object.keys(house).filter(
			(group) =>
				!core.has(group) &&
				!(conflicts[group] ?? []).some((other) => core.has(other)) &&
				!switchable.some((parent) => group === parent || group.startsWith(`${parent}-`))
		);
		expect(offenders).toEqual([]);
	});

	it('declares every conflict with a Tailwind group in both directions', () => {
		const oneWay = Object.keys(house).flatMap((group) =>
			(conflicts[group] ?? [])
				.filter((other) => core.has(other) && !(conflicts[other] ?? []).includes(group))
				.map((other) => `${group} -> ${other}`)
		);
		expect(oneWay).toEqual([]);
	});

	it.each([
		['h-control-md', 'h-9'],
		['h-9', 'h-control-md'],
		['min-h-row-md', 'min-h-12'],
		['px-md', 'px-3'],
		['gap-micro', 'gap-2'],
		['p-layout-lg', 'p-8'],
		['rounded-md-concentric', 'rounded-lg'],
		['size-icon-md', 'size-6'],
		['[&_svg]:size-icon-md', '[&_svg]:size-6'],
		['raised-2', 'shadow-none'],
		['lift-1', 'shadow-xl'],
		['duration-normal', 'duration-150'],
		['ease-enter', 'ease-out'],
		['bg-color', 'bg-blue-500'],
		['text-color-contrast', 'text-white'],
		['bg-surface-raised', 'bg-white'],
		['border-neutral-muted', 'border-gray-200'],
		['state-layer', 'state-layer-none'],
		['state-layer-none', 'state-layer']
	])('%s then %s keeps only the later one', (first, second) => {
		expect(cx(first, second)).toBe(second);
	});
});
