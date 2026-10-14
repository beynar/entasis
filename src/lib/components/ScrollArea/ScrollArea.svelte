<script lang="ts">
	import { fade } from 'svelte/transition';
	import { ScrollArea } from './scrollArea.svelte.js';
	import type { ScrollAreaProps } from './scrollArea.props.js';
	import { useScrollAreaTheme } from './scrollArea.theme.js';
	import { caretUpIcon } from '../Icons/caretUp.js';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		ref = $bindable(null),
		viewportRef = $bindable(null),
		label,
		viewportRole,
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
	const t = $derived(useI18n());

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

	// Accessibility of the viewport. An idle viewport is a plain div: it adds no role, no name and
	// no tab stop, so a scroll area that fits its content (a short Select list, a card) is invisible
	// to assistive tech. It becomes a named, focusable `group` only while it overflows (WCAG SCR34),
	// or keeps the role and name the caller passed. A presentational viewport (`presentation` /
	// `none`) stays transparent even while it overflows: the surrounding widget (a listbox with
	// active-descendant navigation, say) owns keyboard scrolling, and a focusable or named node
	// would cancel the presentational role.
	//
	// A viewport that holds focus keeps its role, name and a programmatic tab stop (-1) after its
	// content stops overflowing (a resize, a zoom-out, filtered content): removing the tabindex of
	// the focused element would make the browser drop focus to <body>. They go once it blurs.
	let viewportFocused = $state(false);
	const exposed = $derived(scrollArea.overflowing || viewportFocused);
	const presentational = $derived(viewportRole === 'presentation' || viewportRole === 'none');
	const resolvedViewportRole = $derived(
		viewportRole ?? (label !== undefined || exposed ? 'group' : undefined)
	);
	const resolvedViewportLabel = $derived(
		presentational ? undefined : (label ?? (exposed ? t.scrollableContent : undefined))
	);
	const resolvedViewportTabindex = $derived(
		presentational ? undefined : scrollArea.overflowing ? 0 : viewportFocused ? -1 : undefined
	);
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
	     dead tab stop. Role, name and tab stop resolve in the script above. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		id={viewportId}
		data-scroll-area-viewport
		data-slot="scroll-area-viewport"
		data-scroll-fade-axis={scrollFadeAxis === 'none' ? undefined : scrollFadeAxis}
		bind:this={viewportRef}
		class={classes.viewport({ scrollFade: scrollFadeAxis })}
		tabindex={resolvedViewportTabindex}
		role={resolvedViewportRole}
		aria-label={resolvedViewportLabel}
		{onscroll}
		onfocus={() => (viewportFocused = true)}
		onblur={() => (viewportFocused = false)}
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

	<!-- The scrollbars are pointer-only affordances: the viewport is the keyboard scroll region, so
	     the tracks stay out of the accessibility tree instead of exposing an unreachable
	     role="scrollbar" (inside a listbox they would also be invalid children). -->
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
			aria-hidden="true"
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
				{@attach scrollArea.dragY}
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
			aria-hidden="true"
			{@attach scrollArea.trackAttachmentX}
		>
			<div
				data-thumb
				data-slot="scroll-area-thumb"
				class={classes.scrollbarThumb()}
				style:width={scrollArea.thumbXSize + 'px'}
				style:height="100%"
				style:transform={`translateX(${scrollArea.thumbXPosition}px)`}
				{@attach scrollArea.dragX}
			></div>
		</div>
	{/if}
	{#if scrollArea.scrollOnEdgesAttachment}
		{#if scrollArea.canScrollUp}
			<div
				aria-hidden="true"
				class="absolute top-0 left-0 flex w-full items-center justify-center"
				style:pointer-events="none"
			>
				{@render caretUpIcon({ size: 10 })}
			</div>
		{/if}

		{#if scrollArea.canScrollDown}
			<div
				aria-hidden="true"
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
