import type { Virtualizer } from '@tanstack/svelte-virtual';
import type { AIThreadScrollBehavior } from './aiThread.props.js';

export class AIThreadScrollController {
	private appendFollowFrame: number | undefined;
	private prependSettleFrame: number | undefined;

	scrollToFn = (
		offset: number,
		{ adjustments = 0, behavior }: { adjustments?: number; behavior?: AIThreadScrollBehavior },
		instance: Virtualizer<HTMLDivElement, HTMLElement>
	): void => {
		const scrollElement = instance.scrollElement;
		if (!scrollElement) return;
		const targetOffset = offset + adjustments;
		if (!behavior || behavior === 'auto' || behavior === 'instant') {
			scrollElement.scrollTop = targetOffset;
			return;
		}
		scrollElement.scrollTo({ top: targetOffset, behavior });
	};

	settlePrependedItems(scrollToTarget: () => void, sync: () => void): void {
		this.cancelPrependSettle();
		scrollToTarget();
		this.prependSettleFrame = requestAnimationFrame(() => {
			this.prependSettleFrame = undefined;
			scrollToTarget();
			sync();
		});
	}

	watchAppendFollowEnd(isAtEnd: () => boolean, onEnd: () => void): void {
		this.cancelAppendFollow();
		let frameCount = 0;
		let hasLeftEnd = false;
		const check = () => {
			frameCount += 1;
			const atEnd = isAtEnd();
			if (!atEnd) hasLeftEnd = true;
			if ((atEnd && (hasLeftEnd || frameCount >= 2)) || frameCount >= 120) {
				this.appendFollowFrame = undefined;
				onEnd();
				return;
			}
			this.appendFollowFrame = requestAnimationFrame(check);
		};
		this.appendFollowFrame = requestAnimationFrame(check);
	}

	destroy(): void {
		this.cancelAppendFollow();
		this.cancelPrependSettle();
	}

	private cancelAppendFollow(): void {
		if (this.appendFollowFrame === undefined) return;
		cancelAnimationFrame(this.appendFollowFrame);
		this.appendFollowFrame = undefined;
	}

	private cancelPrependSettle(): void {
		if (this.prependSettleFrame === undefined) return;
		cancelAnimationFrame(this.prependSettleFrame);
		this.prependSettleFrame = undefined;
	}
}
