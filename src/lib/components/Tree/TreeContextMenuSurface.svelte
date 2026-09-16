<script lang="ts">
	import { untrack } from 'svelte';
	import { on } from 'svelte/events';
	import Menu from '../Menu/Menu.svelte';
	import type { MenuItem } from '../Menu/menu.props.js';
	import type { TreeContextMenuSnippetData } from './TreeSnippetRenderer.js';
	import { cx } from '$lib/utils/cva/index.js';

	type Props = {
		/** Context-menu anchor, selected tree node, and close action. */
		data: TreeContextMenuSnippetData;
		/** Actions shown for the selected tree node. */
		items: MenuItem[];
		/** Additional classes for the positioned menu surface. */
		class?: string;
	};

	type NavigationElement = HTMLElement & { onNext?: () => void };

	let { data, items, class: className }: Props = $props();

	const menuStyle = $derived(createMenuStyle(data));

	function createMenuStyle(menuData: TreeContextMenuSnippetData): string {
		const rect = menuData.context.anchorRect;
		return `position:fixed;left:${rect.x}px;top:${rect.y + rect.height}px`;
	}

	function closeAfterAction(node: HTMLElement) {
		return untrack(() => on(node, 'click', handleMenuClick));
	}

	function handleMenuClick(event: MouseEvent): void {
		const interactiveElement = event
			.composedPath()
			.find((node) => node instanceof HTMLButtonElement || node instanceof HTMLAnchorElement);

		if (!(interactiveElement instanceof HTMLElement)) return;
		if ((interactiveElement as NavigationElement).onNext != null) return;

		data.close();
	}
</script>

<div
	data-file-tree-context-menu-root="true"
	class={cx('bg-surface-floating text-neutral raised-4 z-50 min-w-44 rounded-lg', className)}
	style={menuStyle}
>
	<Menu {items} focusOnMount="container" {@attach closeAfterAction} />
</div>
