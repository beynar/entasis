import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { getContext, onDestroy, onMount, setContext, tick } from 'svelte';
import { browser } from '$app/environment';
import { MediaQuery } from 'svelte/reactivity';
import type { SpinnerVariant } from '../Spinner/spinner.props.js';
import type { ResponsiveProps, Breakpoint } from './theme.js';
import { resolveResponsive } from './responsive.js';
import type { Easing } from '$lib/transitions/easingFunctions.js';
import { resolveMotionTokens, type DeepPartial, type MotionTokens } from '$lib/tailwind/scales.js';
import type { ComponentThemeRegistry } from '$lib/utils/cva/theme.js';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { on } from 'svelte/events';
import type { FSOParams, FSOProps } from '$lib/transitions/transition.js';
import type { Theme as SvelteTheme } from 'svelte-themes';
import { LayerStack } from '$lib/utils/layers.svelte.js';
import type { TooltipOptions } from '../Tooltip/tooltip.props.js';
import type { ConfirmationHost } from '../Confirmation/confirmation.state.svelte.js';
import { updateThemeWithTransition, type ThemeTransition } from './themeTransition.js';
import { ThemeFloatingWindows } from './theme.floatingWindows.js';
import type { Colors } from '$lib/types/theme.js';
import { REDUCED_MOTION_QUERY, registerActiveTheme } from '$lib/utils/motion.svelte.js';

type Events = 'scroll' | 'pointerdown' | 'keydown' | 'keyup';
type EventPayload = {
	[E in Events]: E extends 'pointerdown'
		? PointerEvent
		: E extends 'keydown'
			? KeyboardEvent
			: E extends 'keyup'
				? KeyboardEvent
				: E extends 'scroll'
					? WheelEvent
					: Event;
};
/**
 * Listeners are stored erased: each one is registered through `addEventListener` with the
 * concrete payload of its own event, and only that call site knows which. `never` keeps the
 * set assignable from every concrete listener; `on` re-applies the concrete type to dispatch.
 */
type ThemeEventListener = (event: never) => void;

interface ThemeOptions {
	readonly spinnerVariant: SpinnerVariant;
	readonly themeTransition?: ThemeTransition;
	readonly defaultColor?: Colors;
	readonly reduceMotion?: boolean;
	/** The partial scale passed as `<Theme motion>`; `motion` below is the resolved one. */
	readonly motionTokens?: DeepPartial<MotionTokens>;
	/** The `<Theme components>` registry; read by `useComponentTheme`/`useComponentMotion`. */
	readonly componentThemes?: ComponentThemeRegistry;
}

export class ThemeState extends createBindableStateClass<ThemeOptions>() {
	tooltip = $state<(TooltipOptions & { ref: HTMLElement }) | null>(null);
	lastTooltipClosed = $state<number | null>(null);
	/** DOM id of the single tooltip surface, so triggers can point `aria-describedby` at it. */
	tooltipId = $state<string | null>(null);
	/**
	 * The mounted `<Confirmation />` host, registered by the component on mount and cleared
	 * when it unmounts. `confirmation()` opens its dialogs through it.
	 */
	confirmation = $state<ConfirmationHost | null>(null);
	readonly floatingWindows = new ThemeFloatingWindows();
	/** Every floating surface registers here; see `LayerStack` for dismissal and z-order. */
	readonly layers = new LayerStack();
	// Tailwind's default breakpoint widths. `min-width` queries so the first that
	// fails tells us the active band. Built only in the browser — MediaQuery calls
	// `window.matchMedia` in its constructor.
	private breakpointQueries = browser
		? {
				sm: new MediaQuery('(min-width: 640px)'),
				md: new MediaQuery('(min-width: 768px)'),
				lg: new MediaQuery('(min-width: 1024px)'),
				xl: new MediaQuery('(min-width: 1280px)')
			}
		: null;
	// Live viewport breakpoint driving every `ResponsiveProps` record. Falls back to
	// `md` during SSR (no viewport to measure), which matches the pre-reactive default.
	currentBreakpoint = $derived.by<Breakpoint>(() => {
		const q = this.breakpointQueries;
		if (!q) return 'md';
		if (q.xl.current) return 'xl';
		if (q.lg.current) return 'lg';
		if (q.md.current) return 'md';
		if (q.sm.current) return 'sm';
		return 'xs';
	});
	// "Mobile" = below Tailwind's `md` (< 768px); used to collapse modals into sheets.
	isMobile = $derived(this.currentBreakpoint === 'xs' || this.currentBreakpoint === 'sm');
	// Built only in the browser, like `breakpointQueries`.
	private reducedMotionQuery = browser ? new MediaQuery(REDUCED_MOTION_QUERY) : null;
	/**
	 * Whether motion should be reduced: the Theme `reduceMotion` prop when set, else the
	 * live OS reduced-motion setting (`false` on the server). Read this instead of
	 * querying `matchMedia` inline; `prefersReducedMotion()` in `$lib/utils/motion` wraps it.
	 */
	preferReducesMotion = $derived(this.reduceMotion ?? this.reducedMotionQuery?.current ?? false);
	eventListeners = new SvelteMap<Events, SvelteSet<ThemeEventListener>>();
	private svelteTheme: SvelteTheme;
	/**
	 * The resolved global motion scale: duration steps in ms and easing roles. Seeded by
	 * the `<Theme motion>` prop, defaulted by `resolveMotionTokens`. Motion presets
	 * (`motion()` / `useComponentMotion`) resolve their tokens against it.
	 */
	motion: MotionTokens = $derived(resolveMotionTokens(this.motionTokens));

	/**
	 * @deprecated Read `motion.duration` / `motion.easing` instead. Kept as the pair the
	 * pre-token transitions consumed: the `normal` duration and the `standard` easing.
	 */
	get transition(): { easing: Easing; duration: number } {
		return { easing: this.motion.easing.standard, duration: this.motion.duration.normal };
	}

	get resolvedTheme() {
		return this.svelteTheme.resolvedTheme;
	}

	get theme() {
		return this.svelteTheme.theme;
	}

	set theme(theme: string) {
		if (theme === this.svelteTheme.theme) return;
		if (!this.svelteTheme.themes.includes(theme)) {
			this.svelteTheme.theme = theme;
			return;
		}

		// A reduced-motion preference turns the view transition into an instant swap.
		const transition = this.preferReducesMotion ? undefined : this.themeTransition;
		updateThemeWithTransition(transition, async () => {
			this.svelteTheme.theme = theme;
			await tick();
		});
	}

	get themes() {
		return this.svelteTheme.themes;
	}

	get systemTheme() {
		return this.svelteTheme.systemTheme;
	}

	constructor(options: ThemeOptions, svelteTheme: SvelteTheme) {
		super(options);
		this.svelteTheme = svelteTheme;
		setContext('sveltaiTheme', this);
		onDestroy(registerActiveTheme(this));
	}

	resolveTransitionProps = (props?: ResponsiveProps<FSOProps>, defaultTransition?: FSOProps) => {
		const responsiveTransition = this.resolveResponsiveProps(props);
		const defaultTransitionProps = {
			in:
				defaultTransition && 'in' in defaultTransition && defaultTransition.in
					? defaultTransition.in
					: defaultTransition
						? (defaultTransition as FSOParams)
						: {
								x: 0,
								y: 0,
								scale: 0.98,
								opacity: 0
							},
			out:
				defaultTransition && 'out' in defaultTransition && defaultTransition.out
					? defaultTransition.out
					: defaultTransition
						? (defaultTransition as FSOParams)
						: {
								x: 0,
								y: 0,
								scale: 0.98,
								opacity: 0
							}
		} as {
			in: FSOParams;
			out: FSOParams;
		};
		if (!responsiveTransition) {
			return defaultTransitionProps;
		}
		return {
			in: 'in' in responsiveTransition ? responsiveTransition.in : defaultTransitionProps.in,
			out: 'out' in responsiveTransition ? responsiveTransition.out : defaultTransitionProps.out
		} as {
			in: FSOParams;
			out: FSOParams;
		};
	};

	/**
	 * Normalizes a transition prop into `{ in, out }`. A flat params object is
	 * applied to both directions; the `{ in, out }` form is passed through (each
	 * side optional). `undefined` yields `{ in: undefined, out: undefined }` so
	 * the transition falls back to its own defaults.
	 */
	splitTransition = <T>(props?: T | { in?: T; out?: T }) => {
		const split = props && typeof props === 'object' && ('in' in props || 'out' in props);
		return {
			in: split ? (props as { in?: T }).in : (props as T | undefined),
			out: split ? (props as { out?: T }).out : (props as T | undefined)
		};
	};

	/**
	 * Resolve a `ResponsiveProps<T>` against the live VIEWPORT breakpoint. This is the resolver for
	 * surfaces the host does not size: overlays that measure the screen (Toast position, Popover /
	 * Dialog size, Confirmation) and motion transitions. Host-sized layout components (Grid, Stack,
	 * Carousel) resolve against their OWN width instead — see `responsive.ts`.
	 *
	 * Handles both forms, with the record form taking the nearest defined key at or below the
	 * active breakpoint. Only `undefined` and `null` fall through to `defaultValue`, so a `false`
	 * or `0` a caller actually passed is honoured.
	 */
	resolveResponsiveProps = <T>(props?: ResponsiveProps<T>, defaultValue?: T): T =>
		resolveResponsive(props, this.currentBreakpoint, defaultValue as T);

	private on = <E extends Events>(event: E) => {
		if (!this.eventListeners.has(event)) {
			const callback = (payload: EventPayload[E]) => {
				if (!this.eventListeners.size) {
					unSubscribe();
					return;
				}
				this.eventListeners
					.get(event)
					?.forEach((listener) => (listener as (event: EventPayload[E]) => void)(payload));
			};
			// `callback` only runs once listeners fire, so reading `unSubscribe` from its
			// closure is safe even though it is declared after.
			const unSubscribe = on(document, event, callback as (event: Event) => void);
			this.eventListeners.set(event, new SvelteSet([]));
		}
	};

	addEventListener = <E extends Events>(event: E, callback: (event: EventPayload[E]) => void) => {
		this.on(event);
		this.eventListeners.get(event)?.add(callback);
		return () => {
			this.eventListeners.get(event)?.delete(callback);
		};
	};
	addEventListenerOnMount = <E extends Events>(
		event: E,
		callback: (event: EventPayload[E]) => void
	) => {
		onMount(() => {
			return this.addEventListener(event, callback);
		});
	};
}

export const useTheme = () => {
	const theme = getContext('sveltaiTheme') as ThemeState | undefined;
	// A missing provider used to surface as `undefined is not an object` from whichever call site
	// dereferenced it first; name the cause instead, at the point where it is known.
	if (!theme) {
		throw new Error(
			'svelai: <Theme> was not found above this component. Wrap your app in <Theme> from "svelai/theme".'
		);
	}
	return theme;
};

/** Resolve a control color against Theme `defaultColor`. Call inside `$derived`. */
export const useDefaultColor = (color?: Colors): Colors => {
	return color ?? (getContext('sveltaiTheme') as ThemeState | undefined)?.defaultColor ?? 'neutral';
};
