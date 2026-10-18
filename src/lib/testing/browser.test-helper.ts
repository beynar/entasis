// Helpers for `*.browser.test.ts` (Vitest browser mode, Chromium and WebKit through Playwright).
// Input goes through `userEvent` from `vitest/browser`: real, trusted key and pointer events with
// the engine's own focus navigation, hit testing and default actions.
import { server, userEvent } from 'vitest/browser';

/** Engine running the current test. */
export const engine = server.browser as 'chromium' | 'webkit' | 'firefox';

/**
 * WebKit on a Linux host (the GitHub runners). A few overlay tests never settle there: a closed
 * alert dialog is not removed and a drawer's resting transform is not applied, while the same tests
 * pass in Chromium on that runner, in WebKit on macOS and in WebKit in a local Linux container.
 * Those tests skip on it until the cause is found; see the comment at each skip.
 */
export const webkitOnLinux = engine === 'webkit' && server.platform === 'linux';

// WebKit on macOS follows the system's keyboard-navigation setting, off by default: plain Tab
// only visits text fields and lists, Option+Tab visits every focusable element. Linux WebKit
// (CI) and Chromium move through every element with plain Tab.
const tabModifier = engine === 'webkit' && server.platform === 'darwin' ? '{Alt>}' : '';
const tabModifierUp = tabModifier ? '{/Alt}' : '';

/** A real Tab (or Shift+Tab) that reaches buttons and links in every engine. */
export async function tab({ shift = false }: { shift?: boolean } = {}) {
	const shiftDown = shift ? '{Shift>}' : '';
	const shiftUp = shift ? '{/Shift}' : '';
	await userEvent.keyboard(`${tabModifier}${shiftDown}{Tab}${shiftUp}${tabModifierUp}`);
}

/** Resolve after the next rendered frame. */
export const nextFrame = () =>
	new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Wait for every running finite animation in the document (enter/exit transitions) to end. */
export async function animationsSettled() {
	await nextFrame();
	await Promise.all(
		document
			.getAnimations()
			.filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
			.map((animation) => animation.finished.catch(() => undefined))
	);
}

/** Focus order from real Tab presses, starting after `start`, until focus leaves `within`. */
export async function tabSequence(start: HTMLElement, within: Element, limit = 50) {
	start.focus();
	const order: Element[] = [];
	for (let step = 0; step < limit; step += 1) {
		await tab();
		const active = document.activeElement;
		if (!active || !within.contains(active) || order.includes(active)) break;
		order.push(active);
	}
	return order;
}
