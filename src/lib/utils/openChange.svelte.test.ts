// The shared open-change details (CX-1): reasons, interaction types and cancellation. jsdom, for
// real KeyboardEvent / MouseEvent / PointerEvent classes.
import { describe, expect, test, vi } from 'vitest';
import {
	createOpenChangeDetails,
	getInteractionType,
	isOpenChangeDetails,
	requestOpenChange,
	resolveOpenChangeDetails
} from './openChange.js';

describe('getInteractionType', () => {
	test('no event is programmatic', () => {
		expect(getInteractionType()).toBe('programmatic');
		expect(getInteractionType(null)).toBe('programmatic');
	});

	test('keys are keyboard, and so is a virtual click (detail 0, no pointer type)', () => {
		expect(getInteractionType(new KeyboardEvent('keydown', { key: 'Escape' }))).toBe('keyboard');
		expect(getInteractionType(new MouseEvent('click', { detail: 0 }))).toBe('keyboard');
	});

	test('a pointer click reports its pointer type', () => {
		expect(getInteractionType(new MouseEvent('click', { detail: 1 }))).toBe('mouse');
		expect(getInteractionType(new PointerEvent('pointerdown', { pointerType: 'touch' }))).toBe(
			'touch'
		);
		expect(getInteractionType(new PointerEvent('click', { pointerType: 'pen', detail: 1 }))).toBe(
			'pen'
		);
	});

	test('a click without its own pointer type takes the one of the press before it', () => {
		expect(getInteractionType(new MouseEvent('click', { detail: 1 }), 'touch')).toBe('touch');
		// A virtual click stays keyboard whatever pressed before.
		expect(getInteractionType(new MouseEvent('click', { detail: 0 }), 'touch')).toBe('keyboard');
	});

	test('focus is keyboard; other events are programmatic', () => {
		expect(getInteractionType(new FocusEvent('focus'))).toBe('keyboard');
		expect(getInteractionType(new Event('cancel'))).toBe('programmatic');
	});
});

describe('open-change details', () => {
	test('default to an imperative action, with the interaction of their event', () => {
		const details = createOpenChangeDetails();
		expect(details.reason).toBe('imperative-action');
		expect(details.interaction).toBe('programmatic');
		const event = new KeyboardEvent('keydown', { key: 'Escape' });
		expect(createOpenChangeDetails({ reason: 'escape-key', event })).toMatchObject({
			reason: 'escape-key',
			event,
			interaction: 'keyboard'
		});
	});

	test('cancel() marks them cancelled, unless the request cannot be refused', () => {
		const details = createOpenChangeDetails();
		expect(details.isCanceled).toBe(false);
		details.cancel();
		expect(details.isCanceled).toBe(true);

		const forced = createOpenChangeDetails({ reason: 'close-watcher', cancelable: false });
		forced.cancel();
		expect(forced.isCanceled).toBe(false);
	});

	test('resolve passes existing details through and wraps an event or a partial', () => {
		const existing = createOpenChangeDetails({ reason: 'swipe' });
		expect(resolveOpenChangeDetails(existing)).toBe(existing);
		expect(isOpenChangeDetails(existing)).toBe(true);
		expect(isOpenChangeDetails({ reason: 'swipe' })).toBe(false);

		const click = new MouseEvent('click', { detail: 1 });
		expect(resolveOpenChangeDetails(click)).toMatchObject({
			reason: 'imperative-action',
			event: click,
			interaction: 'mouse'
		});
		expect(
			resolveOpenChangeDetails({ reason: 'close-press' }, { reason: 'trigger-press' })
		).toMatchObject({ reason: 'close-press' });
	});

	test('requestOpenChange runs the callback first and reports whether the change may apply', () => {
		const onOpenChange = vi.fn((_open: boolean, details: { cancel(): void }) => details.cancel());
		const details = createOpenChangeDetails();
		expect(requestOpenChange(onOpenChange, false, details)).toBe(false);
		expect(onOpenChange).toHaveBeenCalledWith(false, details);
		expect(requestOpenChange(undefined, true, createOpenChangeDetails())).toBe(true);
	});
});
