/**
 * A polite live region's message, wired so repeats are actually re-read.
 *
 * Screen readers only announce a live region when its text *changes*, so the same
 * message twice in a row would be silent. Blanking the region first and setting the
 * text in a microtask forces the change; a revision counter drops stale microtasks so
 * a burst of announcements settles on the last one and a disposed owner announces
 * nothing at all.
 */
export const useLiveAnnouncer = (baseId: string, suffix = 'live') => {
	const regionId = `${baseId}-${suffix}`;
	let message = $state('');
	let revision = 0;

	return {
		/** `id` for the live region element; owners expose it as `aria-*` targets. */
		regionId,
		get message() {
			return message;
		},
		announce(next: string): void {
			const current = ++revision;
			message = '';
			queueMicrotask(() => {
				if (current === revision) message = next;
			});
		},
		/** Clears the region and cancels any pending announcement. */
		reset(): void {
			revision += 1;
			message = '';
		}
	};
};

export type LiveAnnouncer = ReturnType<typeof useLiveAnnouncer>;
