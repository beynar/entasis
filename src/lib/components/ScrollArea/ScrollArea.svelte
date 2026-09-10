<script lang="ts">
	import { fade } from 'svelte/transition';
	import { ScrollArea } from './scrollArea.svelte.js';
	import type { ScrollAreaProps } from './scrollArea.props.js';
	import { useScrollAreaTheme } from './scrollArea.theme.js';
	import { caretUpIcon } from '../Icons/caretUp.js';
	import { caretDownIcon } from '../Icons/caretDown.js';

	let {
		ref = $bindable(null),
		viewportRef = $bindable(null),
		ariaLabel = 'Scrollable content',
		class: className = '',
		children,
		delay = 0,
		type = 'hover',
		scrollOnEdges = false,
		scrollFade = false,
		onscroll,
		theme,
		...attachments
	}: ScrollAreaProps = $props();

	const componentId = $props.id();
	const viewportId = `${componentId}-viewport`;

	const scrollArea = new ScrollArea({
		get type() {
			return type;
		},
		get delay() {
			return delay;
		},
		get scrollOnEdges() {
			return scrollOnEdges;
		}
	});

	const scrollFadeAxis = $derived.by(() => {
		if (!scrollFade) return 'none';
		if (scrollArea.visibleX) return 'x';
		if (scrollArea.visible) return 'y';
		return 'none';
	});

	const classes = $derived(useScrollAreaTheme(theme));
</script>

<div
	data-scroll-area
	data-slot="scroll-area"
	bind:this={ref}
	class={classes.root({ className })}
	style:position="relative"
	{@attach scrollArea.hoover.reference}
	{@attach scrollArea.scrollOnEdgesAttachment}
	{...attachments}
>
	<!-- The viewport is the native scroll container and the keyboard scroll region: focusable
	     only when it overflows (WCAG SCR34 scrollable-region pattern), so it never becomes a
	     dead tab stop. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		id={viewportId}
		data-scroll-area-viewport
		data-slot="scroll-area-viewport"
		data-scroll-fade-axis={scrollFadeAxis === 'none' ? undefined : scrollFadeAxis}
		bind:this={viewportRef}
		class={classes.viewport({ scrollFade: scrollFadeAxis })}
		tabindex={scrollArea.viewportTabindex}
		role="group"
		aria-label={ariaLabel}
		{onscroll}
		{@attach scrollArea.viewportAttachment}
		style:position="relative"
		style:overflow="scroll"
		style:width="100%"
		style:height="100%"
	>
		<!-- display:table + min-width:100% shrink-wraps to the true content width (so a wider child
		     like Code's w-max <pre> makes this box wider → real horizontal overflow) while filling
		     the viewport for narrow content. Its border-box tracks content width, so the content
		     ResizeObserver fires on horizontal content changes and keeps maxScrollX fresh. -->
		<div
			data-scroll-area-content
			data-slot="scroll-area-content"
			class={classes.content()}
			{@attach scrollArea.contentAttachment}
			style:min-width="100%"
			style:display="table"
			style:position="relative"
		>
			{@render children?.()}
		</div>
	</div>

	{#if (type === 'hover' && scrollArea.visible && scrollArea.hoover.isHovered) || scrollArea.isDraggingY || (type === 'always' && scrollArea.visible) || (type === 'auto' && scrollArea.visible) || (type === 'scroll' && scrollArea.isScrolling)}
		<div
			data-slot="scroll-area-scrollbar"
			transition:fade={{ duration: 200 }}
			bind:this={scrollArea.scrollbarYElement}
			class={classes.scrollbar()}
			style="bottom: 0px"
			style:display="flex"
			style:user-select="none"
			style:opacity={scrollArea.visible ? 1 : 0}
			style:transition="opacity 0.2s ease"
			role="scrollbar"
			aria-controls={viewportId}
			aria-valuenow={scrollArea.scrollY}
			aria-valuemin="0"
			aria-valuemax={scrollArea.maxScrollY}
			{@attach scrollArea.trackAttachment}
			{@attach scrollArea.trackRect.reference}
		>
			<div
				data-thumb
				data-slot="scroll-area-thumb"
				class={classes.scrollbarThumb()}
				style:height={scrollArea.thumbYSize + 'px'}
				style:width="100%"
				style:transform={`translateY(${scrollArea.thumbYPosition}px)`}
				{@attach scrollArea.dragY.reference}
				{@attach scrollArea.thumbRect.reference}
			></div>
		</div>
	{/if}

	{#if (type === 'hover' && scrollArea.visibleX && scrollArea.hoover.isHovered) || scrollArea.isDraggingX || (type === 'always' && scrollArea.visibleX) || (type === 'auto' && scrollArea.visibleX) || (type === 'scroll' && scrollArea.isScrolling)}
		<div
			data-slot="scroll-area-scrollbar"
			transition:fade={{ duration: 200 }}
			bind:this={scrollArea.scrollbarXElement}
			class={classes.scrollbarX()}
			style="right: 0px"
			style:display="flex"
			style:user-select="none"
			style:opacity={scrollArea.visibleX ? 1 : 0}
			style:transition="opacity 0.2s ease"
			role="scrollbar"
			aria-orientation="horizontal"
			aria-controls={viewportId}
			aria-valuenow={scrollArea.scrollX}
			aria-valuemin="0"
			aria-valuemax={scrollArea.maxScrollX}
			{@attach scrollArea.trackAttachmentX}
		>
			<div
				data-thumb
				data-slot="scroll-area-thumb"
				class={classes.scrollbarThumb()}
				style:width={scrollArea.thumbXSize + 'px'}
				style:height="100%"
				style:transform={`translateX(${scrollArea.thumbXPosition}px)`}
				{@attach scrollArea.dragX.reference}
			></div>
		</div>
	{/if}
	{#if scrollArea.scrollOnEdgesAttachment}
		{#if scrollArea.canScrollUp}
			<div
				class="absolute top-0 left-0 flex w-full items-center justify-center"
				style:pointer-events="none"
			>
				{@render caretUpIcon({ size: 10 })}
			</div>
		{/if}

		{#if scrollArea.canScrollDown}
			<div
				class="absolute bottom-0 left-0 flex w-full items-center justify-center"
				style:pointer-events="none"
			>
				{@render caretDownIcon({ size: 10 })}
			</div>
		{/if}
	{/if}
</div>

<style>
	/* Hide native scrollbars cross-browser; custom thumbs overlay the real scroll container.
	   Firefox/standard + old Edge are also set inline in viewportAttachment as a backstop. */
	[data-scroll-area-viewport] {
		scrollbar-width: none; /* Firefox + standard */
		-ms-overflow-style: none; /* old Edge/IE */
	}

	[data-scroll-area-viewport]::-webkit-scrollbar {
		display: none; /* Chrome/Safari */
	}

	[data-scroll-area-viewport]::-webkit-scrollbar-track {
		display: none;
	}
</style>
