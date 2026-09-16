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
	import { useI18n } from '$lib/i18n/context.svelte.js';

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
	const t = $derived(useI18n());
	const unitLabel = $derived(t[viewer.unit ?? 'page']);

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
				label={isSidebarOpen ? t.hidePageThumbnails : t.showPageThumbnails}
				variant={isSidebarOpen ? 'soft' : 'ghost'}
				onclick={() => (isSidebarOpen = !isSidebarOpen)}
				prefix={sidebarSimpleIcon}
			/>
		{/if}
		{#if has('navigation')}
			<Button
				{...buttonProps}
				label={`${t.previous} ${unitLabel}`}
				disabled={!viewer.canGoPrevious}
				onclick={viewer.previous}
				prefix={caretLeftIcon}
			/>
			<Button
				{...buttonProps}
				label={`${t.next} ${unitLabel}`}
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
				label={t.zoomOut}
				disabled={!viewer.canZoomOut}
				onclick={viewer.zoomOut}
				prefix={magnifyingGlassMinusIcon}
			/>
			<Button
				{...buttonProps}
				label={t.zoomIn}
				disabled={!viewer.canZoomIn}
				onclick={viewer.zoomIn}
				prefix={magnifyingGlassPlusIcon}
			/>
		{/if}
		{#if has('fit')}
			<Button
				{...buttonProps}
				variant={viewer.fit === 'width' ? 'soft' : 'ghost'}
				label={t.fitToWidth}
				onclick={() => viewer.setFit(viewer.fit === 'width' ? null : 'width')}
				prefix={arrowsHorizontalIcon}
			/>
		{/if}
		{#if has('mode')}
			<Button
				{...buttonProps}
				label={viewer.mode === 'scroll'
					? t.switchToSingleUnit(unitLabel)
					: t.switchToContinuousScroll}
				onclick={viewer.toggleMode}
				prefix={viewer.mode === 'scroll' ? scrollIcon : fileIcon}
			/>
		{/if}
		{#if has('orientation')}
			<Button
				{...buttonProps}
				label={viewer.orientation === 'vertical'
					? t.switchToHorizontalLayout
					: t.switchToVerticalLayout}
				onclick={viewer.toggleOrientation}
				prefix={viewer.orientation === 'vertical' ? arrowsDownUpIcon : arrowsLeftRightIcon}
			/>
		{/if}
		{#if has('rotate')}
			<Button
				{...buttonProps}
				label={`${t.rotate} ${t.counterclockwise}`}
				onclick={() => viewer.rotate(-90)}
				prefix={arrowCounterClockwiseIcon}
			/>
			<Button
				{...buttonProps}
				label={`${t.rotate} ${t.clockwise}`}
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
				label={t.download}
				disabled={!viewer.isReady}
				onclick={viewer.download}
				prefix={downloadSimpleIcon}
			/>
		{/if}
		{#if has('print')}
			<Button
				{...buttonProps}
				label={t.print}
				disabled={!viewer.isReady}
				onclick={() => runViewerTask(viewer.print())}
				prefix={printerIcon}
			/>
		{/if}
	</Slot>
{/if}
