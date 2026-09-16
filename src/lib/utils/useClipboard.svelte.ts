type ClipboardOptions = {
	/** How long `copied` stays true after a successful copy, in ms. Default 2000. */
	timeout?: number;
};

/**
 * Copy-to-clipboard with transient "copied" feedback.
 *
 * Tries the async Clipboard API and falls back to a hidden-textarea `execCommand('copy')`
 * for insecure contexts / unfocused documents where the API is unavailable or rejects.
 * `copied` flips true on success and auto-resets after `timeout`. SSR-safe (guards `navigator`
 * and `document`).
 *
 * Must be called during component init (it registers a teardown `$effect` to clear the timer).
 *
 * ```ts
 * const clipboard = useClipboard();
 * clipboard.copy(text);      // in a click handler
 * clipboard.copied;          // reactive
 * clipboard.reset();         // clear feedback early (e.g. when the source content changes)
 * ```
 */
export const useClipboard = (opts: ClipboardOptions = {}) => {
	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// execCommand fallback for insecure contexts / unfocused documents.
	const legacyCopy = (text: string): boolean => {
		if (typeof document === 'undefined') return false;
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.select();
		let ok: boolean;
		try {
			ok = document.execCommand('copy');
		} catch {
			ok = false;
		}
		textarea.remove();
		return ok;
	};

	const markCopied = () => {
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => {
			copied = false;
		}, opts.timeout ?? 2000);
	};

	/** Clear the "copied" feedback and its timer immediately. */
	const reset = () => {
		clearTimeout(timer);
		copied = false;
	};

	/** Copy `text` to the clipboard; sets `copied` on success and reports the outcome. */
	const copy = async (text: string): Promise<boolean> => {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(text);
				markCopied();
				return true;
			} catch {
				const didCopy = legacyCopy(text);
				if (didCopy) markCopied();
				return didCopy;
			}
		}
		const didCopy = legacyCopy(text);
		if (didCopy) {
			markCopied();
		}
		return didCopy;
	};

	$effect(() => () => clearTimeout(timer));

	return {
		/** Whether a copy succeeded within the last `timeout` ms. Reactive. */
		get copied() {
			return copied;
		},
		copy,
		reset
	};
};
