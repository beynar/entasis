<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { tick } from 'svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import type { ContextMenuProps } from './contextMenu.props.js';
	import { useContextMenuTheme } from './contextMenu.theme.js';

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

	function setOpen(nextOpen: boolean) {
		if (openState.value === nextOpen) return;
		openState.value = nextOpen;
		onOpenChange?.(nextOpen);
	}

	async function openAt(x: number, y: number) {
		// Close first so a second request re-mounts the menu at the new point.
		setOpen(false);
		await tick();
		reference = { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) };
		setOpen(true);
	}

	function handleContextMenu(event: MouseEvent) {
		if (disabled) return;
		event.preventDefault();
		void openAt(event.clientX, event.clientY);
	}

	// Shift+F10 and the ContextMenu key open the menu anchored to the focused element.
	function handleKeyDown(event: KeyboardEvent) {
		if (disabled) return;
		if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
		event.preventDefault();
		const rect = (event.target as HTMLElement).getBoundingClientRect();
		void openAt(rect.left + rect.width / 2, rect.bottom);
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
			void openAt(clientX, clientY);
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
	position="bottom-start"
	menu={{ items, ...menu }}
/>
