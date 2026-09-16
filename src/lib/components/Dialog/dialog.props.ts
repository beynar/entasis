import type { Snippet } from 'svelte';
import type { WithSlot } from '../Slot/slot.js';
import type { DialogState } from './dialog.state.svelte.js';
import type { ResponsiveProps } from '../Theme/theme.js';
import type { Sizes } from '$lib/types/theme.js';
import type { ButtonProps } from '../Button/index.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { DialogThemeProps } from './dialog.theme.js';

export type DialogType =
	'fullScreen' | 'drawerRight' | 'drawerLeft' | 'drawerBottom' | 'drawerTop' | 'alert' | 'modal';

export type DialogProps = WithSlot<
	{
		/** Stable DOM id for the portaled dialog root; falls back to a generated id when omitted. */
		id?: string;
		/** Presentation variant (modal, alert, fullScreen, or edge drawer); supports responsive
		 *  values — pass a `{ xs: 'drawerBottom', md: 'modal' }` record for per-breakpoint control. */
		type?: ResponsiveProps<DialogType>;
		/** When the resolved type is `modal`, collapse it into a bottom-sheet drawer on mobile
		 *  (viewport < 768px), inheriting swipe-to-dismiss and the drag thumb. Default `true`. */
		responsive?: boolean;
		/** Controls whether the dialog is rendered; bindable for two-way control. */
		open?: boolean;
		/** Initial open state when `open` is not provided. */
		defaultOpen?: boolean;
		/** Called once when the library requests an open-state change. */
		onOpenChange?: (open: boolean) => void;
		/** Called after the open transition finishes. */
		onAfterOpen?: (payload: DialogState) => void;
		/** Called after the close transition finishes. */
		onAfterClose?: (payload: DialogState) => void;
		/** Content max-width for modal and alert types; supports responsive values. */
		size?: ResponsiveProps<Sizes>;
		/** Where a dialog taller than the viewport scrolls: inside the card (`inner`, default) or the viewport (`outer`). */
		scroll?: ResponsiveProps<'inner' | 'outer'>;
		/** Fly/scale opacity transition overrides for open and close; supports responsive values. */
		transition?: ResponsiveProps<FSOProps>;
		/** Snippet for main dialog body content; receives the dialog state instance. */
		children?: Snippet<[DialogState]>;
		/** Snippet or button props that render the control used to open the dialog. */
		trigger?: Snippet<[DialogState]> | (ButtonProps & { content?: string });
		/** When true, shows a close button and allows Escape to close the dialog. */
		closable?: boolean;
		/** When true, clicking outside the dialog panel closes the topmost open dialog. */
		closeOnClickOutside?: boolean;
		/** When true, pressing Escape closes the dialog when it is closable and topmost. */
		closeOnEscape?: boolean;
		/** Drag the panel toward its edge to dismiss (drawer types only). Defaults to true for drawers.
		 *  Direction-aware, and never hijacks inner scrolling — a scrollable region that can still
		 *  scroll along the drag axis keeps the gesture. Opt elements out with `data-no-swipe`. */
		swipeToDismiss?: boolean;
		/** Show the drag thumb bar on swipe-dismissable drawers; set false to hide. Default true. */
		thumb?: boolean;
		/** Where a swipe can start: the whole panel (`panel`, default) or only the drag handles
		 *  (`handle` — the thumb and the header). */
		swipeFrom?: 'panel' | 'handle';
		/** Additional CSS classes merged onto the portaled dialog root element. */
		class?: string;
		/** Per-instance theme overrides for dialog layout and styling class names. */
		theme?: DialogThemeProps;
	},
	'title' | 'description' | 'footer' | 'header' | 'closeButton'
>;
