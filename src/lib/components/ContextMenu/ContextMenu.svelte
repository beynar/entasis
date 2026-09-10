<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { tick } from 'svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import type { ContextMenuProps } from './contextMenu.props.js';

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
		...attachments
	}: ContextMenuProps = $props();
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

	async function handleContextMenu(event: MouseEvent) {
		if (disabled) return;
		event.preventDefault();
		const x = event.clientX;
		const y = event.clientY;
		// Close first so a second right-click re-mounts the menu at the new point.
		setOpen(false);
		await tick();
		reference = { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) };
		setOpen(true);
	}
</script>

<div class={className} oncontextmenu={handleContextMenu} {...attachments}>
	{@render children()}
</div>

<PopupMenu
	{...popup}
	trigger={false}
	open={openState.value}
	onOpenChange={setOpen}
	{onAfterOpen}
	{onAfterClose}
	ref={reference}
	position="bottom-start"
	menu={{ items, ...menu }}
/>
