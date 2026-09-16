<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { SvelteMap } from 'svelte/reactivity';
	import type { DocumentViewerState } from './documentViewer.state.svelte.js';

	type Classes = {
		sheetTabs: () => string;
		sheetTab: (options?: { className?: string }) => string;
		sheetTabActive: () => string;
	};

	let { viewer, classes }: { viewer: DocumentViewerState; classes: Classes } = $props();
	const tabElements = new SvelteMap<number, HTMLButtonElement>();
	const t = $derived(useI18n());

	const trackTab =
		(index: number): Attachment<HTMLButtonElement> =>
		(node) => {
			tabElements.set(index, node);
			return () => tabElements.delete(index);
		};

	$effect(() => {
		const active = viewer.sheet;
		untrack(() => {
			const tab = tabElements.get(active);
			if (typeof tab?.scrollIntoView === 'function') {
				tab.scrollIntoView({ inline: 'nearest', block: 'nearest' });
			}
		});
	});

	const onKeydown = (event: KeyboardEvent) => {
		let target = viewer.sheet;
		switch (event.key) {
			case 'ArrowLeft':
				target -= 1;
				break;
			case 'ArrowRight':
				target += 1;
				break;
			case 'Home':
				target = 1;
				break;
			case 'End':
				target = viewer.sheetNames.length;
				break;
			default:
				return;
		}
		event.preventDefault();
		viewer.setSheet(target);
		queueMicrotask(() => tabElements.get(viewer.sheet)?.focus());
	};
</script>

<div
	class={classes.sheetTabs()}
	role="tablist"
	aria-label={t.workbookSheets}
	tabindex="-1"
	onkeydown={onKeydown}
>
	{#each viewer.sheetNames as name, index (name)}
		<button
			type="button"
			role="tab"
			aria-selected={viewer.sheet === index + 1}
			tabindex={viewer.sheet === index + 1 ? 0 : -1}
			class={classes.sheetTab({
				className: viewer.sheet === index + 1 ? classes.sheetTabActive() : undefined
			})}
			onclick={() => viewer.setSheet(index + 1)}
			{@attach trackTab(index + 1)}
		>
			{name}
		</button>
	{/each}
</div>
