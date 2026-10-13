// The shared trigger contract (AGENTS.md proposed law 4): any element can open a disclosure
// owner's popup. The owner writes `aria-haspopup`, `aria-expanded` and `aria-controls` on it,
// a non-control element becomes a keyboard-reachable button, and a press on it requests the
// change with `reason: 'trigger-press'` unless the element's own handler already acted or called
// `event.preventDefault()`.
import { focusableSelector } from './focus.js';

/** Elements that may carry popup ARIA state. */
export const POPUP_CONTROL =
	'button, a[href], input, select, textarea, summary, [role="button"], [role="link"], [role="combobox"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="tab"], [role="option"], [role="treeitem"], [role="gridcell"], [role="switch"], [role="checkbox"]';

/** Elements the browser already focuses and activates from the keyboard. */
export const NATIVE_CONTROL = 'button, a[href], input, select, textarea, summary';

/** A trigger's popup state, in the library's semantic vocabulary. */
export type PopupTriggerProps = {
	haspopup: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | true;
	expanded: boolean;
	controls: string | undefined;
};

const TRIGGER_ARIA = {
	haspopup: 'aria-haspopup',
	expanded: 'aria-expanded',
	controls: 'aria-controls'
} as const;

/**
 * Writes the popup ARIA attributes on a trigger. Call inside an `$effect` so they follow the
 * state. Only real controls carry them: a wrapper `div` or a presentational `span` used as an
 * anchor must not (axe: aria-allowed-attr).
 */
export function writePopupAria(node: HTMLElement, props: PopupTriggerProps): void {
	if (!node.matches(POPUP_CONTROL)) return;
	for (const [prop, value] of Object.entries(props)) {
		const name = TRIGGER_ARIA[prop as keyof typeof TRIGGER_ARIA];
		if (value === undefined) node.removeAttribute(name);
		else node.setAttribute(name, String(value));
	}
}

export interface TriggerActivationOptions {
	/** Requests the change; called with the click or key event that pressed the trigger. */
	activate: (event: MouseEvent | KeyboardEvent) => void;
	/**
	 * A counter the owner bumps on every open-state request. The press stands down when it moved
	 * while the event was dispatching: the element's own handler (`onclick={popover.toggle}`)
	 * already acted, and acting again would undo it.
	 */
	requests: () => number;
	/** Whether presses act at all (`openOnClick`). Default `true`. */
	enabled?: () => boolean;
}

/**
 * Makes `node` a trigger that activates on click, and on Enter and Space when it is not a native
 * control. A non-control element also gets `role="button"` and `tabindex="0"`. Returns cleanup.
 */
export function triggerActivation(node: HTMLElement, options: TriggerActivationOptions) {
	const nativeControl = node.matches(NATIVE_CONTROL);
	if (!node.matches(POPUP_CONTROL) && !node.hasAttribute('role')) {
		node.setAttribute('role', 'button');
	}
	if (!nativeControl && !node.hasAttribute('tabindex')) node.tabIndex = 0;
	// The element's own handler wins. Svelte delegates `onclick` to the root, so it runs after
	// this listener: the default action waits until the event has finished dispatching, then
	// runs only if nothing cancelled the event or asked for an open state meanwhile.
	let pending: ReturnType<typeof setTimeout> | undefined;
	const press = (event: MouseEvent | KeyboardEvent) => {
		if (options.enabled && !options.enabled()) return;
		const requests = options.requests();
		clearTimeout(pending);
		pending = setTimeout(() => {
			if (event.defaultPrevented || options.requests() !== requests) return;
			options.activate(event);
		});
	};
	const onKeydown = (event: KeyboardEvent) => {
		if (nativeControl || event.target !== node) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		const requests = options.requests();
		clearTimeout(pending);
		pending = setTimeout(() => {
			if (options.requests() !== requests || (options.enabled && !options.enabled())) return;
			options.activate(event);
		});
	};
	node.addEventListener('click', press);
	node.addEventListener('keydown', onKeydown);
	return () => {
		clearTimeout(pending);
		node.removeEventListener('click', press);
		node.removeEventListener('keydown', onKeydown);
	};
}

/**
 * The element focus returns to when a popup opened from `trigger` closes: the trigger when it is
 * focusable, else the focusable element inside it that was pressed or focused (the country button
 * inside a phone field's wrapper), else `null` (the focus scope's own default).
 */
export function triggerFocusTarget(trigger: HTMLElement, event?: Event): HTMLElement | null {
	if (trigger.matches(focusableSelector) && !trigger.matches(':disabled')) return trigger;
	const active = trigger.ownerDocument.activeElement;
	if (active instanceof HTMLElement && active !== trigger && trigger.contains(active))
		return active;
	const target = event?.target;
	if (target instanceof Element) {
		const focusable = target.closest<HTMLElement>(focusableSelector);
		if (focusable && trigger.contains(focusable)) return focusable;
	}
	return null;
}

/** The element that has focus now, or `null` when nothing does (the body). */
export function focusedElement(document: Document = globalThis.document): HTMLElement | null {
	const active = document?.activeElement;
	return active instanceof HTMLElement && active !== document.body ? active : null;
}
