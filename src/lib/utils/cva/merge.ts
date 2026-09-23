/**
 * The class-join + conflict-resolution step behind `cx`/`cva`, on shadcn's `cn`
 * engine (a `clsx` + `tailwind-merge` replacement with the same config shape;
 * cold merges run about 2.5x faster, warm ones hit the same cache).
 *
 * The engine is configured with the library's own utilities so that the
 * "last class wins" rule holds for them too:
 *   - `raised-*`      elevation (bordered) and `lift-*` (shadow only)
 *   - `h-control-*`   control heights
 *   - `h-row-*` / `min-h-row-*` row densities
 *   - `size-icon-*`   icon sizes
 *   - `min-size-hit-*` minimum hit areas
 *   - `ps-indent-*`  nesting indents
 *   - `h-window` / `w-window` viewport sizes (join the core `h` / `w` groups)
 *   - `scroll-fade*` masks (axis forms and `none` exclude each other and clear
 *     earlier edge forms; edge forms combine; `static` is a modifier)
 *   - `shimmer*` (`shimmer` / `shimmer-none` exclude each other; `once` and
 *     `reverse` are modifiers; `shimmer-color|duration|spread|angle-*` are scales)
 *   - `state-layer` / `state-layer-none` exclude each other
 *   - `rounded-<step>-concentric` / `rounded-t|b-<step>-concentric` (join the core corner groups), the container side
 *     needing nothing here — a `rounded-<step>` publishes its radius to its children by itself
 *   - `duration-*` / `ease-*` motion tokens
 *   - the semantic spacing scale (`p-md`, `gap-layout-lg`, ...) registered on
 *     the `spacing` theme scale so it conflicts with Tailwind's numeric one.
 *
 * Each group also declares the core groups it shadows in both directions, so a
 * plain `h-9` overrides an earlier `h-control-md` (and vice versa) instead of
 * both surviving and letting the compiled source order decide.
 *
 * `createCn` already accepts the object form (`{ active: true }`), arrays and
 * falsy values, so no separate clsx pass is needed.
 */

import { createCn, validators, type CreateCnInput } from 'cn/config';
import type { ClassValue } from './types.js';

const isConcentric = (value: string) => /^(?:xs|sm|md|lg|xl|2xl|3xl|4xl)-concentric$/.test(value);

/** Semantic spacing values usable wherever Tailwind accepts a spacing value. */
const SEMANTIC_SPACING = [
	'micro',
	'xs',
	'sm',
	'md',
	'lg',
	'xl',
	'layout-sm',
	'layout-md',
	'layout-lg',
	'layout-xl'
];

export const mergeConfig = {
	extend: {
		theme: {
			spacing: SEMANTIC_SPACING
		},
		classGroups: {
			raised: [
				'raised',
				{ raised: ['none', '0', '1', '2', '3', '4', '5', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] }
			],
			lift: [
				'lift',
				{ lift: ['none', '0', '1', '2', '3', '4', '5', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] }
			],
			'h-control': [{ 'h-control': ['sm', 'md', 'lg'] }],
			'h-row': [{ 'h-row': ['sm', 'md', 'lg'] }],
			'min-h-row': [{ 'min-h-row': ['sm', 'md', 'lg'] }],
			'size-icon': [{ 'size-icon': ['xs', 'sm', 'md', 'lg', 'xl'] }],
			'min-size-hit': [{ 'min-size-hit': ['sm', 'md', 'lg'] }],
			'ps-indent': [{ 'ps-indent': ['sm', 'md', 'lg', 'xl'] }],
			duration: [{ duration: ['instant', 'fast', 'normal', 'slow', 'slower'] }],
			ease: [{ ease: ['standard', 'enter', 'exit', 'emphasized'] }],
			h: [{ h: ['window'] }],
			w: [{ w: ['window'] }],
			'scroll-fade': ['scroll-fade', { 'scroll-fade': ['x', 'y', 'none'] }],
			'scroll-fade-t': ['scroll-fade-t'],
			'scroll-fade-b': ['scroll-fade-b'],
			'scroll-fade-start': [{ 'scroll-fade': ['s', 'l'] }],
			'scroll-fade-end': [{ 'scroll-fade': ['e', 'r'] }],
			shimmer: ['shimmer', 'shimmer-none'],
			// The overlay is a ::before, so only its own off switch can remove it.
			'state-layer': ['state-layer', 'state-layer-none'],
			'shimmer-color': [{ 'shimmer-color': [validators.isAny] }],
			'shimmer-duration': [{ 'shimmer-duration': [validators.isAny] }],
			'shimmer-spread': [{ 'shimmer-spread': [validators.isAny] }],
			'shimmer-angle': [{ 'shimmer-angle': [validators.isAny] }],
			// `rounded-md-concentric` is a radius like any other, so it joins the core corner groups
			// and last-wins against `rounded-lg`.
			rounded: [{ rounded: [isConcentric] }],
			'rounded-t': [{ 'rounded-t': [isConcentric] }],
			'rounded-b': [{ 'rounded-b': [isConcentric] }]
		},
		conflictingClassGroups: {
			// `raised-*`, `lift-*` and `shadow-*` all own the `--tw-shadow` slot.
			raised: ['shadow', 'lift'],
			lift: ['shadow', 'raised'],
			shadow: ['raised', 'lift'],
			// `h-control-*` and `h-row-*` set `height`, `size-icon-*` sets both axes.
			'h-control': ['h', 'size', 'h-row'],
			'h-row': ['h', 'size', 'h-control'],
			h: ['h-control', 'h-row', 'size-icon'],
			'size-icon': ['w', 'h', 'size'],
			w: ['size-icon'],
			size: ['h-control', 'h-row', 'size-icon'],
			// `min-size-hit-*` sets `min-width` + `min-height`, `min-h-row-*` only the height.
			'min-size-hit': ['min-w', 'min-h', 'min-h-row'],
			'min-h-row': ['min-h', 'min-size-hit'],
			'min-w': ['min-size-hit'],
			'min-h': ['min-size-hit', 'min-h-row'],
			// `ps-indent-*` sets `padding-inline-start`.
			'ps-indent': ['ps', 'px', 'p'],
			ps: ['ps-indent'],
			px: ['ps-indent'],
			p: ['ps-indent'],
			// An axis form or `none` after an edge form replaces the whole mask.
			'scroll-fade': ['scroll-fade-t', 'scroll-fade-b', 'scroll-fade-start', 'scroll-fade-end']
		}
	}
} satisfies CreateCnInput;
const merge = createCn(mergeConfig);

export const cn = (...inputs: ClassValue[]): string =>
	merge(...(inputs as Parameters<typeof merge>));
