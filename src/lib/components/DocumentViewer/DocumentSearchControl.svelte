<script lang="ts">
	import { onDestroy } from 'svelte';
	import Button from '../Button/Button.svelte';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import { caretUpIcon } from '../Icons/caretUp.js';
	import { magnifyingGlassIcon } from '../Icons/magnifyingGlass.js';
	import Popover from '../Popover/Popover.svelte';
	import type { PopoverState } from '../Popover/popover.state.svelte.js';
	import type { Colors, Sizes } from '../../types/index.js';
	import type { DocumentToolbarPosition } from './documentViewer.props.js';
	import type { DocumentViewerState } from './documentViewer.state.svelte.js';

	type Classes = {
		search: () => string;
		searchInput: (options: { size: Sizes }) => string;
		searchCount: () => string;
	};

	let {
		viewer,
		toolbarPosition,
		size,
		color,
		classes
	}: {
		viewer: DocumentViewerState;
		toolbarPosition: DocumentToolbarPosition;
		size: Sizes;
		color: Colors;
		classes: Classes;
	} = $props();

	const buttonProps = $derived({ variant: 'ghost' as const, color, size, squared: true });
	const position = $derived.by(() => {
		switch (toolbarPosition) {
			case 'left':
				return 'right';
			case 'right':
				return 'left';
			case 'bottom':
				return 'top';
			default:
				return 'bottom';
		}
	});
	let query = $state('');
	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	const searchCount = $derived.by(() => {
		if (viewer.matches.length) return `${viewer.activeMatch + 1} / ${viewer.matches.length}`;
		return query ? '0 / 0' : '';
	});

	const runViewerTask = (task: Promise<void>) => {
		void task.catch((taskError: unknown) => {
			viewer.reportSurfaceError(
				taskError instanceof Error ? taskError : new Error(String(taskError))
			);
		});
	};
	const runSearch = () => {
		searchTimer = undefined;
		runViewerTask(viewer.search(query));
	};
	const onSearchInput = () => {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(runSearch, 250);
	};
	const onAfterClose = (popover: PopoverState) => {
		clearTimeout(searchTimer);
		searchTimer = undefined;
		query = '';
		viewer.clearSearch();
		if (popover.referenceElement instanceof HTMLElement) popover.referenceElement.focus();
	};
	const onKeydown = (event: KeyboardEvent) => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		if (searchTimer) {
			clearTimeout(searchTimer);
			runSearch();
			return;
		}
		runViewerTask(event.shiftKey ? viewer.previousMatch() : viewer.nextMatch());
	};
	onDestroy(() => clearTimeout(searchTimer));
</script>

<Popover
	{position}
	lockScroll={false}
	closeOnClickOutside={false}
	{onAfterClose}
	class={classes.search()}
>
	{#snippet trigger(popover)}
		<Button
			{...buttonProps}
			label="Search"
			disabled={!viewer.isReady}
			onclick={popover.toggle}
			prefix={magnifyingGlassIcon}
			{@attach popover.reference}
		/>
	{/snippet}
	<!-- svelte-ignore a11y_autofocus -->
	<input
		class={classes.searchInput({ size })}
		type="search"
		placeholder="Search…"
		aria-label="Search document"
		autofocus
		bind:value={query}
		oninput={onSearchInput}
		onkeydown={onKeydown}
	/>
	<span class={classes.searchCount()}>{searchCount}</span>
	<Button
		{...buttonProps}
		label="Previous match"
		disabled={!viewer.matches.length}
		onclick={() => runViewerTask(viewer.previousMatch())}
		prefix={caretUpIcon}
	/>
	<Button
		{...buttonProps}
		label="Next match"
		disabled={!viewer.matches.length}
		onclick={() => runViewerTask(viewer.nextMatch())}
		prefix={caretDownIcon}
	/>
</Popover>
