// Attributes that several popups write on one shared trigger (a menu and its tooltip, a dialog
// and its tooltip). Every writer goes through a claim, so one popup closing never strips the
// hook another still holds. No floating-ui here: Dialog and the form triggers import it too.
import type { Attachment } from 'svelte/attachments';

/** The owners claiming each attribute on each anchor element, in the order they last claimed. */
const anchorAttributeClaims = new WeakMap<HTMLElement, Map<string, Map<object, string>>>();

/**
 * Sets an attribute on an anchor for one owner: the anchor shows the value of the owner that
 * claimed it last, and loses the attribute only when no owner claims it. Several popovers (a menu
 * and its tooltip) can share one trigger; one closing must not strip the others' hook.
 * Pass `null` to withdraw the owner's claim.
 */
export const claimAnchorAttribute = (
	anchor: HTMLElement,
	owner: object,
	name: string,
	value: string | null
) => {
	let byName = anchorAttributeClaims.get(anchor);
	let claims = byName?.get(name);
	if (value === null) {
		claims?.delete(owner);
	} else {
		if (!byName) anchorAttributeClaims.set(anchor, (byName = new Map()));
		if (!claims) byName.set(name, (claims = new Map()));
		claims.delete(owner);
		claims.set(owner, value);
	}
	const current = claims && [...claims.values()].at(-1);
	if (current !== undefined) anchor.setAttribute(name, current);
	else anchor.removeAttribute(name);
};

/** `data-popup-side` on an anchor for one owner; see `claimAnchorAttribute`. */
export const claimPopupSide = (anchor: HTMLElement, owner: object, side: string | null) =>
	claimAnchorAttribute(anchor, owner, 'data-popup-side', side);

/** `data-popup-open` on an anchor for one owner while its popup is open; see `claimAnchorAttribute`. */
export const claimPopupOpen = (anchor: HTMLElement, owner: object, open: boolean) =>
	claimAnchorAttribute(anchor, owner, 'data-popup-open', open ? '' : null);

/**
 * Claims `data-popup-open` on its element while `open` holds (`{@attach popupOpenClaim(open)}`),
 * for a trigger whose popup is not anchored to it, such as a Select button inside its field.
 * Writing the attribute from the template instead would let a tooltip on the same element remove
 * it when the tooltip closes.
 */
export const popupOpenClaim =
	(open: boolean): Attachment<HTMLElement> =>
	(node) => {
		if (!open) return;
		const owner = {};
		claimPopupOpen(node, owner, true);
		return () => claimPopupOpen(node, owner, false);
	};
