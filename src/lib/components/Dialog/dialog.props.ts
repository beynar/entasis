import type { SpacingStep } from '$lib/tailwind/spacing.js';
import type { Snippet } from 'svelte';
import type { Slot, WithSlot } from '../Slot/slot.js';
import type { DialogState } from './dialog.state.svelte.js';
import type { ResponsiveProps } from '../Theme/theme.js';
import type { Sizes } from '$lib/types/theme.js';
import type { ButtonProps } from '../Button/index.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { DialogThemeProps } from './dialog.theme.js';
import type { OpenChangeDetails, OpenChangeHandler } from '$lib/utils/openChange.js';
import type { FocusOnClose } from '$lib/utils/useFocusScope.svelte.js';

export type DialogType =
	'fullScreen' | 'drawerRight' | 'drawerLeft' | 'drawerBottom' | 'drawerTop' | 'alert' | 'modal';

/**
 * A drawer snap point: how much of the drawer shows when it rests there. A number is a fraction
 * of the available height (`0.5` is half of it), a string a CSS length (`'148px'`, `'20rem'`,
 * `'40%'`, `'50vh'`).
 */
export type DialogSnapPoint = number | string;

export type DialogProps = WithSlot<
	{
		/** Stable DOM id for the portaled dialog root; falls back to a generated id when omitted. */
		id?: string;
		/** Presentation variant (modal, alert, fullScreen, or edge drawer); supports responsive
		 *  values — pass a `{ xs: 'drawerBottom', md: 'modal' }` record for per-breakpoint control.
		 *  An `alert` renders `role="alertdialog"` and ignores outside presses by default. The
		 *  resolved type is exposed as `data-type` on the root and the panel. */
		type?: ResponsiveProps<DialogType>;
		/** When the resolved type is `modal`, collapse it into a bottom-sheet drawer on mobile
		 *  (viewport < 768px), inheriting swipe-to-dismiss and the drag thumb. Default `true`. */
		responsive?: boolean;
		/**
		 * Whether the dialog is modal (default `true`): it makes the page behind `inert`, locks page
		 * scroll, contains Tab, dims the page with the shared backdrop and dismisses on an outside
		 * press. `false` leaves the page interactive: no `inert`, no scroll lock, no backdrop, no
		 * focus containment, and an outside press does not dismiss it unless `closeOnClickOutside`
		 * is set. Escape, the close button and swipes still close it. It renders no `aria-modal`
		 * (an alert stays an `alertdialog`). A non-modal dialog always scrolls inside its card.
		 */
		modal?: boolean;
		/** Controls whether the dialog is rendered; bindable for two-way control. */
		open?: boolean;
		/** Initial open state when `open` is not provided. */
		defaultOpen?: boolean;
		/**
		 * Called before the dialog opens or closes, with the requested state and the change
		 * details: `reason` (`'trigger-press'`, `'escape-key'`, `'outside-press'`, `'close-press'`,
		 * `'swipe'`, `'close-watcher'` for the Android Back gesture, `'imperative-action'`…), the
		 * originating `event`, the `trigger` element, the `interaction` type and `cancel()`.
		 * Calling `details.cancel()` keeps the dialog as it is (a cancelled swipe snaps back) and
		 * leaves the event untouched. Inside the callback, `open` still holds the previous state.
		 */
		onOpenChange?: OpenChangeHandler;
		/** Called once per open, after the open transition finishes (right away when none plays). */
		onAfterOpen?: (payload: DialogState) => void;
		/** Called once per close, after the close transition finishes. */
		onAfterClose?: (payload: DialogState) => void;
		/** Content max-width for modal and alert types; supports responsive values. */
		size?: ResponsiveProps<Sizes>;
		/** Where a dialog taller than the viewport scrolls: inside the card (`inner`, default) or the viewport (`outer`). */
		scroll?: ResponsiveProps<'inner' | 'outer'>;
		/** Fly/scale opacity transition overrides for open and close; supports responsive values. */
		transition?: ResponsiveProps<FSOProps>;
		/**
		 * Where focus goes when the dialog closes. By default it returns to the control that
		 * opened the dialog (with a visible focus ring after Escape or another keyboard close);
		 * when that control is gone or disabled, to the most recent element that is still on the
		 * page. `false` leaves focus where it is, an element receives it, and a function is called
		 * with the change details (`reason`, `interaction`…) and returns one of these, or nothing
		 * to restore as usual.
		 * @default true
		 */
		focusOnClose?: FocusOnClose;
		/**
		 * Where a bottom or top drawer (or a mobile sheet) can rest, from the least to the most of
		 * it showing: fractions of the available height or CSS lengths. With snap points the
		 * drawer opens at `defaultSnapPoint` (the largest by default), a drag moves it between the
		 * points (a flick carries it to the next), and dragging below the lowest one dismisses it
		 * when swipe-to-dismiss is on. Its body scrolls only at the largest point. Ignored by the
		 * other types.
		 */
		snapPoints?: DialogSnapPoint[];
		/**
		 * The snap point the drawer rests at: one of `snapPoints`, bindable. Without it the drawer
		 * manages its own, starting at `defaultSnapPoint`.
		 */
		snapPoint?: DialogSnapPoint;
		/** The snap point the drawer opens at when `snapPoint` is not bound. Defaults to the largest. */
		defaultSnapPoint?: DialogSnapPoint;
		/**
		 * Called before the resting snap point changes, with `{ snapPoint, details }`: the new point
		 * and the change details (`reason` is `'swipe'` for a drag and `'imperative-action'` for
		 * `setSnapPoint`; `details.cancel()` keeps the current point and a cancelled drag snaps back).
		 */
		onSnapPointChange?: (payload: {
			snapPoint: DialogSnapPoint;
			details: OpenChangeDetails;
		}) => void;
		/** Snippet for main dialog body content; receives the dialog state instance. */
		children?: Snippet<[DialogState]>;
		/**
		 * Snippet or button props that render the control used to open the dialog. The built-in
		 * button carries `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`, and its
		 * `onclick` runs first: calling `event.preventDefault()` there keeps the dialog closed. A
		 * snippet trigger gets the same contract with `{@attach dialog.trigger}`; focus returns to
		 * the trigger when the dialog closes.
		 */
		trigger?: Snippet<[DialogState]> | (ButtonProps & { content?: string });
		/** When true, shows a close button and allows Escape to close the dialog. */
		closable?: boolean;
		/** When true, pressing outside the dialog panel closes the topmost open dialog. Defaults to
		 *  `true`, except for an `alert`, which ignores outside presses unless this is set. A press
		 *  that began before the dialog opened does not count. */
		closeOnClickOutside?: boolean;
		/** When true, pressing Escape (and, for a modal dialog on Android, the Back gesture) closes
		 *  the dialog when it is closable and topmost. */
		closeOnEscape?: boolean;
		/** Drag the panel toward its edge to dismiss (drawer types only). Defaults to true for drawers.
		 *  Direction-aware, and never hijacks inner scrolling — a scrollable region that can still
		 *  scroll along the drag axis keeps the gesture (right-to-left scrollers included), and so
		 *  does a drag that travels more across the axis than along it. A flick dismisses on release
		 *  speed alone. A mouse or pen drags only from the handles (the thumb and the header), so
		 *  dragging over the body selects text; a finger drags from anywhere unless text is selected
		 *  in the panel. Opt elements out with `data-no-swipe`. A dialog above another keeps the one
		 *  beneath moving with its swipe. */
		swipeToDismiss?: boolean;
		/** Show the drag thumb bar on swipe-dismissable drawers; set false to hide. Default true. */
		thumb?: boolean;
		/** Where a finger swipe can start: the whole panel (`panel`, default) or only the drag
		 *  handles (`handle` — the thumb and the header). A mouse or pen always starts from a handle. */
		swipeFrom?: 'panel' | 'handle';
		/** How far a drawer stands off the screen edge: a spacing step or `'none'` for edge to edge.
		 *  Defaults to the theme's `designTokens.drawerInset` (`'layout-md'`). At `'none'` the edge
		 *  corners square off and only the corners facing the page keep their radius. */
		inset?: SpacingStep | 'none';
		/**
		 * Replaces the close button, or `false` to suppress the visible one. A closable dialog whose
		 * visible button is suppressed (`false`, or a snippet that renders nothing, as the Popover
		 * mobile sheet passes) still gets a visually hidden Close button at the end of the panel, so
		 * screen reader users have a control that closes it. An `alert` never gets one: its own
		 * buttons answer it.
		 */
		closeButton?: Slot | false;
		/** Additional CSS classes merged onto the portaled dialog root element. */
		class?: string;
		/** Per-instance theme overrides for dialog layout and styling class names. */
		theme?: DialogThemeProps;
	},
	'title' | 'description' | 'footer' | 'header'
>;
