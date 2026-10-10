// The jsdom stand-ins installed by vitest-setup-client.ts behave like the browser APIs they
// replace, so component tests written against them stay valid in a real browser.
import { fireEvent } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import { isTabbable } from '$lib/utils/focus.js';
import {
	CloseWatcherStub,
	closeWatchers,
	mockNotRendered,
	mockRect,
	viewport
} from './jsdom.test-helper.js';

// TypeScript's DOM library does not declare CloseWatcher yet.
const { CloseWatcher } = window as unknown as { CloseWatcher: typeof CloseWatcherStub };

describe('CloseWatcher', () => {
	test('is installed on window', () => {
		expect('CloseWatcher' in window).toBe(true);
		expect(CloseWatcher).toBe(CloseWatcherStub);
	});

	test('a close request fires cancel, then close, then deactivates the watcher', () => {
		const watcher = new CloseWatcher();
		const events: string[] = [];
		watcher.oncancel = (event: Event) => events.push(`cancel:${event.cancelable}`);
		watcher.addEventListener('close', () => events.push('close'));
		expect(closeWatchers.requestClose()).toBe(true);
		expect(events).toEqual(['cancel:true', 'close']);
		expect(closeWatchers.active).toEqual([]);
		expect(closeWatchers.requestClose()).toBe(false);
	});

	test('preventing cancel keeps the watcher alive, unless the request is not cancelable', () => {
		const watcher = new CloseWatcher();
		const onclose = vi.fn();
		watcher.oncancel = (event: Event) => event.preventDefault();
		watcher.onclose = onclose;
		expect(closeWatchers.requestClose()).toBe(false);
		expect(onclose).not.toHaveBeenCalled();
		expect(closeWatchers.active).toEqual([watcher]);
		expect(closeWatchers.requestClose({ cancelable: false })).toBe(true);
		expect(onclose).toHaveBeenCalledOnce();
	});

	test('a close request reaches only the newest active watcher', () => {
		const older = new CloseWatcher();
		const newer = new CloseWatcher();
		const closed: string[] = [];
		older.onclose = () => closed.push('older');
		newer.onclose = () => closed.push('newer');
		closeWatchers.requestClose();
		expect(closed).toEqual(['newer']);
		closeWatchers.requestClose();
		expect(closed).toEqual(['newer', 'older']);
	});

	test('close() skips cancel; destroy() and an aborted signal drop the watcher silently', () => {
		const direct = new CloseWatcher();
		const oncancel = vi.fn();
		direct.oncancel = oncancel;
		direct.close();
		expect(oncancel).not.toHaveBeenCalled();

		const destroyed = new CloseWatcher();
		destroyed.destroy();
		const controller = new AbortController();
		new CloseWatcher({ signal: controller.signal });
		controller.abort();
		expect(closeWatchers.active).toEqual([]);
	});

	test('an Escape keydown nobody prevented becomes a close request, like in Chromium', async () => {
		const watcher = new CloseWatcher();
		const onclose = vi.fn();
		watcher.onclose = onclose;
		const prevent = (event: KeyboardEvent) => event.preventDefault();
		window.addEventListener('keydown', prevent, { once: true });
		await fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onclose).not.toHaveBeenCalled();
		await fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onclose).toHaveBeenCalledOnce();
	});
});

describe('visualViewport', () => {
	test('follows the window until a test sets it, and fires resize and scroll', () => {
		const visual = window.visualViewport!;
		expect(visual.height).toBe(window.innerHeight);
		const onresize = vi.fn();
		const onscroll = vi.fn();
		visual.addEventListener('resize', onresize);
		visual.addEventListener('scroll', onscroll);
		viewport.set({ height: 400 });
		expect(visual.height).toBe(400);
		expect(onresize).toHaveBeenCalledOnce();
		expect(onscroll).not.toHaveBeenCalled();
		viewport.set({ offsetTop: 120 });
		expect(visual.offsetTop).toBe(120);
		expect(visual.pageTop).toBe(window.scrollY + 120);
		expect(onscroll).toHaveBeenCalledOnce();
		visual.removeEventListener('resize', onresize);
		visual.removeEventListener('scroll', onscroll);
	});

	test('is reset between tests', () => {
		expect(window.visualViewport!.height).toBe(window.innerHeight);
		expect(window.visualViewport!.offsetTop).toBe(0);
	});

	test('resizeWindow moves the layout viewport and fires resize on window', () => {
		const onresize = vi.fn();
		window.addEventListener('resize', onresize, { once: true });
		viewport.resizeWindow(390, 844);
		expect([window.innerWidth, window.innerHeight]).toEqual([390, 844]);
		expect(window.visualViewport!.width).toBe(390);
		expect(onresize).toHaveBeenCalledOnce();
	});
});

describe('element rects', () => {
	test('every element reports one client rect by default, so it counts as rendered', () => {
		const button = document.createElement('button');
		document.body.append(button);
		expect(button.getClientRects()).toHaveLength(1);
		expect(isTabbable(button)).toBe(true);
		button.remove();
	});

	test('mockRect gives one element a layout box', () => {
		const panel = document.createElement('div');
		mockRect(panel, { x: 10, y: 20, width: 200, height: 120 });
		const rect = panel.getBoundingClientRect();
		expect([rect.left, rect.top, rect.right, rect.bottom]).toEqual([10, 20, 210, 140]);
		expect(panel.getClientRects().item(0)?.width).toBe(200);
		expect([panel.offsetWidth, panel.offsetHeight]).toEqual([200, 120]);
	});

	test('mockNotRendered makes an element look hidden by CSS to the focus helpers', () => {
		const shown = document.createElement('button');
		const hidden = document.createElement('button');
		document.body.append(shown, hidden);
		mockNotRendered(hidden);
		expect(hidden.getClientRects()).toHaveLength(0);
		expect(hidden.getBoundingClientRect().width).toBe(0);
		expect(isTabbable(shown)).toBe(true);
		expect(isTabbable(hidden)).toBe(false);
		shown.remove();
		hidden.remove();
	});
});
