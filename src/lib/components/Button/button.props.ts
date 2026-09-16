import type { Sizes, Colors } from '$lib/types/theme.js';
import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ButtonThemeProps } from './button.theme.js';
import type {
	HTMLAnchorAttributes,
	HTMLButtonAttributes,
	MouseEventHandler,
	PointerEventHandler
} from 'svelte/elements';

export type ButtonVariant = 'solid' | 'outline' | 'soft' | 'ghost' | 'link';
type ButtonForwardedAttributes = Pick<
	HTMLButtonAttributes,
	'id' | 'type' | 'tabindex' | 'onpointermove'
>;
type ButtonEventAttributes = {
	/** Native click handler receiving the root element's MouseEvent. */
	onclick?: MouseEventHandler<HTMLElement> | null;
	/** Native pointer-enter handler receiving the root element's PointerEvent. */
	onpointerenter?: PointerEventHandler<HTMLElement> | null;
	/** Native pointer-leave handler receiving the root element's PointerEvent. */
	onpointerleave?: PointerEventHandler<HTMLElement> | null;
};
type ButtonForwardedAnchorAttributes = Pick<HTMLAnchorAttributes, 'download'>;
export type ButtonPrimitiveProps = WithAttachments<
	WithSlot<
		{
			/**
			 * Accessible name, applied as `aria-label` on the root element. A Button paints its
			 * visible text with `children`, so `label` is free to name an icon-only button (or to
			 * override the rendered text for assistive technology).
			 */
			label?: string;
			/**
			 * ARIA role override. Defaults to `button` (or `link` when `href`/`as` is set).
			 * Pass `menuitem` when the button is an item inside a `menu`.
			 */
			role?: string;
			/**
			 * Toggle state of a button that stays on or off — a bold button in a toolbar, a
			 * "show password" eye. Rendered as `aria-pressed`.
			 */
			pressed?: boolean;
			/**
			 * Chosen state of a button acting as one option among several — a tab, a listbox
			 * option. Rendered as `aria-selected`.
			 */
			selected?: boolean;
			/**
			 * Whether the surface this button opens is currently showing. Rendered as
			 * `aria-expanded`. A svelai surface (Popover, PopupMenu, Select, Combobox) sets this
			 * on its own trigger; pass it only for a surface you open yourself.
			 */
			expanded?: boolean;
			/**
			 * What the surface this button opens contains, when it is a trigger. Rendered as
			 * `aria-haspopup`. A svelai surface sets this on its own trigger.
			 */
			haspopup?: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | true;
			/**
			 * Bindable reference to the root button or anchor element.
			 */
			ref?: HTMLElement | null;
			/**
			 * When set, renders as an anchor link instead of a button.
			 */
			href?: string;
			/**
			 * When true, shows a spinner overlay and disables pointer events.
			 */
			loading?: boolean;
			/**
			 * When true, applies square aspect-ratio padding.
			 */
			squared?: boolean;
			/**
			 * Theme color token applied to the button styling.
			 */
			color?: Colors;
			/**
			 * Visual style variant of the button.
			 */
			variant?: ButtonVariant;
			/**
			 * Size token controlling padding, typography, and icon spacing.
			 */
			size?: Sizes;
			/**
			 * When true, expands the button to full container width.
			 */
			fullWidth?: boolean;
			/**
			 * When true, prevents interaction and applies disabled styles.
			 */
			disabled?: boolean;
			/**
			 * The class name of the button. First element that the component outputs in the DOM.
			 */
			class?: string;
			/**
			 * Link target attribute when href is set.
			 */
			target?: string;
			/**
			 * Link rel attribute when href is set.
			 */
			rel?: string;
			/**
			 * When set, renders the root element as an anchor instead of a button.
			 */
			as?: 'string';
			/**
			 * Theme overrides for button parts such as prefix and suffix.
			 */
			theme?: ButtonThemeProps;
			/**
			 * Active state marker used by composed controls for styling.
			 */
			'data-active'?: 'true';
			/**
			 * Virtual-focus marker consumed by the shared state layer.
			 */
			'data-highlighted'?: 'true';
			/** Semantic part name used by composed components and theme tooling. */
			'data-slot'?: string;
		} & ButtonForwardedAttributes &
			ButtonForwardedAnchorAttributes &
			ButtonEventAttributes,
		'suffix' | 'prefix' | 'children'
	>
>;

export type ButtonProps = Omit<ButtonPrimitiveProps, 'as'>;

/**
 * Button props plus the id plumbing the library wires between a surface and its own trigger.
 * Deliberately absent from the package's public exports: `controls` is an element id the
 * consumer never has to know, because the surface that owns the trigger supplies it.
 */
export type ButtonInternalProps = ButtonPrimitiveProps & {
	/** DOM id of the surface this button controls while it is open; rendered as `aria-controls`. */
	controls?: string;
};
