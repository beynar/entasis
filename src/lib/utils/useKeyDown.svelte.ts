import { on } from 'svelte/events';

export const useKeyDown = (opts: {
	isActive: () => boolean;
	callback: (event: KeyboardEvent) => void;
	keys: string[];
	onWindow?: () => boolean;
	preventDefault?: boolean;
}) => {
	const eventCallback = (event: KeyboardEvent) => {
		if (opts.keys.includes(event.key)) {
			if (opts.preventDefault !== false) {
				event.preventDefault();
			}
			opts.callback(event);
		}
	};

	$effect(() => {
		if (opts.isActive() && opts.onWindow?.()) {
			return on(window, 'keydown', eventCallback);
		}
	});

	return {
		reference: (ref: HTMLElement) => {
			if (opts.isActive() && !opts.onWindow?.()) {
				return on(ref, 'keydown', eventCallback);
			}
		}
	};
};
