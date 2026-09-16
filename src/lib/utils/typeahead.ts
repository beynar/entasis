// Type-to-select for menus, listboxes and radio-like groups (the Radix/WAI-ARIA algorithm):
// printable keys accumulate for one second; the match is the next item whose text starts
// with the buffer, searching from the current item and wrapping. Repeating one letter
// cycles through items starting with it.
export interface TypeaheadOptions<Item> {
	getItems: () => Item[];
	getText: (item: Item) => string;
	getCurrentIndex: () => number;
	onMatch: (index: number, item: Item) => void;
	/** Milliseconds of silence before the buffer resets. */
	timeout?: number;
}

const isTextEntry = (target: EventTarget | null) =>
	typeof HTMLElement !== 'undefined' &&
	target instanceof HTMLElement &&
	(target.isContentEditable ||
		target.tagName === 'TEXTAREA' ||
		(target.tagName === 'INPUT' &&
			!['button', 'checkbox', 'radio', 'range', 'submit', 'reset'].includes(
				(target as HTMLInputElement).type
			)));

export function createTypeahead<Item>(options: TypeaheadOptions<Item>) {
	let buffer = '';
	let timer: ReturnType<typeof setTimeout> | null = null;

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

		if (timer) clearTimeout(timer);
		timer = setTimeout(reset, options.timeout ?? 1000);

		const items = options.getItems();
		if (items.length === 0) return false;
		buffer += event.key.toLowerCase();
		const repeated = buffer.length > 1 && [...buffer].every((c) => c === buffer[0]);
		const needle = repeated ? buffer[0] : buffer;
		const current = options.getCurrentIndex();
		// A growing buffer may still match the current item; a repeated letter must move on.
		const start = repeated || buffer.length === 1 ? current + 1 : current;

		for (let step = 0; step < items.length; step += 1) {
			const index = (((start + step) % items.length) + items.length) % items.length;
			if (options.getText(items[index]).trim().toLowerCase().startsWith(needle)) {
				options.onMatch(index, items[index]);
				return true;
			}
		}
		return true;
	};

	return { handleKey, reset };
}
