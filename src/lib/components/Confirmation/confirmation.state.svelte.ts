import { DEV } from 'esm-env';
import { createId } from '$lib/utils/id.js';
import type { ButtonProps } from '../Button/index.js';
import type { MaybePromise } from '../Form/Form/form.js';
import type { ThemeState } from '../Theme/theme.state.svelte.js';
import type { PopoverPlacement } from '../Popover/popover.props.js';

type Callback = (() => MaybePromise<unknown>) | undefined;
export type ConfirmationPayload<CB extends Callback = Callback> = {
	id: string;
	/** Defaults to the I18n catalog's `confirmationTitle` ("Are you sure?"). */
	title?: string;
	description?: string;
	/** Defaults to the I18n catalog's `confirmationConfirm` ("Confirm"). */
	confirm?:
		| string
		| ({
				text: string;
		  } & ButtonProps);
	/** Defaults to the I18n catalog's `confirmationCancel` ("Cancel"). */
	cancel?:
		| string
		| ({
				text: string;
		  } & ButtonProps);
	onConfirm?: CB;
	/**
	 * Asks next to this element in a small popover instead of a dialog: Escape, a press outside it
	 * and focus leaving it answer Cancel, and focus returns to the element.
	 */
	anchor?: HTMLElement;
	/** Where the popover sits against `anchor`. Default `'top'`. */
	position?: PopoverPlacement;
};

/** What the user chose, plus whatever `onConfirm` returned when they confirmed. */
export type ConfirmationOutcome = {
	confirmed: boolean;
	result?: unknown;
};

/**
 * The mounted `<Confirmation />`. It registers itself on the ThemeState (`theme.confirmation`)
 * so any subtree can reach it, and `confirmation()` opens dialogs through it.
 */
export type ConfirmationHost = {
	/** Opens a confirmation dialog and resolves once the user answers it. */
	request: (payload: ConfirmationPayload) => Promise<ConfirmationOutcome>;
};

export type ConfirmationState = ConfirmationPayload & {
	isOpen: boolean;
	loading: boolean;
	/** Settles the `confirmation()` promise this dialog was opened for. */
	settle: (outcome: ConfirmationOutcome) => void;
};

// Every mounted `<Confirmation />`, in mount order. `confirmation()` is a plain function called
// from event handlers and modules, where `getContext` is unavailable, so the components publish
// themselves here as well as on the ThemeState. The most recently mounted one serves, and a
// nested host that unmounts hands the registry back to the outer one instead of leaving the app
// with none.
const mountedHosts: ConfirmationHost[] = [];
const activeHost = () => mountedHosts.at(-1) ?? null;
// Requests made before any `<Confirmation />` mounted; the first host to register serves
// them in order, so `confirmation()` still resolves instead of hanging or throwing.
const pendingRequests: {
	detail: ConfirmationPayload;
	settle: (outcome: ConfirmationOutcome) => void;
}[] = [];
let pendingWarningScheduled = false;

// A queued request is only a problem if no `<Confirmation />` ever shows up; warn once, a
// tick later, so one mounting in the same tick stays silent.
const warnIfNothingMounts = () => {
	if (pendingWarningScheduled) return;
	pendingWarningScheduled = true;
	setTimeout(() => {
		if (!pendingWarningScheduled || !pendingRequests.length) return;
		pendingWarningScheduled = false;
		console.warn(
			`entasis: ${pendingRequests.length} confirmation(s) are queued because no <Confirmation /> is mounted. Add <Confirmation /> to your root layout; they will open as soon as one mounts.`
		);
	}, 0);
};

/**
 * Registers the mounted `<Confirmation />` as the app's confirmation host: publishes it on
 * the ThemeState, serves everything queued before it mounted, and returns the unregister.
 */
export const registerConfirmationHost = (theme: ThemeState | undefined, host: ConfirmationHost) => {
	mountedHosts.push(host);
	if (theme) theme.confirmation = host;
	pendingWarningScheduled = false;
	for (const request of pendingRequests.splice(0, pendingRequests.length)) {
		host.request(request.detail).then(request.settle);
	}
	return () => {
		const index = mountedHosts.lastIndexOf(host);
		if (index !== -1) mountedHosts.splice(index, 1);
		// Fall back to whichever host is still mounted rather than clearing the registry.
		if (theme?.confirmation === host) theme.confirmation = activeHost();
	};
};

export const confirmation = <CB extends Callback>(options: Omit<ConfirmationPayload<CB>, 'id'>) => {
	return new Promise<
		| {
				confirmed: true;
				result: CB extends () => MaybePromise<infer R> ? R : void;
		  }
		| {
				confirmed: false;
				result: undefined;
		  }
	>((resolve) => {
		const detail = Object.assign({}, options, {
			id: createId('confirmation')
		}) as ConfirmationPayload;
		const settle = (outcome: ConfirmationOutcome) => {
			resolve(
				(outcome.confirmed
					? { confirmed: true, result: outcome.result }
					: { confirmed: false, result: undefined }) as never
			);
		};
		const host = activeHost();
		if (host) {
			host.request(detail).then(settle);
			return;
		}
		pendingRequests.push({ detail, settle });
		if (DEV) warnIfNothingMounts();
	});
};

/** What `popconfirm()` asks: the confirmation's texts and buttons, and where it sits. */
export type PopconfirmOptions = Omit<ConfirmationPayload, 'id' | 'onConfirm' | 'anchor'>;

/** The action a `popconfirm()` guards: the original event, and the element the question sat on. */
export type PopconfirmHandler<E extends Event = MouseEvent> = (
	event: E,
	anchor: HTMLElement
) => unknown;

// Elements whose next click is the replay of a confirmed one: it goes through untouched.
const replaying = new WeakSet<EventTarget>();
// Elements with a question open: a second click on them does not ask again.
const asking = new WeakSet<EventTarget>();

/**
 * Guards a click with a small confirmation anchored to the element that was clicked:
 * `onclick={popconfirm((event) => remove(item), { title: 'Delete it?' })}`. The click's own
 * action (following a link, submitting a form) is held back; on Confirm the handler runs with the
 * original event and the element, its promise keeping the Confirm button loading until it
 * settles. Without a handler, Confirm replays the click, so the link is followed or the form
 * submitted as if nothing had been in the way. Needs a mounted `<Confirmation />`.
 */
export function popconfirm<E extends Event = MouseEvent>(
	handler?: PopconfirmHandler<E>,
	options?: PopconfirmOptions
): (event: E) => void;
export function popconfirm<E extends Event = MouseEvent>(
	options: PopconfirmOptions
): (event: E) => void;
export function popconfirm<E extends Event = MouseEvent>(
	handlerOrOptions?: PopconfirmHandler<E> | PopconfirmOptions,
	maybeOptions?: PopconfirmOptions
): (event: E) => void {
	const handler = typeof handlerOrOptions === 'function' ? handlerOrOptions : undefined;
	const options = (typeof handlerOrOptions === 'function' ? maybeOptions : handlerOrOptions) ?? {};
	return (event) => {
		const anchor = (event.currentTarget ?? event.target) as HTMLElement | null;
		if (!anchor) return;
		if (replaying.has(anchor)) {
			replaying.delete(anchor);
			return;
		}
		event.preventDefault();
		if (asking.has(anchor)) return;
		asking.add(anchor);
		confirmation({
			...options,
			anchor,
			onConfirm: handler ? () => handler(event, anchor) : undefined
		}).then(({ confirmed }) => {
			asking.delete(anchor);
			if (!confirmed || handler || !anchor.isConnected) return;
			replaying.add(anchor);
			anchor.click();
		});
	};
}
