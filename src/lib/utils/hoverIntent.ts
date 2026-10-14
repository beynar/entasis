/**
 * How long after the last hover popup closed the next one still opens without its delay. Matches
 * the tooltip warm-up that predates the shared group.
 */
export const HOVER_WARM_WINDOW_MS = 400;

/** An open hover popup, as the group sees it. */
export type HoverIntentMember = {
	/**
	 * Whether `node` is inside this popup. A trigger inside an open popup (a tooltip in a hover
	 * card, a nested card) is not handed the warm-up by that popup: entering it is not a move
	 * from one hover target to the next.
	 */
	contains?: (node: Node) => boolean;
};

/**
 * Hover warm-up shared by tooltips, hover cards and hover-opened popovers. While one of them is
 * open, and for `windowMs` after the last one closed, the next one opens without its delay, so
 * running the pointer along a toolbar or a row of links does not wait at every stop.
 *
 * Plain fields: the group is read when a pointer arrives, never rendered.
 */
export class HoverIntentGroup {
	readonly windowMs: number;
	readonly #open = new Set<HoverIntentMember>();
	#lastClosedAt: number | null = null;

	constructor(windowMs = HOVER_WARM_WINDOW_MS) {
		this.windowMs = windowMs;
	}

	/**
	 * Counts a popup as open until the returned function runs. Each call is its own membership, so
	 * the same member object can join twice without one leave ending both.
	 */
	join(member: HoverIntentMember = {}): () => void {
		const entry: HoverIntentMember = { contains: member.contains };
		this.#open.add(entry);
		return () => {
			if (!this.#open.delete(entry)) return;
			if (this.#open.size === 0) this.#lastClosedAt = Date.now();
		};
	}

	/** Records a close at `time` for a surface that does not track membership. */
	markClosed(time = Date.now()) {
		this.#lastClosedAt = time;
	}

	/** When the last open popup closed, or `null` before any did. */
	get lastClosedAt(): number | null {
		return this.#lastClosedAt;
	}

	/**
	 * Whether a hover arriving on `trigger` skips its delay: another popup is open (one that does
	 * not contain the trigger), or the last one closed less than `windowMs` ago.
	 */
	isWarm(trigger?: Node | null): boolean {
		for (const member of this.#open) {
			if (!trigger || !member.contains?.(trigger)) return true;
		}
		return this.#lastClosedAt !== null && Date.now() - this.#lastClosedAt < this.windowMs;
	}

	/** `delay`, or 0 while the group is warm for `trigger`. */
	resolveDelay(delay: number, trigger?: Node | null): number {
		return this.isWarm(trigger) ? 0 : delay;
	}
}
