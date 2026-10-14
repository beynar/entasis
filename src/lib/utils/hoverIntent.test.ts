import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { HOVER_WARM_WINDOW_MS, HoverIntentGroup } from './hoverIntent.js';

/** A stand-in for a DOM subtree: `contains` is all the group asks of a member. */
const subtree = (...nodes: object[]) => ({
	contains: (node: Node) => nodes.includes(node)
});
const node = () => ({}) as Node;

describe('HoverIntentGroup', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(10_000);
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	test('is cold until a popup opens, and warm while one is open', () => {
		const group = new HoverIntentGroup();
		expect(group.isWarm()).toBe(false);
		expect(group.resolveDelay(300)).toBe(300);
		const leave = group.join();
		expect(group.isWarm()).toBe(true);
		expect(group.resolveDelay(300)).toBe(0);
		leave();
		expect(group.lastClosedAt).toBe(10_000);
	});

	test('stays warm for the window after the last popup closed', () => {
		const group = new HoverIntentGroup();
		const leaveA = group.join();
		const leaveB = group.join();
		leaveA();
		// B is still open: no close is recorded yet.
		expect(group.lastClosedAt).toBeNull();
		vi.advanceTimersByTime(1_000);
		leaveB();
		vi.advanceTimersByTime(HOVER_WARM_WINDOW_MS - 1);
		expect(group.isWarm()).toBe(true);
		vi.advanceTimersByTime(1);
		expect(group.isWarm()).toBe(false);
	});

	test('a trigger inside an open popup is not handed that popup’s warm-up', () => {
		const group = new HoverIntentGroup();
		const inside = node();
		const outside = node();
		const leave = group.join(subtree(inside));
		expect(group.isWarm(inside)).toBe(false);
		expect(group.isWarm(outside)).toBe(true);
		// Another open popup still warms it.
		const leaveOther = group.join();
		expect(group.isWarm(inside)).toBe(true);
		leaveOther();
		leave();
		// Once closed, the window applies to every trigger.
		expect(group.isWarm(inside)).toBe(true);
	});

	test('each join is its own membership, and a second leave changes nothing', () => {
		const group = new HoverIntentGroup();
		const member = subtree();
		const leaveFirst = group.join(member);
		const leaveSecond = group.join(member);
		leaveFirst();
		leaveFirst();
		expect(group.lastClosedAt).toBeNull();
		leaveSecond();
		expect(group.lastClosedAt).toBe(10_000);
	});

	test('markClosed starts the window for surfaces that do not join', () => {
		const group = new HoverIntentGroup(100);
		group.markClosed();
		expect(group.isWarm()).toBe(true);
		vi.advanceTimersByTime(100);
		expect(group.isWarm()).toBe(false);
		group.markClosed(Date.now() - 50);
		expect(group.isWarm()).toBe(true);
	});
});
