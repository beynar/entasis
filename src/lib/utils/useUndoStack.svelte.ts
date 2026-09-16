/**
 * Past/future storage for the components that own an undo/redo history (EventCalendar, GanttChart).
 *
 * The stack owns the two stacks, the entry limit and the revision signal that makes `canUndo` /
 * `canRedo` re-run. Everything model-specific stays with the owner: what an entry holds, whether an
 * entry is still valid, and how a snapshot is restored. Owners move entries themselves once their
 * restore succeeded, which keeps a rejected restore from touching the stacks.
 */

/** Model signatures of the state an entry moves away from and the state it moves to. */
export type UndoStackSignature = Readonly<{ before: string; after: string }>;

export type UndoStackOptions<TEntry> = {
	/** Maximum entries kept on the undo stack. Read fresh on every push, never validated here. */
	limit: () => number;
	/**
	 * Optional. When given, a push whose `before` signature does not continue the newest entry's
	 * `after` signature drops the past: the model moved outside of the recorded chain, so the older
	 * entries can no longer be replayed. Owners without a signature concept simply omit it.
	 */
	signatureOf?: (entry: TEntry) => UndoStackSignature;
};

export type UndoStack<TEntry> = {
	/** Oldest first; the newest entry is the one `undo()` moves. */
	readonly past: readonly TEntry[];
	/** Oldest first; the newest entry is the one `redo()` moves. */
	readonly future: readonly TEntry[];
	/** Bumped by every change, including `touch()` for in-place entry edits. */
	readonly revision: number;
	peekPast(): TEntry | undefined;
	peekFuture(): TEntry | undefined;
	/** Appends an entry, drops the redo stack, and trims the oldest entries past `limit()`. */
	push(entry: TEntry): void;
	/** Moves the newest past entry onto the future stack. */
	undo(): void;
	/** Moves the newest future entry back onto the past stack. */
	redo(): void;
	/** Drops the last occurrence of `entry` from the past stack; leaves the future stack alone. */
	remove(entry: TEntry): void;
	clearPast(): void;
	clearFuture(): void;
	/** Signals that an entry changed in place so `canUndo` / `canRedo` re-run. */
	touch(): void;
};

export const useUndoStack = <TEntry>(options: UndoStackOptions<TEntry>): UndoStack<TEntry> => {
	let past = $state.raw<TEntry[]>([]);
	let future = $state.raw<TEntry[]>([]);
	let revision = $state(0);

	// `limit` may shrink between pushes, so trim against the whole stack rather than by one entry.
	const trim = (entries: TEntry[]): TEntry[] => {
		const limit = options.limit();
		return entries.length > limit ? entries.slice(entries.length - limit) : entries;
	};

	return {
		get past() {
			return past;
		},
		get future() {
			return future;
		},
		get revision() {
			return revision;
		},
		peekPast() {
			void revision;
			return past.at(-1);
		},
		peekFuture() {
			void revision;
			return future.at(-1);
		},
		push(entry) {
			const signatureOf = options.signatureOf;
			if (signatureOf) {
				const previous = past.at(-1);
				if (previous && signatureOf(previous).after !== signatureOf(entry).before) past = [];
			}
			past = trim([...past, entry]);
			future = [];
			revision += 1;
		},
		undo() {
			const entry = past.at(-1);
			if (!entry) return;
			past = past.slice(0, -1);
			future = [...future, entry];
			revision += 1;
		},
		redo() {
			const entry = future.at(-1);
			if (!entry) return;
			future = future.slice(0, -1);
			past = [...past, entry];
			revision += 1;
		},
		remove(entry) {
			const index = past.lastIndexOf(entry);
			if (index < 0) return;
			past = [...past.slice(0, index), ...past.slice(index + 1)];
			revision += 1;
		},
		clearPast() {
			past = [];
			revision += 1;
		},
		clearFuture() {
			future = [];
			revision += 1;
		},
		touch() {
			revision += 1;
		}
	};
};
