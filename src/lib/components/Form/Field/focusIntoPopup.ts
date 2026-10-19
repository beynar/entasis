const FOCUSABLE =
	'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Moves focus into a picker its text field just opened (ArrowDown, as in the APG date picker
 * combobox): onto `preferred` when the panel has it (the selected day, the selected hour), else
 * its first focusable control. The panel mounts a frame or two after opening, so it is looked up
 * until it appears. The field's own action button stays out of the Tab order; this is the
 * keyboard's way into the picker.
 */
export function focusIntoPopup(panel: () => HTMLElement | null, preferred?: string): void {
	let frames = 0;
	const attempt = () => {
		const node = panel();
		const target =
			(preferred ? node?.querySelector<HTMLElement>(preferred) : null) ??
			node?.querySelector<HTMLElement>(FOCUSABLE);
		if (target) {
			target.focus();
			return;
		}
		if (++frames < 30) requestAnimationFrame(attempt);
	};
	requestAnimationFrame(attempt);
}
