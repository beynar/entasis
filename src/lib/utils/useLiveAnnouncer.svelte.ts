import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';

/** `polite` waits for the screen reader to finish; `assertive` interrupts it. */
export type LivePoliteness = 'polite' | 'assertive';

export type LiveAnnouncerOptions = {
	/** @default 'polite' */
	politeness?: LivePoliteness;
};

/** Attributes of a live region element. */
export type LiveRegionAttributes = {
	id: string;
	role: 'status' | 'alert';
	'aria-live': LivePoliteness;
	'aria-atomic': 'true';
};

/**
 * A live region's message, wired so repeats are actually re-read.
 *
 * Screen readers only announce a live region when its text *changes*, so the same
 * message twice in a row would be silent. Blanking the region first and setting the
 * text in a microtask forces the change; a revision counter drops stale microtasks so
 * a burst of announcements settles on the last one and a disposed owner announces
 * nothing at all.
 *
 * The owner renders the region itself, always, so it exists before the first message:
 * `<span class="sr-only" {...announcer.regionAttrs}>{announcer.message}</span>`.
 */
export const useLiveAnnouncer = (
	baseId: string,
	suffix = 'live',
	{ politeness = 'polite' }: LiveAnnouncerOptions = {}
) => {
	const regionId = `${baseId}-${suffix}`;
	const regionAttrs: LiveRegionAttributes = {
		id: regionId,
		role: politeness === 'assertive' ? 'alert' : 'status',
		'aria-live': politeness,
		'aria-atomic': 'true'
	};
	let message = $state('');
	let revision = 0;

	return {
		/** `id` for the live region element; owners expose it as `aria-*` targets. */
		regionId,
		politeness,
		/** `id`, `role`, `aria-live` and `aria-atomic` for the region element. */
		regionAttrs,
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

export type LiveRegionsOptions = {
	/**
	 * How long the regions stay empty after the host mounts before they take text. Screen readers
	 * (Safari's in particular) miss a region that is inserted and filled in quick succession, so a
	 * message announced earlier waits for this delay. @default 100
	 */
	settleDelay?: number;
	/**
	 * Clears a message this long after it was announced, so browsing the page later doesn't land
	 * on stale text. `0` keeps messages until the next one. @default 7000
	 */
	clearAfter?: number;
};

// Inline, so the regions stay hidden without depending on a utility class being compiled.
const VISUALLY_HIDDEN: Record<string, string> = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: '0',
	margin: '-1px',
	overflow: 'hidden',
	clip: 'rect(0, 0, 0, 0)',
	'white-space': 'nowrap',
	border: '0'
};

/**
 * A persistent pair of live regions, one polite (`role="status"`) and one assertive
 * (`role="alert"`), for owners that announce events rather than render them in place
 * (a Toaster announcing each toast, a list announcing its result count).
 *
 * Attach `host` once to an element that is always rendered and stays in the accessibility tree
 * (no `hidden`, `display: none` or `visibility: hidden` ancestor). It inserts both regions empty
 * as soon as it mounts, so they exist before the first announcement, and holds messages until
 * the regions have settled. Removing the host removes the regions.
 */
export const useLiveRegions = (
	baseId: string,
	suffix = 'live',
	{ settleDelay = 100, clearAfter = 7000 }: LiveRegionsOptions = {}
) => {
	const polite = useLiveAnnouncer(baseId, `${suffix}-polite`, { politeness: 'polite' });
	const assertive = useLiveAnnouncer(baseId, `${suffix}-assertive`, {
		politeness: 'assertive'
	});
	const clearTimers: Partial<Record<LivePoliteness, ReturnType<typeof setTimeout>>> = {};

	const cancelClear = (politeness: LivePoliteness) => {
		clearTimeout(clearTimers[politeness]);
		delete clearTimers[politeness];
	};

	const host: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			const ownerDocument = node.ownerDocument;
			const createRegion = (announcer: LiveAnnouncer) => {
				const region = ownerDocument.createElement('div');
				for (const [name, value] of Object.entries(announcer.regionAttrs)) {
					region.setAttribute(name, value);
				}
				region.setAttribute('data-live-region', announcer.politeness);
				for (const [property, value] of Object.entries(VISUALLY_HIDDEN)) {
					region.style.setProperty(property, value);
				}
				node.append(region);
				return region;
			};
			const politeRegion = createRegion(polite);
			const assertiveRegion = createRegion(assertive);

			let settled = $state(settleDelay <= 0);
			const settleTimer =
				settleDelay > 0 ? setTimeout(() => (settled = true), settleDelay) : undefined;

			$effect(() => {
				politeRegion.textContent = settled ? polite.message : '';
			});
			$effect(() => {
				assertiveRegion.textContent = settled ? assertive.message : '';
			});

			return () => {
				clearTimeout(settleTimer);
				cancelClear('polite');
				cancelClear('assertive');
				politeRegion.remove();
				assertiveRegion.remove();
			};
		});

	return {
		polite,
		assertive,
		host,
		/** Announces `message` in the polite region, or the assertive one. */
		announce(message: string, politeness: LivePoliteness = 'polite'): void {
			const announcer = politeness === 'assertive' ? assertive : polite;
			announcer.announce(message);
			cancelClear(politeness);
			if (clearAfter > 0) {
				clearTimers[politeness] = setTimeout(() => {
					delete clearTimers[politeness];
					announcer.reset();
				}, clearAfter);
			}
		},
		/** Clears both regions and cancels pending announcements. */
		reset(): void {
			cancelClear('polite');
			cancelClear('assertive');
			polite.reset();
			assertive.reset();
		}
	};
};

export type LiveRegions = ReturnType<typeof useLiveRegions>;
