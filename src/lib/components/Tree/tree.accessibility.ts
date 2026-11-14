// Accessibility glue between Tree's Svelte wrapper and Pierre Trees, which renders the
// `role="tree"` element and its rows inside an open shadow root and owns their keyboard handling.
// The wrapper cannot pass attributes or handlers to that element directly, so it names the tree
// element after each mount, mirrors the horizontal arrows right to left before Pierre Trees reads
// them, and adds first-character typeahead through the public `FileTree` API.
import type { FileTree, FileTreeVisibleRow } from '@pierre/trees';
import { createTypeahead } from '$lib/utils/typeahead.js';

export type TreeName = {
	label?: string | null;
	labelledby?: string | null;
};

const TREE_SELECTOR = '[role="tree"]';

/** The `role="tree"` element Pierre Trees rendered for `fileTree`, when it is mounted. */
export function findTreeElement(fileTree: FileTree | undefined): HTMLElement | null {
	const host = fileTree?.getFileTreeContainer();
	return host?.shadowRoot?.querySelector<HTMLElement>(TREE_SELECTOR) ?? null;
}

const escapeAttribute = (value: string) =>
	value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

/**
 * Adds `aria-label` to the tree element of the server-rendered markup, so the tree has its name
 * before the client mounts. The markup is Pierre Trees' declarative shadow root; its stylesheet
 * also mentions `[role="tree"]`, which is why only an attribute inside an element tag matches.
 * When the markup changes shape upstream nothing matches and the client still names the tree.
 */
export function labelTreeMarkup(markup: string, label: string | null | undefined): string {
	if (!label) return markup;
	return markup.replace(
		/(<div\b[^<>]*\brole="tree")/,
		(tag) => `${tag} aria-label="${escapeAttribute(label)}"`
	);
}

/**
 * Names the tree element. `aria-labelledby` ids cannot cross into the shadow root, so the labels
 * are linked through `ariaLabelledByElements`, which may point from a shadow tree to elements in
 * the page around it. An engine without that reflection gets the labels' text as `aria-label`.
 */
export function nameTreeElement(element: HTMLElement, name: TreeName, scope: Node | null): void {
	const root = scope instanceof Document || scope instanceof ShadowRoot ? scope : document;
	const labels = (name.labelledby ?? '')
		.split(/\s+/)
		.filter(Boolean)
		.map((id) => root.getElementById(id))
		.filter((label): label is HTMLElement => label != null);

	if (labels.length > 0 && 'ariaLabelledByElements' in element) {
		element.ariaLabelledByElements = labels;
	} else if ('ariaLabelledByElements' in element) {
		element.ariaLabelledByElements = null;
	}

	const fallback = labels.length > 0 && !('ariaLabelledByElements' in element);
	const label = fallback
		? labels.map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()).join(' ')
		: name.label;
	if (label) element.setAttribute('aria-label', label);
	else element.removeAttribute('aria-label');
}

/** The row the key event started on, inside Pierre Trees' shadow root. */
function originRow(event: KeyboardEvent): HTMLElement | null {
	const origin = event.composedPath()[0];
	if (!(origin instanceof HTMLElement)) return null;
	return origin.closest<HTMLElement>('[role="treeitem"]');
}

const MIRRORED_KEYS: Record<string, string> = { ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft' };

/**
 * Right to left, the APG tree pattern expands with ArrowLeft and collapses with ArrowRight.
 * Pierre Trees only knows left to right, so in the capture phase, before the event reaches the
 * shadow root, the original arrow is stopped and its mirror is dispatched from the same row.
 * Pierre Trees stops the mirror once it handled it, exactly as it stops the original left to
 * right, and its `preventDefault` is copied back so the page does not scroll sideways.
 */
export function createArrowMirror(isRtl: () => boolean) {
	let dispatching = false;
	return (event: KeyboardEvent) => {
		if (dispatching || !isRtl()) return;
		const key = MIRRORED_KEYS[event.key];
		if (!key) return;
		const row = originRow(event);
		if (!row) return;

		event.stopPropagation();
		const mirrored = new KeyboardEvent('keydown', {
			key,
			code: key,
			bubbles: true,
			cancelable: true,
			composed: true,
			altKey: event.altKey,
			ctrlKey: event.ctrlKey,
			metaKey: event.metaKey,
			shiftKey: event.shiftKey,
			repeat: event.repeat
		});
		dispatching = true;
		try {
			row.dispatchEvent(mirrored);
		} finally {
			dispatching = false;
		}
		if (mirrored.defaultPrevented) event.preventDefault();
	};
}

/**
 * First-character typeahead over the visible rows (the APG tree pattern's recommended
 * behaviour), with the same buffer and wrapping rules as Menu and Select. Pierre Trees opens its
 * search on letters and digits when search is enabled and stops those events, so this handler,
 * which listens in the bubble phase outside the shadow root, only sees keys Pierre Trees left
 * alone. Rename and search inputs are not rows, so typing in them is never intercepted.
 */
export function createTreeTypeahead(getFileTree: () => FileTree | undefined) {
	const typeahead = createTypeahead<FileTreeVisibleRow>({
		getItems: () => {
			const fileTree = getFileTree();
			const count = fileTree?.getVisibleCount() ?? 0;
			return count > 0 ? [...fileTree!.getVisibleRows(0, count - 1)] : [];
		},
		getText: (row) => row.name,
		getCurrentIndex: () => getFileTree()?.getFocusedIndex() ?? -1,
		onMatch: (_index, row) => getFileTree()?.focusPath(row.path)
	});

	return {
		handleKeydown(event: KeyboardEvent) {
			if (event.defaultPrevented || !originRow(event)) return;
			if (typeahead.handleKey(event)) event.preventDefault();
		},
		reset: typeahead.reset
	};
}
