<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { onDestroy, tick } from 'svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import type { ContextMenuProps } from './contextMenu.props.js';
	import type { PopupMenuProps } from '../PopupMenu/popupMenu.props.js';
	import { useContextMenuTheme } from './contextMenu.theme.js';
	import { createOpenChangeDetails, type OpenChangeDetails } from '$lib/utils/openChange.js';

	let {
		items,
		children,
		menu,
		disabled = false,
		defaultOpen = false,
		open = $bindable(),
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		class: className,
		popup,
		theme,
		...attachments
	}: ContextMenuProps = $props();
	const classes = $derived(useContextMenuTheme(theme));
	// How long a touch holds before it opens the menu, how far the finger may drift meanwhile (and
	// how far from the anchor a second right-click still counts as the same spot), and how long
	// after the finger lifts a native `contextmenu` is still taken for part of that touch.
	const LONG_PRESS_MS = 500;
	const GESTURE_TOLERANCE = 8;
	const TOUCH_GESTURE_MS = 700;
	// How long after the press that closed the menu its `contextmenu` still counts as part of it.
	const SECONDARY_PRESS_MS = 1000;
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);

	// A floating-ui virtual element: a zero-size rect at the cursor, so the menu anchors to the
	// pointer rather than the target element.
	let reference = $state<{ getBoundingClientRect: () => DOMRect } | null>(null);

	// Below and after the pointer unless `popup.position` says otherwise. A responsive record keeps
	// that default below its first breakpoint, where Popover would otherwise fall back to `top`.
	const position = $derived.by((): PopupMenuProps['position'] => {
		const requested = popup?.position;
		if (typeof requested !== 'object' || requested === null) return requested ?? 'bottom-start';
		return { ...requested, xs: requested.xs ?? 'bottom-start' };
	});

	// Shifted back into the layout viewport, not the visual one, so the menu stays where it
	// opened while a pinch-zoomed page pans. Submenus keep the default.
	const collisionBoundary = $derived(popup?.collisionBoundary ?? 'layoutViewport');

	// Also the PopupMenu's `onOpenChange`: its details (reason, event, `cancel()`) pass through.
	function setOpen(nextOpen: boolean, details: OpenChangeDetails) {
		if (openState.value === nextOpen) return;
		onOpenChange?.(nextOpen, details);
		if (details.isCanceled) return;
		if (!nextOpen) noteSecondaryPress(details);
		openState.value = nextOpen;
	}

	// A right-click on the open menu's anchor reaches the page as a `pointerdown` first, which the
	// layer stack takes for an outside press and closes the menu with, before `contextmenu` fires.
	// That close is remembered so the `contextmenu` that follows is read as the second right-click.
	let secondaryDismissal: { x: number; y: number; at: number } | null = null;
	function noteSecondaryPress({ reason, event }: OpenChangeDetails) {
		secondaryDismissal = null;
		if (reason !== 'outside-press' || !event) return;
		const press = event as Partial<PointerEvent>;
		if (press.pointerType === 'touch' || (press.button !== 2 && !press.ctrlKey)) return;
		if (press.clientX === undefined || press.clientY === undefined) return;
		secondaryDismissal = { x: press.clientX, y: press.clientY, at: event.timeStamp };
	}
	// Whether this `contextmenu` follows the press that just closed the menu at the same spot.
	function followsDismissal(event: MouseEvent) {
		const dismissal = secondaryDismissal;
		secondaryDismissal = null;
		return (
			dismissal !== null &&
			event.timeStamp - dismissal.at <= SECONDARY_PRESS_MS &&
			Math.hypot(event.clientX - dismissal.x, event.clientY - dismissal.y) <= GESTURE_TOLERANCE
		);
	}

	// The point the open menu is anchored to, so a second right-click near it closes the menu.
	let anchorPoint: { x: number; y: number } | null = null;
	// Whether the open in progress came from the keyboard. The PopupMenu receives `open` as a
	// controlled prop, so it sees every open as one made from code and cannot read the key itself:
	// a keyboard open asks for the first row, a pointer open leaves the menu container focused.
	let keyboardOpen = $state(false);

	async function openAt(x: number, y: number, event: Event) {
		// Close first so a second request re-mounts the menu at the new point.
		setOpen(false, createOpenChangeDetails({ reason: 'trigger-press', event }));
		await tick();
		anchorPoint = { x, y };
		keyboardOpen = event instanceof KeyboardEvent;
		reference = { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) };
		setOpen(true, createOpenChangeDetails({ reason: 'trigger-press', event }));
	}

	// A press this close to where the open menu was anchored is the same spot again.
	const sameSpot = (x: number, y: number) =>
		anchorPoint !== null && Math.hypot(x - anchorPoint.x, y - anchorPoint.y) <= GESTURE_TOLERANCE;

	function handleContextMenu(event: MouseEvent) {
		if (disabled) return;
		event.preventDefault();
		// Android Chrome follows a long-press with a native `contextmenu`: the gesture's own timer
		// or this event opens the menu, never both.
		if (touch) {
			if (!touch.opened && !touch.cancelled) {
				touch.opened = true;
				cancelPress();
				void openAt(touch.x, touch.y, event);
			}
			return;
		}
		// A second right-click on the spot the menu is anchored to dismisses it.
		const dismissed = followsDismissal(event);
		if (dismissed && sameSpot(event.clientX, event.clientY)) return;
		if (openState.value && sameSpot(event.clientX, event.clientY)) {
			setOpen(false, createOpenChangeDetails({ reason: 'trigger-press', event }));
			return;
		}
		void openAt(event.clientX, event.clientY, event);
	}

	// Shift+F10 and the ContextMenu key open the menu anchored to the focused element.
	function handleKeyDown(event: KeyboardEvent) {
		if (disabled) return;
		if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
		event.preventDefault();
		const rect = (event.target as HTMLElement).getBoundingClientRect();
		void openAt(rect.left + rect.width / 2, rect.bottom, event);
	}

	// Touch has no right-click: a 500 ms press opens the menu at the finger. A finger drifts a
	// little while it presses, so only movement past the tolerance cancels it.
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	let touch: { x: number; y: number; opened: boolean; cancelled: boolean } | null = null;
	let touchEnd: ReturnType<typeof setTimeout> | null = null;
	function cancelPress() {
		if (pressTimer) clearTimeout(pressTimer);
		pressTimer = null;
	}
	function endPress() {
		cancelPress();
		// A native `contextmenu` can arrive just after the finger lifts: the gesture is remembered
		// for a moment so it is not taken for a right-click.
		if (touchEnd) clearTimeout(touchEnd);
		touchEnd = setTimeout(() => {
			touch = null;
			touchEnd = null;
		}, TOUCH_GESTURE_MS);
	}
	function handlePointerDown(event: PointerEvent) {
		if (disabled || event.pointerType !== 'touch') return;
		cancelPress();
		if (touchEnd) clearTimeout(touchEnd);
		touchEnd = null;
		const { clientX, clientY } = event;
		const gesture = { x: clientX, y: clientY, opened: false, cancelled: false };
		touch = gesture;
		pressTimer = setTimeout(() => {
			pressTimer = null;
			if (gesture.opened || gesture.cancelled) return;
			gesture.opened = true;
			void openAt(clientX, clientY, event);
		}, LONG_PRESS_MS);
	}
	function handlePointerMove(event: PointerEvent) {
		if (!touch || !pressTimer) return;
		if (Math.hypot(event.clientX - touch.x, event.clientY - touch.y) <= GESTURE_TOLERANCE) return;
		touch.cancelled = true;
		cancelPress();
	}

	onDestroy(() => {
		cancelPress();
		if (touchEnd) clearTimeout(touchEnd);
	});
</script>

<div
	class={classes.root({ disabled, className })}
	oncontextmenu={handleContextMenu}
	onkeydown={handleKeyDown}
	onpointerdown={handlePointerDown}
	onpointerup={endPress}
	onpointercancel={endPress}
	onpointermove={handlePointerMove}
	{...attachments}
>
	{@render children()}
</div>

<PopupMenu
	{...popup}
	class={classes.panel({ class: popup?.class })}
	trigger={false}
	open={openState.value}
	onOpenChange={setOpen}
	{onAfterOpen}
	{onAfterClose}
	ref={reference}
	{position}
	{collisionBoundary}
	nativeMenu={false}
	menu={{ items, focusOnMount: keyboardOpen ? true : undefined, ...menu }}
/>
