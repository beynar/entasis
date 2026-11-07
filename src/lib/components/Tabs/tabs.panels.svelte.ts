// Panels a Tabs does not render: elements the app owns (an editor's blocks, a router's views),
// tied to a tab by its value. Tabs links them to their tab for assistive technology and animates
// the switch on them; it never mounts, moves, re-parents or hides them.
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { Attachment } from 'svelte/attachments';

/** What a connected Tabs tells its panels. */
type TabsPanelsHost = {
	/** The id of the tab whose value this is, or `undefined` when no tab has it. */
	tabId: (value: string) => string | undefined;
	/** The id a panel without its own id gets. */
	panelId: (value: string) => string;
};

/**
 * The link between a Tabs and panels it does not render, made by `createTabsPanels()` and passed
 * to `<Tabs panels={…}>`.
 */
export class TabsPanels {
	#elements = new SvelteMap<string, HTMLElement>();
	#exiting = new SvelteSet<string>();
	#host = $state<TabsPanelsHost | null>(null);

	/** @internal Called by the Tabs it is passed to. */
	connect(host: TabsPanelsHost): () => void {
		this.#host = host;
		return () => {
			if (this.#host === host) this.#host = null;
		};
	}

	/**
	 * Whether the panel of `value` is playing its exit, reactive. A renderer that hides inactive
	 * panels keeps this one shown meanwhile, `hidden={value !== active && !panels.isExiting(value)}`,
	 * so the exit is seen; it also carries `data-tabs-exiting` for its layout.
	 */
	isExiting(value: string): boolean {
		return this.#exiting.has(value);
	}

	/** @internal */
	setExiting(value: string, exiting: boolean): void {
		if (exiting) this.#exiting.add(value);
		else this.#exiting.delete(value);
	}

	/** @internal The element tied to `value`, if one is attached. */
	element(value: string): HTMLElement | undefined {
		return this.#elements.get(value);
	}

	/** @internal The id the tab of `value` points at with `aria-controls`; none without a panel. */
	idOf(value: string): string | undefined {
		const element = this.#elements.get(value);
		if (!element) return undefined;
		return element.id || this.#host?.panelId(value);
	}

	/**
	 * Ties an element the caller owns to the tab of `value`: `{@attach panels.panel(value)}`. It
	 * gets `role="tabpanel"`, `aria-labelledby` pointing at its tab and, when it has none, an `id`;
	 * its tab gets `aria-controls`. Nothing else is written: the caller keeps `hidden`, `inert` and
	 * the rest. A replaced element (its owner re-rendered it) is tied again when it is attached.
	 */
	panel = (value: string): Attachment<HTMLElement> => {
		return (node) => {
			const written: string[] = [];
			const write = (name: string, next: string | undefined) => {
				if (next === undefined) node.removeAttribute(name);
				else node.setAttribute(name, next);
			};
			if (!node.id) written.push('id');
			if (node.getAttribute('role') !== 'tabpanel') written.push('role');
			written.push('aria-labelledby');
			this.#elements.set(value, node);

			$effect(() => {
				const host = this.#host;
				if (written.includes('id')) write('id', host?.panelId(value));
				if (written.includes('role')) write('role', host ? 'tabpanel' : undefined);
				write('aria-labelledby', host?.tabId(value));
			});

			return () => {
				if (this.#elements.get(value) === node) this.#elements.delete(value);
				for (const name of written) node.removeAttribute(name);
			};
		};
	};
}

/** Creates the link between a Tabs and panels the caller renders itself; see `TabsPanels`. */
export const createTabsPanels = (): TabsPanels => new TabsPanels();
