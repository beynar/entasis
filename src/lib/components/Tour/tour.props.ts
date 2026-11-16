import type { Snippet } from 'svelte';
import type { Sizes } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { OpenChangeHandler, OpenChangeInteraction } from '$lib/utils/openChange.js';
import type { PopoverPlacement } from '../Popover/popover.props.js';
import type { TourApi } from './tour.api.js';
import type { TourThemeProps } from './tour.theme.js';

/**
 * What a step points at: a name registered with `{@attach tourTarget('name')}`, else a CSS
 * selector; an element; a function returning one, read when the step starts; or `null` for a
 * step centred on the page with no spotlight.
 */
export type TourTarget = string | HTMLElement | (() => HTMLElement | null | undefined) | null;

/**
 * What happens when a step's target is still missing after `before` and `targetTimeout`: `skip`
 * moves on in the direction the tour was going, `center` shows the step centred with no
 * spotlight, `stop` closes the tour (`reason: 'target-missing'`).
 */
export type TourMissingTarget = 'skip' | 'center' | 'stop';

/** How the step position is shown: `count` ("2 of 5"), `dots`, or `false` for nothing. */
export type TourProgress = 'count' | 'dots' | false;

/** Why the step is about to change. */
export type TourStepChangeReason =
	/** The Next button. */
	| 'next-press'
	/** The Back button. */
	| 'previous-press'
	/** ArrowRight or ArrowLeft while focus is in the popup or on the target. */
	| 'arrow-key'
	/** The step's `advanceOn` event fired on its target. */
	| 'advance-on'
	/** The target never appeared and `missingTarget` is `skip`. */
	| 'target-missing'
	/** `tour.next()`, `tour.previous()` or `tour.goTo()` from code, or the `open` prop starting it. */
	| 'imperative-action';

/** The second argument of `onStepChange`. */
export interface TourStepChangeDetails {
	/** The index of the step the tour is going to. */
	readonly step: number;
	/** Why the step is changing. */
	readonly reason: TourStepChangeReason;
	/** The step the tour is leaving (its index), `-1` when the tour is starting. */
	readonly from: number;
	/** The DOM event behind the change, when there is one. */
	readonly event?: Event;
	/** The input modality behind the change. */
	readonly interaction: OpenChangeInteraction;
	/** Keeps the current step: the tour does not move and nothing else happens. */
	cancel(): void;
	/** Whether `cancel()` was called. */
	readonly isCanceled: boolean;
}

/** What `before` receives. */
export interface TourBeforeContext {
	/** Aborted when the person moves on (or closes the tour) before this step showed. */
	readonly signal: AbortSignal;
	/** The index of the step about to show. */
	readonly step: number;
	/** Which way the tour is going: `1` forward, `-1` back. */
	readonly direction: 1 | -1;
}

/** One stop of the walkthrough. */
export interface TourStep {
	/** A stable id, used to key the step; defaults to its index. */
	id?: string;
	/** What the step points at; see `TourTarget`. Omitted or `null`: a centred step. */
	target?: TourTarget;
	/** The popup heading, which names its dialog and is announced on each step. */
	title: string;
	/** Text under the title, which describes the dialog and the target. */
	description?: string;
	/** Custom body under the title, in place of `description`. Receives the tour. */
	content?: Snippet<[TourApi]>;
	/** Where the popup goes against the target; defaults to the tour's `position`. */
	position?: PopoverPlacement;
	/** Space in px between the target and the edge of the spotlight; defaults to the tour's. */
	padding?: number;
	/** Corner radius of the spotlight in px, or `'auto'`; defaults to the tour's. */
	radius?: number | 'auto';
	/**
	 * Runs before the step shows, and is awaited: navigate, open a menu, load data. The tour shows
	 * `data-resolving` meanwhile. `signal` aborts when the person moves on first. A rejection is
	 * treated like a missing target.
	 */
	before?: (context: TourBeforeContext) => void | Promise<void>;
	/**
	 * DOM event name(s) on the target that advance the tour, for "now click this" steps:
	 * `advanceOn: 'click'`. On the last step it completes the tour.
	 */
	advanceOn?: string | string[];
	/** Whether this step's target takes presses; defaults to the tour's `interactiveTarget`. */
	interactiveTarget?: boolean;
	/** What to do when this target is missing; defaults to the tour's `missingTarget`. */
	missingTarget?: TourMissingTarget;
}

/** Labels that replace the I18n catalog's for one tour. */
export interface TourLabels {
	next?: string;
	previous?: string;
	done?: string;
	skip?: string;
	close?: string;
	/** The progress text, e.g. `(current, total) => \`${current}/${total}\``. */
	progress?: (current: number, total: number) => string;
}

export type TourProps = WithAttachments<{
	/** Stable id prefix for the popup, its title and description; generated when omitted. */
	id?: string;
	/** The steps, in order. */
	steps: TourStep[];
	/** Whether the tour is running; bindable. Opening it starts at `step`. */
	open?: boolean;
	/** Whether the tour starts running when `open` is not provided. */
	defaultOpen?: boolean;
	/**
	 * Called before the tour opens or closes, with `details.reason`: `'close-press'` (the close
	 * button), `'skip-press'`, `'complete'` (Done on the last step, or its `advanceOn`),
	 * `'escape-key'`, `'close-watcher'`, `'outside-press'` (only with `closeOnBackdropPress`),
	 * `'target-missing'` (`missingTarget: 'stop'`) or `'imperative-action'`. `details.cancel()`
	 * keeps the tour as it is; a cancelled Escape is left untouched.
	 */
	onOpenChange?: OpenChangeHandler;
	/** Called once per open, after the backdrop has faded in. */
	onAfterOpen?: (tour: TourApi) => void;
	/** Called once per close, after the backdrop has faded out. */
	onAfterClose?: (tour: TourApi) => void;
	/** The index of the current step; bindable. */
	step?: number;
	/** The step a tour starts at when `step` is not provided. @default 0 */
	defaultStep?: number;
	/**
	 * Called before the step changes, with one payload: the `step` index it is going to, `reason`,
	 * `from`, `event`, `interaction` and `cancel()`, which keeps the current step. Not called for
	 * changes the parent makes to `step`.
	 */
	onStepChange?: (details: TourStepChangeDetails) => void;
	/**
	 * Makes the rest of the page `inert` while the tour runs: only the popup and the target can be
	 * reached, and Tab cycles between them. Without it the page stays reachable by keyboard; the
	 * backdrop still takes pointer presses.
	 * @default false
	 */
	modal?: boolean;
	/** Dims the page around the target. `false` keeps the page as it is (the popup still points). @default true */
	overlay?: boolean;
	/** Size of the popup and its buttons. @default 'normal' */
	size?: Sizes;
	/** Where the popup goes against the target, unless a step says otherwise. @default 'bottom' */
	position?: PopoverPlacement;
	/** Space in px between a target and the edge of the spotlight. @default 8 */
	padding?: number;
	/**
	 * Corner radius of the spotlight in px. `'auto'` follows the target's own radius (grown by
	 * `padding`), with 8px for a square target.
	 * @default 'auto'
	 */
	radius?: number | 'auto';
	/** What to do when a target is missing; see `TourMissingTarget`. @default 'skip' */
	missingTarget?: TourMissingTarget;
	/** Milliseconds to wait for a missing target (after `before`) before `missingTarget` applies. @default 3000 */
	targetTimeout?: number;
	/**
	 * Whether the targets take presses through the spotlight. `false` shows them but covers them
	 * with an invisible blocker, so presses do nothing.
	 * @default true
	 */
	interactiveTarget?: boolean;
	/** Closes the tour (`reason: 'outside-press'`) on a press on the backdrop. @default false */
	closeOnBackdropPress?: boolean;
	/** Closes the tour on Escape. @default true */
	closeOnEscape?: boolean;
	/** Arrow keys move between steps while focus is in the popup or on the target. @default true */
	keyboardNavigation?: boolean;
	/** How the position in the tour is shown. @default 'count' */
	progress?: TourProgress;
	/** Shows a Skip button on every step but the last. @default true */
	skippable?: boolean;
	/** Shows a close button in the popup header. @default true */
	closeButton?: boolean;
	/** Draws an arrow from the popup to the target. @default true */
	arrow?: boolean;
	/** Scrolls a target that is not fully visible into view before its step shows. @default true */
	scrollIntoView?: boolean;
	/** Labels that replace the I18n catalog's for this tour. */
	labels?: TourLabels;
	/**
	 * Replaces the whole popup body (title, content, progress and buttons). Render the title with
	 * `id={tour.titleId}` so it still names the dialog.
	 */
	children?: Snippet<[TourApi]>;
	/** Additional classes on the popup panel. */
	class?: string;
	/** Per-instance theme overrides. */
	theme?: TourThemeProps;
}>;
