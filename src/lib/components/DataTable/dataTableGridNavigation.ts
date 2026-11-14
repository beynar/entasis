import type { Attachment } from 'svelte/attachments';

const INTERACTIVE_SELECTOR =
	'button, a[href], input, select, textarea, [tabindex], [contenteditable="true"]';

const getGridCellControls = (table: HTMLTableElement) =>
	Array.from(table.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)).filter((element) => {
		const cell = element.closest('[role="gridcell"]');
		return cell && cell !== element && !cell.hasAttribute('data-grid-state');
	});

export const dataTableGridNavigation =
	({
		enabled,
		onPointerOutsideCell
	}: {
		enabled: boolean;
		onPointerOutsideCell: () => void;
	}): Attachment<HTMLTableElement> =>
	(table) => {
		if (!enabled) return;

		const originalTabIndexes = new Map<HTMLElement, string | null>();
		const removeFromTabOrder = () => {
			for (const control of getGridCellControls(table)) {
				if (!originalTabIndexes.has(control)) {
					originalTabIndexes.set(control, control.getAttribute('tabindex'));
				}
				if (control.getAttribute('tabindex') !== '-1') control.setAttribute('tabindex', '-1');
			}
		};
		const forgetRemovedControls = (node: Node) => {
			if (!(node instanceof Element)) return;
			if (node.matches(INTERACTIVE_SELECTOR)) originalTabIndexes.delete(node as HTMLElement);
			for (const control of node.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)) {
				originalTabIndexes.delete(control);
			}
		};

		removeFromTabOrder();
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const removedNode of mutation.removedNodes) forgetRemovedControls(removedNode);
			}
			removeFromTabOrder();
		});
		observer.observe(table, { childList: true, subtree: true });
		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			const cell = target.closest('[role="gridcell"]');
			if (cell?.hasAttribute('data-grid-column') && table.contains(cell)) return;
			onPointerOutsideCell();
		};
		table.ownerDocument.addEventListener('pointerdown', handlePointerDown, true);

		return () => {
			observer.disconnect();
			table.ownerDocument.removeEventListener('pointerdown', handlePointerDown, true);
			for (const [control, tabIndex] of originalTabIndexes) {
				if (!control.isConnected) continue;
				if (tabIndex === null) control.removeAttribute('tabindex');
				else control.setAttribute('tabindex', tabIndex);
			}
		};
	};

// Apple platforms jump to the start or end of a document with Command+Home/End (Command+Fn+Left
// and Right on a compact keyboard); elsewhere Control does it, and Meta is the system key.
const isApplePlatform = () => {
	if (typeof navigator === 'undefined') return false;
	const { userAgentData } = navigator as Navigator & { userAgentData?: { platform?: string } };
	return /mac|iphone|ipad|ipod/i.test(userAgentData?.platform || navigator.platform || '');
};

/** Home or End with the platform's document modifier: the first or last row, not only column. */
export const isDocumentJump = (event: KeyboardEvent) =>
	event.ctrlKey || (event.metaKey && isApplePlatform());
