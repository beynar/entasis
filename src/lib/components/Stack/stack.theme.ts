import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { layoutPaddingBlockClasses, layoutPaddingInlineClasses } from '../Layout/layoutSpacing.js';

// The stack lays itself out against ITS OWN width, not the viewport's, so `orientation`, `gap`,
// `align`, `justify` and `wrap` are no longer cva variants: each of them can hold a different
// value per container breakpoint, and a class name cannot carry five of them. Stack.svelte
// evaluates those props for all five steps and writes them as INTERNAL `--stack-<axis>-xs … -xl`
// custom properties on the layout element; the chains below read the property for the step the
// host's width actually matches. Those properties are wiring, not a consumer hook — the public way
// to change the layout is the props. That keeps the first painted frame — and the server-rendered HTML —
// already laid out, with no measurement and no JS.
//
// The literals are hand-written because Tailwind generates only the candidates it can scan in
// source text, so a chain built at runtime would produce no CSS at all. `stack.theme.test.ts`
// asserts each one still equals `responsiveContainerClasses(name, property, 'stack')`, so editing
// a width in `containerBreakpoints` fails the test until these follow.
const responsiveDirection =
	'[flex-direction:var(--stack-direction-xs)] ' +
	'@min-[36rem]/stack:[flex-direction:var(--stack-direction-sm)] ' +
	'@min-[42rem]/stack:[flex-direction:var(--stack-direction-md)] ' +
	'@min-[56rem]/stack:[flex-direction:var(--stack-direction-lg)] ' +
	'@min-[72rem]/stack:[flex-direction:var(--stack-direction-xl)]';

const responsiveGap =
	'[gap:var(--stack-gap-xs)] ' +
	'@min-[36rem]/stack:[gap:var(--stack-gap-sm)] ' +
	'@min-[42rem]/stack:[gap:var(--stack-gap-md)] ' +
	'@min-[56rem]/stack:[gap:var(--stack-gap-lg)] ' +
	'@min-[72rem]/stack:[gap:var(--stack-gap-xl)]';

const responsiveAlign =
	'[align-items:var(--stack-align-xs)] ' +
	'@min-[36rem]/stack:[align-items:var(--stack-align-sm)] ' +
	'@min-[42rem]/stack:[align-items:var(--stack-align-md)] ' +
	'@min-[56rem]/stack:[align-items:var(--stack-align-lg)] ' +
	'@min-[72rem]/stack:[align-items:var(--stack-align-xl)]';

const responsiveJustify =
	'[justify-content:var(--stack-justify-xs)] ' +
	'@min-[36rem]/stack:[justify-content:var(--stack-justify-sm)] ' +
	'@min-[42rem]/stack:[justify-content:var(--stack-justify-md)] ' +
	'@min-[56rem]/stack:[justify-content:var(--stack-justify-lg)] ' +
	'@min-[72rem]/stack:[justify-content:var(--stack-justify-xl)]';

const responsiveWrap =
	'[flex-wrap:var(--stack-wrap-xs)] ' +
	'@min-[36rem]/stack:[flex-wrap:var(--stack-wrap-sm)] ' +
	'@min-[42rem]/stack:[flex-wrap:var(--stack-wrap-md)] ' +
	'@min-[56rem]/stack:[flex-wrap:var(--stack-wrap-lg)] ' +
	'@min-[72rem]/stack:[flex-wrap:var(--stack-wrap-xl)]';

/**
 * The box the host sizes: it is the named `@container/stack` the chains above query, so it can
 * never be the element that carries them — a container query cannot style its own container.
 * `w-full min-w-0` is load-bearing: inline-size containment strips the root of its intrinsic
 * width, so a root left to shrink-to-fit inside a flex or grid parent would measure zero.
 * It is also the element the consumer addresses — `class`, `style`, the size props, the padding
 * and the scroll behaviour all land here, and the padding shrinks the queried width the same way
 * it shrinks the space the children get.
 */
const defaultStack = cva({
	base: '@container/stack flex w-full min-w-0',
	variants: {
		paddingInline: layoutPaddingInlineClasses,
		paddingBlock: layoutPaddingBlockClasses,
		scrollable: {
			true: 'overflow-auto',
			false: null
		}
	},
	defaultVariants: {
		scrollable: false
	}
});

/**
 * The flex line itself, the sole child of the root. `flex-1 min-w-0` makes it fill the root on
 * the inline axis and stretch to it on the block axis, so an explicit `height` or `minHeight` on
 * the root still governs where `justify` distributes and `align` aligns.
 */
const defaultStackInner = cva({
	base: [
		'flex min-w-0 flex-1',
		responsiveDirection,
		responsiveGap,
		responsiveAlign,
		responsiveJustify,
		responsiveWrap
	].join(' ')
});

export const stackTheme = {
	root: defaultStack,
	inner: defaultStackInner
};

export type StackTheme = typeof stackTheme;
export type StackThemeProps = InferComponentTheme<StackTheme>;
export const setStackTheme = setComponentTheme<StackTheme>('stack');
export const useStackTheme = useComponentTheme<StackTheme>('stack', stackTheme);
