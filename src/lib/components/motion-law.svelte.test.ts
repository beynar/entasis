// Motion laws every component that owns a transition must obey: the Theme's motion
// tokens are the single scale, and a component's `motion` theme slot overrides through
// the same ladder its class slots do. Test names start with a stable id
// (`motion:<component>.<law>`), like the accessibility laws next door.
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import MotionLawHarness from './MotionLawHarness.test.svelte';
import type { ComponentProps } from 'svelte';
import { resolveMotionTokens } from '$lib/utils/motion/index.js';
import { compileThemeDesignTokens } from './Theme/theme.designTokens.js';
import { defaultAccordionMotion } from './Accordion/accordion.theme.js';
import { defaultChartMotion } from './Chart/chart.theme.js';
import { defaultCollapsibleMotion } from './Collapsible/collapsible.theme.js';
import { defaultFloatingWindowMotion } from './FloatingWindow/floatingWindow.theme.js';
import { defaultHoverCardMotion } from './HoverCard/hoverCard.theme.js';
import { defaultImageGalleryMotion } from './ImageGallery/imageGallery.theme.js';
import { defaultImageZoomMotion } from './ImageZoom/imageZoom.theme.js';
import { defaultNetworkIndicatorMotion } from './NetworkIndicator/networkIndicator.theme.js';
import { defaultSpinnerTextMotion } from './SpinnerText/spinnerText.theme.js';
import { defaultStepperMotion } from './Stepper/stepper.theme.js';
import { defaultTabsMotion } from './Tabs/tabs.theme.js';
import { defaultToastMotion } from './Toast/toast.theme.js';
import { defaultTooltipMotion } from './Tooltip/tooltip.theme.js';

const resolved = (props: ComponentProps<typeof MotionLawHarness> = {}) => {
	const { unmount } = render(MotionLawHarness, { props });
	const read = (id: string) => screen.getByTestId(id).textContent;
	const snapshot = {
		inDuration: Number(read('in-duration')),
		outDuration: Number(read('out-duration')),
		inEasing: read('in-easing'),
		inX: read('in-x'),
		inScale: read('in-scale')
	};
	unmount();
	return snapshot;
};

describe('dialog motion', () => {
	test('motion:dialog.default-preset resolves the type preset against the Theme tokens', () => {
		expect(resolved()).toMatchObject({
			inDuration: 200,
			outDuration: 200,
			inEasing: 'cubicInOut',
			inScale: '0.98'
		});
		// The per-type variant still decides the geometry.
		expect(resolved({ type: 'drawerRight' }).inX).toBe('100%');
	});

	test('motion:theme.tokens a Theme motion scale retunes the resolved duration', () => {
		expect(resolved({ motion: { duration: { normal: 50 } } })).toMatchObject({
			inDuration: 50,
			outDuration: 50
		});
		expect(resolved({ motion: { easing: { standard: 'expoOut' } } }).inEasing).toBe('expoOut');
	});

	test('motion:theme.design-tokens the active theme motion block retunes the resolved duration', () => {
		// The CSS variables and the JS scale have to agree: a `designTokens.<theme>.motion`
		// block moves `--duration-*` *and* every `motion()` preset.
		expect(
			resolved({
				forcedTheme: 'dark',
				designTokens: { dark: { motion: { duration: { normal: 33 } } } }
			})
		).toMatchObject({ inDuration: 33, outDuration: 33 });
	});

	test('motion:theme.transition-flat a flat transition prop retunes both directions', () => {
		expect(resolved({ transition: { duration: 77 } })).toMatchObject({
			inDuration: 77,
			outDuration: 77
		});
	});

	test('motion:theme.components the registry beats the component default', () => {
		expect(resolved({ components: { dialog: { motion: { duration: 'slow' } } } }).inDuration).toBe(
			300
		);
	});

	test('motion:dialog.set-theme setDialogTheme beats the Theme components registry', () => {
		expect(
			resolved({
				components: { dialog: { motion: { duration: 'slow' } } },
				scopedMotion: { duration: 'slower' }
			}).inDuration
		).toBe(500);
	});

	test('motion:dialog.theme-prop the instance theme.motion beats the subtree', () => {
		expect(
			resolved({
				components: { dialog: { motion: { duration: 'slow' } } },
				scopedMotion: { duration: 'slower' },
				theme: { motion: { duration: 'fast' } }
			}).inDuration
		).toBe(100);
	});

	test('motion:dialog.transition-prop the instance transition prop beats every override', () => {
		expect(
			resolved({
				motion: { duration: { normal: 50 } },
				components: { dialog: { motion: { duration: 'slow' } } },
				scopedMotion: { duration: 'slower' },
				theme: { motion: { duration: 'fast' } },
				transition: { in: { duration: 7 }, out: { duration: 9 } }
			})
		).toMatchObject({ inDuration: 7, outDuration: 9 });
	});

	test('motion:theme.reduce-motion every resolved duration collapses to 0', () => {
		expect(
			resolved({
				reduceMotion: true,
				components: { dialog: { motion: { duration: 'slow' } } },
				transition: { in: { duration: 7 }, out: { duration: 9 } }
			})
		).toMatchObject({ inDuration: 0, outDuration: 0 });
	});
});

// Every component that used to hardcode its timing now owns a `motion()` preset. These
// laws pin the two properties that make the slot worth having: the tokens decide the
// duration, and a reduced-motion preference zeroes it — without rendering anything.
describe('component motion presets', () => {
	const scale = resolveMotionTokens({
		duration: { instant: 0, fast: 11, normal: 22, slow: 33, slower: 44 }
	});
	const theme = { motion: scale, preferReducesMotion: false };
	const reduced = { motion: scale, preferReducesMotion: true };

	const presets = [
		['toast', defaultToastMotion, undefined, 22],
		['tooltip', defaultTooltipMotion, undefined, 11],
		['hover-card', defaultHoverCardMotion, undefined, 11],
		['accordion', defaultAccordionMotion, undefined, 22],
		['collapsible', defaultCollapsibleMotion, undefined, 22],
		['collapsible.peek', defaultCollapsibleMotion, { variant: 'peek' }, 33],
		['stepper', defaultStepperMotion, undefined, 33],
		['tabs', defaultTabsMotion, undefined, 33],
		['floating-window', defaultFloatingWindowMotion, undefined, 33],
		['image-zoom', defaultImageZoomMotion, undefined, 44],
		['image-gallery', defaultImageGalleryMotion, undefined, 22],
		['spinnerText', defaultSpinnerTextMotion, undefined, 33],
		['spinnerText.reveal', defaultSpinnerTextMotion, { mode: 'reveal' }, 44],
		['networkIndicator', defaultNetworkIndicatorMotion, undefined, 33],
		['networkIndicator.trail', defaultNetworkIndicatorMotion, { variant: 'trail' }, 44],
		[
			'networkIndicator.trail-bounce',
			defaultNetworkIndicatorMotion,
			{ variant: 'trail-bounce' },
			44
		],
		['chart', defaultChartMotion, undefined, 33]
	] as const;

	test.each(presets)(
		'motion:%s.token-scale the Theme duration scale decides the resolved duration',
		(_name, preset, props, expected) => {
			const resolver = preset as (p?: unknown, o?: unknown) => { in: { duration?: number } };
			expect(resolver(props, { theme }).in.duration).toBe(expected);
			expect(resolver(props, { theme: reduced }).in.duration).toBe(0);
		}
	);

	test('motion:toast.position-variants each position flies in from its own edge', () => {
		expect(defaultToastMotion({ position: 'top-left' }, { theme }).in).toMatchObject({
			x: -100,
			y: -100
		});
		expect(defaultToastMotion({ position: 'banner-bottom' }, { theme }).out).toMatchObject({
			y: '100%'
		});
	});

	test('motion:accordion.axis-variant the axis variant reaches both slide directions', () => {
		const horizontal = defaultAccordionMotion({ axis: 'x' }, { theme });
		expect(horizontal.in.axis).toBe('x');
		expect(horizontal.out.axis).toBe('x');
		expect(defaultAccordionMotion(undefined, { theme }).in.axis).toBe('y');
	});
});

// The CSS half of the scale. `<Theme motion>` used to move only the Svelte transitions,
// leaving `duration-*` / `ease-*` utilities on the build-time numbers.
describe('motion css variables', () => {
	test('motion:theme.css the motion prop rewrites the scale on html', () => {
		const css = compileThemeDesignTokens({
			attribute: 'data-theme',
			motion: { duration: { normal: 150 }, easing: { standard: 'expoOut' } }
		});
		expect(css).toContain('--duration-normal:150ms;');
		expect(css).toMatch(/^html\{/);
	});

	test('motion:theme.css a per-theme block layers over the motion prop', () => {
		const css = compileThemeDesignTokens({
			attribute: 'data-theme',
			motion: { duration: { normal: 150 } },
			designTokens: { dark: { motion: { duration: { slow: 400 } } } }
		});
		const themeBlock = css.split('\n').find((rule) => rule.startsWith('html[data-theme="dark"]'));
		expect(themeBlock).toContain('--duration-slow:400ms;');
		// The prop's own step survives inside the theme block instead of resetting to 200ms.
		expect(themeBlock).toContain('--duration-normal:150ms;');
	});
});
