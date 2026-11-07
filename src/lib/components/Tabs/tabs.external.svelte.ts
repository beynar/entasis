// The Tabs side of panels the caller renders: their ids, the tab ARIA that points at them, and the
// animated switch, played on the caller's elements with the Tabs motion preset.
import { untrack } from 'svelte';
import { REDUCED_MOTION_ATTRIBUTE } from '$lib/tailwind/scales.js';
import { easingBezierStrings } from '$lib/transitions/easingFunctions.js';
import type { ResolvedMotion } from '$lib/utils/motion/index.js';
import type { TabsActivationDirection } from './tabs.direction.svelte.js';
import type { TabsPanels } from './tabs.panels.svelte.js';

/** Set on the leaving panel for as long as it plays out; a caller keeps it painted meanwhile. */
export const TABS_EXITING_ATTRIBUTE = 'data-tabs-exiting';
/** How far a panel travels when the preset gives no `x` / `y`, in px. */
const DEFAULT_DISTANCE = 24;

type ExternalPanelsOptions = {
	panels: () => TabsPanels | undefined;
	/** The Tabs instance id; tabs are `{id}-tabs-tab-{index}`. */
	id: string;
	values: () => string[];
	/** The value of the selected tab, `undefined` when none is. */
	activeValue: () => string | undefined;
	activationDirection: () => TabsActivationDirection;
	motion: () => ResolvedMotion;
};

const distanceOf = (spec: number | string | undefined) =>
	typeof spec === 'number'
		? Math.abs(spec)
		: spec
			? spec.replace(/^-/, '')
			: `${DEFAULT_DISTANCE}px`;

const toLength = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

/** The `translate` a panel starts from when it enters toward `direction`. */
const enteringOffset = (direction: TabsActivationDirection, motion: ResolvedMotion) => {
	if (direction === 'none') return 'none';
	const horizontal = direction === 'left' || direction === 'right';
	const distance = toLength(distanceOf(horizontal ? motion.in.x : motion.in.y));
	// The new panel comes from where the selected tab moved: from the right after a move right.
	const signed = direction === 'right' || direction === 'down' ? distance : `-${distance}`;
	return horizontal ? `${signed} 0` : `0 ${signed}`;
};

const opposite = (offset: string) =>
	offset === 'none'
		? 'none'
		: offset
				.split(' ')
				.map((part) => (part === '0' ? part : part.startsWith('-') ? part.slice(1) : `-${part}`))
				.join(' ');

const reducedMotion = () =>
	typeof document !== 'undefined' &&
	(document.documentElement.hasAttribute(REDUCED_MOTION_ATTRIBUTE) ||
		(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches));

export const useExternalPanels = (options: ExternalPanelsOptions) => {
	// One id per value, kept for the life of the Tabs, so moving a tab does not rename its panel.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- ids handed out, not state
	const numbers = new Map<string, number>();
	const panelId = (value: string) => {
		let number = numbers.get(value);
		if (number === undefined) {
			number = numbers.size;
			numbers.set(value, number);
		}
		return `${options.id}-tabs-panel-${number}`;
	};
	const tabId = (value: string) => {
		const index = options.values().indexOf(value);
		return index < 0 ? undefined : `${options.id}-tabs-tab-${index}`;
	};

	$effect(() => options.panels()?.connect({ tabId, panelId }));

	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- running animations, not state
	const playing = new Set<Animation>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- elements to clean up; `panels.isExiting` is the reactive side
	const exiting = new Map<HTMLElement, string>();
	const endExit = (element: HTMLElement) => {
		const value = exiting.get(element);
		if (value === undefined) return;
		exiting.delete(element);
		element.removeAttribute(TABS_EXITING_ATTRIBUTE);
		options.panels()?.setExiting(value, false);
	};
	const settle = () => {
		for (const animation of playing) animation.cancel();
		playing.clear();
		for (const element of [...exiting.keys()]) endExit(element);
	};

	const play = (
		leaving: { element: HTMLElement; value: string } | undefined,
		entering: HTMLElement | undefined,
		direction: TabsActivationDirection
	) => {
		settle();
		const motion = options.motion();
		if (reducedMotion()) return;
		const offset = enteringOffset(direction, motion);
		const enterDuration = motion.in.duration ?? 0;
		if (entering && enterDuration > 0) {
			const animation = entering.animate(
				[
					{ opacity: motion.in.opacity ?? 0, translate: offset },
					{ opacity: 1, translate: 'none' }
				],
				{ duration: enterDuration, easing: easingBezierStrings[motion.in.easing ?? 'cubicOut'] }
			);
			playing.add(animation);
			void animation.finished.then(
				() => playing.delete(animation),
				() => playing.delete(animation)
			);
		}
		const exitDuration = motion.out.duration ?? enterDuration;
		if (leaving && leaving.element !== entering && exitDuration > 0) {
			const element = leaving.element;
			element.setAttribute(TABS_EXITING_ATTRIBUTE, '');
			exiting.set(element, leaving.value);
			options.panels()?.setExiting(leaving.value, true);
			const animation = element.animate(
				[
					{ opacity: 1, translate: 'none' },
					{ opacity: motion.out.opacity ?? 0, translate: opposite(offset) }
				],
				{
					duration: exitDuration,
					easing: easingBezierStrings[motion.out.easing ?? motion.in.easing ?? 'cubicIn']
				}
			);
			playing.add(animation);
			const done = () => {
				playing.delete(animation);
				endExit(element);
			};
			void animation.finished.then(done, done);
		}
	};

	let shown = untrack(options.activeValue);
	$effect(() => {
		const panels = options.panels();
		const next = options.activeValue();
		const direction = options.activationDirection();
		if (!panels) return;
		untrack(() => {
			const entering = next === undefined ? undefined : panels.element(next);
			entering?.setAttribute('data-activation-direction', direction);
			const previous = shown;
			shown = next;
			if (previous === next) return;
			const leaving = previous === undefined ? undefined : panels.element(previous);
			leaving?.removeAttribute('data-activation-direction');
			play(
				leaving && previous !== undefined ? { element: leaving, value: previous } : undefined,
				entering,
				direction
			);
		});
	});
	$effect(() => settle);

	return {
		/** The panel id each tab's `aria-controls` points at; none for a tab with no panel. */
		controls: (index: number) => {
			const value = options.values()[index];
			return value === undefined ? undefined : options.panels()?.idOf(value);
		}
	};
};
