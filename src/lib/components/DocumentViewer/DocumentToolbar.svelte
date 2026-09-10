<script lang="ts">
	import Button from '../Button/Button.svelte';
	import { arrowClockwiseIcon } from '../Icons/arrowClockwise.js';
	import { arrowCounterClockwiseIcon } from '../Icons/arrowCounterClockwise.js';
	import { arrowsDownUpIcon } from '../Icons/arrowsDownUp.js';
	import { arrowsHorizontalIcon } from '../Icons/arrowsHorizontal.js';
	import { arrowsLeftRightIcon } from '../Icons/arrowsLeftRight.js';
	import { caretLeftIcon } from '../Icons/caretLeft.js';
	import { caretRightIcon } from '../Icons/caretRight.js';
	import { downloadSimpleIcon } from '../Icons/downloadSimple.js';
	import { fileIcon } from '../Icons/file.js';
	import { magnifyingGlassMinusIcon } from '../Icons/magnifyingGlassMinus.js';
	import { magnifyingGlassPlusIcon } from '../Icons/magnifyingGlassPlus.js';
	import { printerIcon } from '../Icons/printer.js';
	import { scrollIcon } from '../Icons/scroll.js';
	import { sidebarSimpleIcon } from '../Icons/sidebarSimple.js';
	import Slot from '../Slot/Slot.svelte';
	import type { Slot as SlotValue } from '../Slot/slot.js';
	import type { Colors, Sizes } from '../../types/index.js';
	import DocumentSearchControl from './DocumentSearchControl.svelte';
	import type { DocumentToolbarPosition, DocumentViewerControl } from './documentViewer.props.js';
	import type { DocumentViewerState } from './documentViewer.state.svelte.js';

	type Classes = {
		toolbar: (options: { size: Sizes; position: DocumentToolbarPosition }) => string;
		pageInfo: (options: { size: Sizes }) => string;
		search: () => string;
		searchInput: (options: { size: Sizes }) => string;
		searchCount: () => string;
	};

	let {
		viewer,
		controls,
		toolbarPosition,
		sidebar,
		isSidebarOpen = $bindable(),
		size,
		color,
		classes,
		toolbar
	}: {
		viewer: DocumentViewerState;
		controls: DocumentViewerControl[] | false;
		toolbarPosition: DocumentToolbarPosition;
		sidebar: boolean;
		isSidebarOpen: boolean;
		size: Sizes;
		color: Colors;
		classes: Classes;
		toolbar?: SlotValue<DocumentViewerState>;
	} = $props();

	const has = (control: DocumentViewerControl) =>
		controls !== false && controls.includes(control) && viewer.capabilities[control];
	const buttonProps = $derived({ variant: 'ghost' as const, color, size, squared: true });
	const unitLabel = $derived(viewer.unit ?? 'page');

	const runViewerTask = (task: Promise<void>) => {
		void task.catch((taskError: unknown) => {
			viewer.reportSurfaceError(
				taskError instanceof Error ? taskError : new Error(String(taskError))
			);
		});
	};
</script>

{#if controls !== false && controls.length}
	<Slot
		render={toolbar}
		payload={viewer}
		class={classes.toolbar({ size, position: toolbarPosition })}
	>
		{#if has('sidebar') && sidebar}
			<Button
				{...buttonProps}
				label={isSidebarOpen ? 'Hide page thumbnails' : 'Show page thumbnails'}
				variant={isSidebarOpen ? 'soft' : 'ghost'}
				onclick={() => (isSidebarOpen = !isSidebarOpen)}
				prefix={sidebarSimpleIcon}
			/>
		{/if}
		{#if has('navigation')}
			<Button
				{...buttonProps}
				label="Previous {unitLabel}"
				disabled={!viewer.canGoPrevious}
				onclick={viewer.previous}
				prefix={caretLeftIcon}
			/>
			<Button
				{...buttonProps}
				label="Next {unitLabel}"
				disabled={!viewer.canGoNext}
				onclick={viewer.next}
				prefix={caretRightIcon}
			/>
		{/if}
		{#if has('pageInfo')}
			<span class={classes.pageInfo({ size })} aria-live="polite">
				{viewer.page} / {viewer.totalPages}
			</span>
		{/if}
		{#if has('zoom')}
			<Button
				{...buttonProps}
				label="Zoom out"
				disabled={!viewer.canZoomOut}
				onclick={viewer.zoomOut}
				prefix={magnifyingGlassMinusIcon}
			/>
			<Button
				{...buttonProps}
				label="Zoom in"
				disabled={!viewer.canZoomIn}
				onclick={viewer.zoomIn}
				prefix={magnifyingGlassPlusIcon}
			/>
		{/if}
		{#if has('fit')}
			<Button
				{...buttonProps}
				variant={viewer.fit === 'width' ? 'soft' : 'ghost'}
				label="Fit to width"
				onclick={() => viewer.setFit(viewer.fit === 'width' ? null : 'width')}
				prefix={arrowsHorizontalIcon}
			/>
		{/if}
		{#if has('mode')}
			<Button
				{...buttonProps}
				label={viewer.mode === 'scroll'
					? `Switch to single ${unitLabel}`
					: 'Switch to continuous scroll'}
				onclick={viewer.toggleMode}
				prefix={viewer.mode === 'scroll' ? scrollIcon : fileIcon}
			/>
		{/if}
		{#if has('orientation')}
			<Button
				{...buttonProps}
				label={viewer.orientation === 'vertical'
					? 'Switch to horizontal layout'
					: 'Switch to vertical layout'}
				onclick={viewer.toggleOrientation}
				prefix={viewer.orientation === 'vertical' ? arrowsDownUpIcon : arrowsLeftRightIcon}
			/>
		{/if}
		{#if has('rotate')}
			<Button
				{...buttonProps}
				label="Rotate counterclockwise"
				onclick={() => viewer.rotate(-90)}
				prefix={arrowCounterClockwiseIcon}
			/>
			<Button
				{...buttonProps}
				label="Rotate clockwise"
				onclick={() => viewer.rotate(90)}
				prefix={arrowClockwiseIcon}
			/>
		{/if}
		{#if has('search')}
			<DocumentSearchControl {viewer} {toolbarPosition} {size} {color} {classes} />
		{/if}
		{#if has('download')}
			<Button
				{...buttonProps}
				label="Download"
				disabled={!viewer.isReady}
				onclick={viewer.download}
				prefix={downloadSimpleIcon}
			/>
		{/if}
		{#if has('print')}
			<Button
				{...buttonProps}
				label="Print"
				disabled={!viewer.isReady}
				onclick={() => runViewerTask(viewer.print())}
				prefix={printerIcon}
			/>
		{/if}
	</Slot>
{/if}
