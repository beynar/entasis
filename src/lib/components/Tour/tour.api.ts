// The narrow handle a Tour gives its snippets and lifecycle callbacks. The `TourState` class
// behind it owns the layer, the spotlight measurements and the step resolution; none of that is
// public, so it can change without breaking a consumer.
import type { OpenChangeDetails, OpenChangeInit } from '$lib/utils/openChange.js';
import type { TourStep } from './tour.props.js';

/** Where the tour is between two steps: `resolving` while `before` runs or a target is awaited. */
export type TourStatus = 'idle' | 'resolving' | 'ready';

/** What `next()`, `previous()` and `goTo()` accept: the event behind the request, if any. */
export type TourNavigationInput = Event | { event?: Event } | undefined;

/** The tour handed to `children`, a step's `content`, `onAfterOpen` and `onAfterClose`. */
export interface TourApi {
	/** Whether the tour is running. */
	readonly isOpen: boolean;
	/** `resolving` while a step's `before` runs or its target is awaited, `ready` once it shows. */
	readonly status: TourStatus;
	/** The index of the current step. */
	readonly step: number;
	/** How many steps the tour has. */
	readonly total: number;
	/** The current step. */
	readonly current: TourStep | undefined;
	/** The element the current step points at; `null` for a centred step or while resolving. */
	readonly target: HTMLElement | null;
	/** Whether the current step is the first one. */
	readonly isFirst: boolean;
	/** Whether the current step is the last one. */
	readonly isLast: boolean;
	/** The id of the step title, which names the popup. */
	readonly titleId: string;
	/** The id of the step description, which describes the popup and the target. */
	readonly descriptionId: string;
	/** Goes to the next step, or completes the tour on the last one. */
	readonly next: (input?: TourNavigationInput) => void;
	/** Goes to the previous step. */
	readonly previous: (input?: TourNavigationInput) => void;
	/** Goes to the step at `index`. */
	readonly goTo: (index: number, input?: TourNavigationInput) => void;
	/** Requests closing (`reason` defaults to `'imperative-action'`); `false` when cancelled. */
	readonly close: (input?: OpenChangeDetails | OpenChangeInit | Event) => boolean;
}
