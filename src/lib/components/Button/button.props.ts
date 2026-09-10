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
	| 'id'
	| 'type'
	| 'tabindex'
	| 'onpointermove'
	| 'aria-haspopup'
	| 'aria-expanded'
	| 'aria-controls'
	| 'aria-selected'
	| 'aria-pressed'
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
			 * Accessible label applied as aria-label on the root element.
			 */
			label?: string;
			/**
			 * ARIA role override. Defaults to `button` (or `link` when `href`/`as` is set).
			 * Pass `menuitem` when the button is an item inside a `menu`.
			 */
			role?: string;
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
