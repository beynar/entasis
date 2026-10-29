import type { Attachment } from 'svelte/attachments';

/**
 * A row's `suffix` sits beside its link or button, never inside it, so it may hold its own
 * controls. The row reserves the suffix's measured width at its end, through
 * `--sidebar-suffix-width`, so the label truncates before it. Until the first measurement (on the
 * server, before hydration) the row reserves the suffix's maximum width instead, so the two never
 * overlap.
 */
export function useSidebarSuffixWidth() {
	let width = $state<number>();

	const measure: Attachment<HTMLElement> = (node) => {
		const observer = new ResizeObserver(([entry]) => {
			width = entry?.borderBoxSize?.[0]?.inlineSize ?? node.offsetWidth;
		});
		observer.observe(node);
		return () => observer.disconnect();
	};

	return {
		measure,
		/** The value for `style:--sidebar-suffix-width` on the row. */
		get value() {
			return width === undefined ? undefined : `${width}px`;
		}
	};
}
