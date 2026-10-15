// The open/close lifecycle every overlay shares: `closed → entering → open → exiting → closed`,
// with `onAfterOpen` and `onAfterClose` firing exactly once per open and per close.
//
// Svelte plays no intro for an element whose `{#if}` block is already true when it is created
// (`defaultOpen`, hydration, a component mounted open), so `introend` alone would leave such an
// overlay "entering" forever. The lifecycle notes when the element's transition function is
// called (Svelte calls it synchronously, in the flush that starts the transition) and completes
// the phase itself once that flush has settled without one.
import { tick, untrack } from 'svelte';
import type { OpenTransitionStatus } from './stateAttributes.js';

export interface OpenLifecycleOptions {
	/** The owner's open state. */
	isOpen: () => boolean;
	/** Runs once the opening transition has finished, or right away when none plays. */
	onAfterOpen?: () => void;
	/** Runs once the closing transition has finished, or right away when none plays. */
	onAfterClose?: () => void;
	/**
	 * Another component renders and animates the surface (a Popover's mobile sheet is a Dialog)
	 * and reports through `introEnd` / `outroEnd`; the lifecycle then never completes on its own.
	 */
	external?: () => boolean;
	/**
	 * The element a CSS-animated surface (no Svelte transition) animates: when no transition
	 * function ran, completion waits for its running animations and transitions.
	 */
	animated?: () => Element | null | undefined;
}

/** Any Svelte transition function: `(node, params, { direction })`. */
type TransitionFunction = (...args: never[]) => unknown;

export interface OpenLifecycle {
	/** Where the surface is in its lifecycle; feeds `data-entering` / `data-exiting`. */
	readonly status: OpenTransitionStatus;
	/**
	 * Wraps the transition function of the element that animates in and out, so the lifecycle
	 * knows a transition is playing: `in:panelTransition={…} out:panelTransition={…}`.
	 */
	transition<Fn extends TransitionFunction>(fn: Fn): Fn;
	/** Call from the animated element's `onintroend` (or an external surface's after-open). */
	introEnd(): void;
	/** Call from the animated element's `onoutroend` (or an external surface's after-close). */
	outroEnd(): void;
}

/**
 * Tracks one surface's lifecycle. Call during component initialisation (it installs effects).
 * A close during the opening transition cancels the pending `onAfterOpen`, and a reopen during the
 * closing one cancels the pending `onAfterClose`; each phase that completes reports once.
 */
export function useOpenLifecycle(options: OpenLifecycleOptions): OpenLifecycle {
	let status = $state<OpenTransitionStatus>('closed');
	// The direction of the phase in progress: `true` opening or open, `false` closing or closed,
	// `null` before the first run. Plain fields: read by event handlers, never rendered.
	let direction: boolean | null = null;
	let phase = 0;
	let transitionStarted = false;
	/**
	 * A transition Svelte started before this flush reached `begin` (effect order is not
	 * guaranteed): the phase it belongs to has not been recorded yet.
	 */
	let earlyTransition: 'in' | 'out' | null = null;
	/** Such an early transition that has already ended (a zero duration ends synchronously). */
	let earlyEnd: 'in' | 'out' | null = null;
	const early = (kind: 'transition' | 'end', playing: 'in' | 'out') => {
		if (kind === 'transition') earlyTransition = playing;
		else earlyEnd = playing;
		queueMicrotask(() => {
			earlyTransition = earlyEnd = null;
		});
	};
	let completed = true;
	let disposed = false;

	const complete = (id: number) => {
		if (disposed || id !== phase || completed) return;
		completed = true;
		if (direction) {
			status = 'open';
			options.onAfterOpen?.();
		} else {
			status = 'closed';
			options.onAfterClose?.();
		}
	};

	// Runs once the flush that changed the state has settled: by then Svelte has called the
	// transition function of any element that animates this phase.
	const completeWithoutTransition = async (id: number) => {
		await tick();
		if (id !== phase || transitionStarted || completed || options.external?.()) return;
		const element = options.animated?.();
		const animations = element?.getAnimations?.({ subtree: true }) ?? [];
		if (animations.length > 0) {
			await Promise.allSettled(animations.map((animation) => animation.finished));
		}
		complete(id);
	};

	const begin = (open: boolean) => {
		if (open === direction) return;
		const initial = direction === null;
		direction = open;
		const id = ++phase;
		const playing = open ? 'in' : 'out';
		// A transition that already ended leaves nothing to wait for: the fallback completes.
		transitionStarted = earlyTransition === playing && earlyEnd !== playing;
		earlyTransition = earlyEnd = null;
		completed = false;
		// Closed at creation: there is no close to report.
		if (initial && !open) {
			completed = true;
			return;
		}
		status = open ? 'entering' : 'exiting';
		void completeWithoutTransition(id);
	};

	// `.pre`, so `status` is normally current before the template renders the change. Effect
	// order is not guaranteed, though: a transition that starts first is caught by `early`.
	$effect.pre(() => {
		const open = options.isOpen();
		untrack(() => begin(open));
	});
	$effect(() => () => {
		disposed = true;
	});

	return {
		get status() {
			return status;
		},
		transition: <Fn extends TransitionFunction>(fn: Fn): Fn =>
			((...args: unknown[]) => {
				// Svelte passes `{ direction }` third: 'in' for an intro, 'out' for an outro.
				const playing = (args[2] as { direction?: 'in' | 'out' | 'both' } | undefined)?.direction;
				if (playing === 'both' || (playing === 'in') === direction) {
					transitionStarted = true;
				} else if (playing === 'in' || playing === 'out') {
					// The state change that starts this phase has not reached `begin` yet; it does
					// within the same flush, before any microtask.
					early('transition', playing);
				}
				const config = (fn as unknown as (...args: unknown[]) => unknown)(...args);
				// Svelte keeps these options for as long as the element lives once an exit has started
				// (a reopen reverses it) and does not call this function for the next exit. Handed back
				// as a deferred config, they are asked for on every run instead, in a microtask the
				// flush that starts it queues: before `completeWithoutTransition` reads
				// `transitionStarted` after its tick.
				return (options: { direction: 'in' | 'out' }) => {
					if (!completed && (options.direction === 'in') === direction) transitionStarted = true;
					return typeof config === 'function' ? config(options) : config;
				};
			}) as unknown as Fn,
		introEnd: () => {
			if (direction) complete(phase);
			else if (earlyTransition === 'in') early('end', 'in');
		},
		outroEnd: () => {
			if (direction === false) complete(phase);
			else if (earlyTransition === 'out') early('end', 'out');
		}
	};
}
