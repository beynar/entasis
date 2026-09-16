import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';

const LAYOUT_ANIMATION_MS = 300;

export class ResizableLayoutAnimation {
	active = $state(false);
	private timer: ReturnType<typeof setTimeout> | null = null;

	start() {
		if (prefersReducedMotion()) return;

		this.active = true;
		if (this.timer) clearTimeout(this.timer);
		this.timer = setTimeout(() => {
			this.active = false;
			this.timer = null;
		}, LAYOUT_ANIMATION_MS);
	}

	stop() {
		if (this.timer) clearTimeout(this.timer);
		this.timer = null;
		this.active = false;
	}

	destroy() {
		this.stop();
	}
}
