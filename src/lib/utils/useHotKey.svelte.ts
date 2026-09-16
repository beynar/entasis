import { untrack } from 'svelte';
import { on } from 'svelte/events';

export type HotKeyModifier = 'mod' | 'alt' | 'ctrl' | 'shift';

type Letter =
	| 'a'
	| 'b'
	| 'c'
	| 'd'
	| 'e'
	| 'f'
	| 'g'
	| 'h'
	| 'i'
	| 'j'
	| 'k'
	| 'l'
	| 'm'
	| 'n'
	| 'o'
	| 'p'
	| 'q'
	| 'r'
	| 's'
	| 't'
	| 'u'
	| 'v'
	| 'w'
	| 'x'
	| 'y'
	| 'z';
type Key =
	| Letter
	| 'tab'
	| 'enter'
	| 'backspace'
	| 'space'
	| 'escape'
	| 'arrowup'
	| 'arrowdown'
	| 'arrowleft'
	| 'arrowright'
	| `f${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`;

export type SingleModifierCombination = `${HotKeyModifier}+${Key}`;
export type DoubleModifierCombination =
	| `mod+alt+${Key}`
	| `mod+ctrl+${Key}`
	| `mod+shift+${Key}`
	| `alt+ctrl+${Key}`
	| `alt+shift+${Key}`
	| `ctrl+shift+${Key}`;

export type HotKeyCombination = Key | SingleModifierCombination | DoubleModifierCombination;

const escapedKeys = new Set(['shift']);

type HotKeysOptions = {
	hotKeys: Partial<Record<HotKeyCombination, (event: KeyboardEvent) => void>>;
	isActive: boolean;
	onWindow?: boolean;
};

export const useHotKey = (opts: HotKeysOptions) => {
	let offWindow: (() => void) | null;
	let offRef: (() => void) | null;
	const getCombination = (event: KeyboardEvent) => {
		const { ctrlKey, altKey, shiftKey, metaKey, key: KEY } = event;
		const key = KEY.toLowerCase();
		let combination = '';

		// Is modifier
		if (ctrlKey || metaKey) {
			combination += 'mod+';
		}
		// Is alt
		if (altKey) {
			combination += 'alt+';
		}
		// Is ctrl
		if (ctrlKey && !metaKey) {
			combination += 'ctrl+';
		}
		// Is shift
		if (shiftKey) {
			combination += 'shift+';
		}

		if (!escapedKeys.has(key)) {
			combination += key;
		}

		// Remove trailing plus if it exists
		combination = combination.replace(/\+$/, '');

		return combination as HotKeyCombination;
	};

	const isHotkey = (event: KeyboardEvent) => {
		const combination = getCombination(event);
		const hotKey = opts.hotKeys[combination];
		if (hotKey) {
			event.preventDefault();
			event.stopPropagation();
			hotKey(event);
		}
	};

	$effect(() => {
		if (opts.isActive && !offWindow && opts.onWindow !== false) {
			offWindow = on(window, 'keydown', isHotkey);
		} else {
			offWindow?.();
			offWindow = null;
		}
		return () => {
			offWindow?.();
			offWindow = null;
		};
	});

	return {
		reference: (ref: HTMLElement) => {
			if (!opts.isActive) return null;
			return untrack(() => {
				ref.tabIndex = 0;
				if (!opts.isActive) return;
				offRef?.();
				offWindow?.();
				const off = on(ref, 'keydown', isHotkey);
				offRef = off;
				return () => {
					off?.();
					offRef = null;
				};
			});
		}
	};
};
