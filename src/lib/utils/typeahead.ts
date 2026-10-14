// Type-to-select for menus, listboxes and radio-like groups (the Radix/WAI-ARIA algorithm):
// printable keys accumulate for one second; the match is the next item whose text starts
// with the buffer, searching from the current item and wrapping. Repeating one letter
// cycles through items starting with it.
export interface TypeaheadOptions<Item> {
	getItems: () => Item[];
	getText: (item: Item) => string;
	getCurrentIndex: () => number;
	onMatch: (index: number, item: Item) => void;
	/**
	 * Items the search steps over, such as disabled or hidden ones: a match on one of them moves
	 * on to the next match instead of ending the search.
	 */
	isItemDisabled?: (item: Item) => boolean;
	/** Milliseconds of silence before the buffer resets. */
	timeout?: number;
}

const nonTextInputTypes = ['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'image'];

/** A field the user types into: text inputs, textareas and contenteditable regions. */
export const isTextEntry = (target: EventTarget | null): target is HTMLElement =>
	typeof HTMLElement !== 'undefined' &&
	target instanceof HTMLElement &&
	(target.isContentEditable ||
		target.tagName === 'TEXTAREA' ||
		(target.tagName === 'INPUT' && !nonTextInputTypes.includes((target as HTMLInputElement).type)));

export function createTypeahead<Item>(options: TypeaheadOptions<Item>) {
	let buffer = '';
	let timer: ReturnType<typeof setTimeout> | null = null;

	/** Empties the buffer and clears its timer; call it on focus-out and on destroy. */
	const reset = () => {
		buffer = '';
		if (timer) clearTimeout(timer);
		timer = null;
	};

	/** Returns true when the key was consumed (caller should `preventDefault`). */
	const handleKey = (event: KeyboardEvent): boolean => {
		if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return false;
		if (isTextEntry(event.target)) return false;
		if (event.key === ' ' && buffer === '') return false; // Space activates, it does not search

		const items = options.getItems();
		if (items.length === 0) return false;

		if (timer) clearTimeout(timer);
		timer = setTimeout(reset, options.timeout ?? 1000);

		buffer += event.key.toLowerCase();
		const repeated = buffer.length > 1 && [...buffer].every((c) => c === buffer[0]);
		const needle = repeated ? buffer[0] : buffer;
		const current = options.getCurrentIndex();
		// A growing buffer may still match the current item; a repeated letter must move on.
		const start = repeated || buffer.length === 1 ? current + 1 : current;

		for (let step = 0; step < items.length; step += 1) {
			const index = (((start + step) % items.length) + items.length) % items.length;
			const item = items[index];
			if (options.isItemDisabled?.(item)) continue;
			if (options.getText(item).trim().toLowerCase().startsWith(needle)) {
				options.onMatch(index, item);
				return true;
			}
		}
		return true;
	};

	return {
		handleKey,
		reset,
		/** True while the buffer holds typed characters (until the timeout or a `reset`). */
		get isTyping() {
			return buffer !== '';
		}
	};
}
