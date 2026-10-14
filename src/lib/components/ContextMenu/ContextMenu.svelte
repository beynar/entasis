<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { tick } from 'svelte';
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
		openState.value = nextOpen;
	}

	async function openAt(x: number, y: number, event: Event) {
		// Close first so a second request re-mounts the menu at the new point.
		setOpen(false, createOpenChangeDetails({ reason: 'trigger-press', event }));
		await tick();
		reference = { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) };
		setOpen(true, createOpenChangeDetails({ reason: 'trigger-press', event }));
	}

	function handleContextMenu(event: MouseEvent) {
		if (disabled) return;
		event.preventDefault();
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

	// Touch has no right-click: a 500 ms press opens the menu at the finger.
	let pressTimer: ReturnType<typeof setTimeout> | null = null;
	function cancelPress() {
		if (pressTimer) clearTimeout(pressTimer);
		pressTimer = null;
	}
	function handlePointerDown(event: PointerEvent) {
		if (disabled || event.pointerType !== 'touch') return;
		cancelPress();
		const { clientX, clientY } = event;
		pressTimer = setTimeout(() => {
			pressTimer = null;
			void openAt(clientX, clientY, event);
		}, 500);
	}
</script>

<div
	class={classes.root({ disabled, className })}
	oncontextmenu={handleContextMenu}
	onkeydown={handleKeyDown}
	onpointerdown={handlePointerDown}
	onpointerup={cancelPress}
	onpointercancel={cancelPress}
	onpointermove={cancelPress}
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
	menu={{ items, ...menu }}
/>
