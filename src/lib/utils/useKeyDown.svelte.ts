import { on } from 'svelte/events';

/** Where a handled key was heard: on the referenced element, or on `window` (`onWindow`). */
export type KeyDownSource = 'element' | 'window';

/**
 * Alt, Ctrl or Meta turn a key into a browser or OS shortcut (Alt+← is Back, Cmd+→ jumps to the
 * line end). Shift is not one of them: Shift+Arrow is still the plain key to a widget.
 */
export const hasShortcutModifier = (event: KeyboardEvent) =>
	event.altKey || event.ctrlKey || event.metaKey;

export const useKeyDown = (opts: {
	/** Checked on every key, so a gate that opens after mount still lets keys through. */
	isActive: () => boolean;
	callback: (event: KeyboardEvent, source: KeyDownSource) => void;
	keys: string[];
	onWindow?: () => boolean;
	preventDefault?: boolean;
	/**
	 * Leave keys pressed with Alt, Ctrl or Meta to the browser: no `preventDefault` and no
	 * callback. Shift still counts as the plain key. Default `false`.
	 */
	ignoreModifiers?: boolean;
}) => {
	const handle = (event: KeyboardEvent, source: KeyDownSource) => {
		if (!opts.keys.includes(event.key) || !opts.isActive()) return;
		if (opts.ignoreModifiers && hasShortcutModifier(event)) return;
		if (opts.preventDefault !== false) {
			event.preventDefault();
		}
		opts.callback(event, source);
	};

	$effect(() => {
		if (opts.isActive() && opts.onWindow?.()) {
			return on(window, 'keydown', (event) => handle(event, 'window'));
		}
	});

	return {
		/**
		 * Listens on `ref` for as long as it is attached; keys typed while `isActive()` is false are
		 * ignored. Attach it untracked: it reads no reactive state, so it never needs to re-run.
		 */
		reference: (ref: HTMLElement) => on(ref, 'keydown', (event) => handle(event, 'element'))
	};
};
