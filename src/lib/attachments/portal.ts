import type { Attachment } from 'svelte/attachments';

/**
 * Moves the node to `document.body` (or `target`) on mount and removes it on destroy.
 * Use as an attachment: `{@attach portal()}` or `{@attach portal(targetEl)}`.
 */
export function portal(target?: Element): Attachment<HTMLElement> {
	return (node) => {
		const mount = target ?? (typeof document !== 'undefined' ? document.body : undefined);
		if (!mount) return;
		mount.appendChild(node);
		return () => node.remove();
	};
}
