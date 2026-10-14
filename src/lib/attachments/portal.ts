import type { Attachment } from 'svelte/attachments';

/** What `<Theme portalContainer>` accepts: a container, or a function that finds it later. */
export type PortalContainerSource =
	HTMLElement | ShadowRoot | (() => HTMLElement | ShadowRoot | null | undefined);

type ContainerSource = () => PortalContainerSource | undefined;

const sources: ContainerSource[] = [];

/**
 * Registers where `<Theme portalContainer>` is read from, for the lifetime of a Theme. `portal()`
 * runs inside an attachment, where `getContext` is unavailable, so the mounted Theme is found the
 * way `prefersReducedMotion()` finds it: the most recently mounted one that sets a container.
 */
export function registerPortalContainer(source: ContainerSource) {
	sources.push(source);
	return () => {
		const index = sources.lastIndexOf(source);
		if (index >= 0) sources.splice(index, 1);
	};
}

const configuredContainer = (): HTMLElement | ShadowRoot | null => {
	for (let index = sources.length - 1; index >= 0; index -= 1) {
		const source = sources[index]();
		const container = typeof source === 'function' ? source() : source;
		if (container?.isConnected) return container;
	}
	return null;
};

/**
 * The node `portal()` mounts `node` into: the Theme's `portalContainer`, else the shadow root
 * the node renders in (its panels keep the styles adopted there), else `document.body`.
 */
export function resolvePortalContainer(node: Node): HTMLElement | ShadowRoot | null {
	const configured = configuredContainer();
	if (configured) return configured;
	const root = node.getRootNode();
	if (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) return root;
	return node.ownerDocument?.body ?? null;
}

/**
 * Moves the node to the Theme's portal container (`document.body` by default, the shadow root
 * when rendered inside one) or to `target`, on mount, and removes it on destroy.
 * Use as an attachment: `{@attach portal()}` or `{@attach portal(targetEl)}`.
 */
export function portal(target?: Element): Attachment<HTMLElement> {
	return (node) => {
		const mount = target ?? resolvePortalContainer(node);
		if (!mount) return;
		mount.appendChild(node);
		return () => node.remove();
	};
}
