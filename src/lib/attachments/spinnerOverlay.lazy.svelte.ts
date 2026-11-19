// `spinnerOverlay` for a host that rarely loads (Button): the overlay, the spinner and their
// classes are fetched the first time a host of the page loads, instead of with every button.
import type { Attachment } from 'svelte/attachments';
import type { SpinnerOverlayOptions } from './spinnerOverlay.svelte.js';

type SpinnerOverlayModule = typeof import('./spinnerOverlay.svelte.js');

let loaded = $state.raw<SpinnerOverlayModule | null>(null);
let request: Promise<void> | null = null;

/**
 * The `spinnerOverlay` attachment for these options, or nothing while its code is not there yet.
 * Call it where the attachment is written (`{@attach lazySpinnerOverlay({ loading })}`): the
 * expression runs again when the code arrives, and the overlay then shows.
 */
export function lazySpinnerOverlay(
	opts: SpinnerOverlayOptions
): Attachment<HTMLElement> | undefined {
	// Read first, so a host that asked for the overlay is called again once it is loaded.
	if (loaded) return loaded.spinnerOverlay(opts);
	if (opts.loading) {
		request ??= import('./spinnerOverlay.svelte.js').then((module) => {
			loaded = module;
		});
	}
	return undefined;
}
