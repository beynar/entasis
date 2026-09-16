/* eslint-disable svelte/prefer-svelte-reactivity -- a registry of DOM nodes is not reactive state. */

/**
 * The element registry behind a roving tab stop.
 *
 * A widget that moves one tab stop around a live list has to answer the same question every time
 * the list changes: the node that had focus just unmounted, so which node gets it back, and when?
 * This keeps the three parts of that answer together — the key → node registry, the pending key a
 * departing node leaves behind, and a restore scheduled on a microtask so the replacement node has
 * a chance to register first.
 *
 * Owners keep their own focused/pending state (each widget models it differently) and describe the
 * restore through `restoreTarget`, which is read at flush time, not when the restore is scheduled.
 */

/** Cancellation domain for scheduled restores: a newer restore supersedes the pending ones. */
export type RovingRestoreVersion = {
	/** Invalidates every restore scheduled so far and returns the new token. */
	bump: () => number;
	isCurrent: (version: number) => boolean;
};

export const createRovingRestoreVersion = (): RovingRestoreVersion => {
	let value = 0;
	return {
		bump: () => (value += 1),
		isCurrent: (version) => version === value
	};
};

export type RovingRegistryOptions<Key> = {
	/** Share one domain between registries whose restores must cancel each other. */
	version?: RovingRestoreVersion;
	/** Keep every node registered under a key (the first one wins) instead of only the last one. */
	multiple?: boolean;
	/** Called as a node unregisters, to stash the key a later registration should restore. */
	onRelease?: (key: Key) => void;
	/** Limits `onRelease` to a node that still owns DOM focus. */
	releaseWhen?: 'focused' | 'always';
	/**
	 * The key a scheduled restore should focus, resolved when the restore flushes: `null` (or
	 * `undefined`) abandons it, and the key it returns need not be the key that was scheduled.
	 */
	restoreTarget: (key: Key | undefined) => Key | null | undefined;
	/** Records the restored key, just before focus moves to its node. */
	onRestore?: (key: Key) => void;
};

export const useRovingRegistry = <Key>(options: RovingRegistryOptions<Key>) => {
	const version = options.version ?? createRovingRestoreVersion();
	const nodes = new Map<Key, Set<HTMLElement>>();
	const nodeFor = (key: Key) => nodes.get(key)?.values().next().value;

	return {
		/** Registers `node` under `key`; the returned callback unregisters exactly that node. */
		register(key: Key, node: HTMLElement): () => void {
			const registered = nodes.get(key) ?? new Set<HTMLElement>();
			// One node per key by default: the newest registration replaces the node it renders over,
			// and the older node's own release then finds nothing left to remove.
			if (!options.multiple) registered.clear();
			registered.add(node);
			nodes.set(key, registered);
			return () => {
				if (
					options.releaseWhen !== 'focused' ||
					(typeof document !== 'undefined' && document.activeElement === node)
				) {
					options.onRelease?.(key);
				}
				registered.delete(node);
				if (registered.size > 0) return;
				// One node per key means the key can already hold its replacement, so only the set this
				// node actually emptied may take the key with it.
				if (options.multiple || nodes.get(key) === registered) nodes.delete(key);
			};
		},
		/** The node focus should move to for `key`, if one is registered. */
		get(key: Key): HTMLElement | undefined {
			return nodeFor(key);
		},
		has(key: Key): boolean {
			return nodes.has(key);
		},
		clear(): void {
			nodes.clear();
		},
		/**
		 * Schedules a restore for the end of the current task, once the nodes that are mounting in
		 * this change have had their chance to register.
		 */
		schedule(key?: Key): void {
			const scheduled = version.bump();
			queueMicrotask(() => {
				if (!version.isCurrent(scheduled)) return;
				const target = options.restoreTarget(key);
				if (target === null || target === undefined) return;
				const element = nodeFor(target);
				if (!element) return;
				options.onRestore?.(target);
				element.focus();
			});
		}
	};
};

export type RovingRegistry<Key> = ReturnType<typeof useRovingRegistry<Key>>;

/**
 * The key that inherits the tab stop after a removal: whatever now sits at the index the removed
 * key held, clamped to the end of the list — and `undefined` once the list is empty.
 */
export const clampRovingKey = <Key>(
	previous: readonly Key[],
	key: Key,
	next: readonly Key[]
): Key | undefined => next[Math.min(Math.max(0, previous.indexOf(key)), next.length - 1)];
