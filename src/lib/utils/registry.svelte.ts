/**
 * A list that components join while they initialise and leave when they are torn down: open
 * layers, a dialog's nested dialogs, a page's shell overrides.
 *
 * The entries live in a plain array mutated in place. Reading a reactive array, filtering it and
 * writing it back is not safe for this: under Svelte's async mode a component torn down in one
 * batch can read state another batch has written as it was before, so a teardown's
 * `list = list.filter(...)` restores the old list and drops every entry added meanwhile. A deep
 * `$state` proxy has its own trouble: it wraps stored objects, so identity checks against the
 * original miss. Each change writes a fresh token instead, which no stale read can equal, and
 * `items` re-reads the array whenever the token moves.
 */
export class Registry<T> {
	readonly #entries: T[] = [];
	#changed = $state.raw({});
	#items = $derived.by(() => {
		void this.#changed;
		return [...this.#entries];
	});

	/** The entries in the order they joined. Reading it subscribes to every change. */
	get items(): readonly T[] {
		return this.#items;
	}

	/** Adds an entry and returns the function that removes it, safe to call more than once. */
	add(entry: T): () => void {
		this.#entries.push(entry);
		this.#changed = {};
		let present = true;
		return () => {
			if (!present) return;
			present = false;
			this.delete(entry);
		};
	}

	delete(entry: T) {
		const index = this.#entries.indexOf(entry);
		if (index < 0) return;
		this.#entries.splice(index, 1);
		this.#changed = {};
	}

	clear() {
		if (this.#entries.length === 0) return;
		this.#entries.length = 0;
		this.#changed = {};
	}
}
