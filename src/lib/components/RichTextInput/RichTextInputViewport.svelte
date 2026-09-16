<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import type { Sizes } from '$lib/types/theme.js';
	import type { RichTextInputMaxHeight } from './richTextInput.props.js';
	import type { RichTextInputThemeProps } from './richTextInput.theme.js';
	import { useRichTextInputTheme } from './richTextInput.theme.js';

	type Props = {
		id?: string;
		rootElement?: HTMLDivElement | null;
		editorAttachment?: Attachment<HTMLDivElement>;
		size: Sizes;
		theme?: RichTextInputThemeProps;
		disabled?: boolean;
		placeholder: string;
		standalone?: boolean;
		maxHeight?: RichTextInputMaxHeight;
		isEmpty: boolean;
		onKeydown: (event: KeyboardEvent) => void;
		onFocus?: (event: FocusEvent) => void;
		onBlur?: (event: FocusEvent) => void;
	};

	let {
		id,
		rootElement = $bindable<HTMLDivElement | null>(null),
		editorAttachment,
		size,
		theme,
		disabled = false,
		placeholder,
		standalone = false,
		maxHeight = false,
		isEmpty,
		onKeydown,
		onFocus,
		onBlur
	}: Props = $props();

	const classes = $derived(useRichTextInputTheme(theme));
	const maxHeightCss = $derived(
		typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight || undefined
	);
	const height = $derived(
		maxHeight === false ? 'uncapped' : maxHeight == null ? 'default' : 'custom'
	);
	let editorShellElement = $state<HTMLDivElement | null>(null);
	let showScrollComfortSpacer = $state(false);
	let scheduleRefresh = $state<(() => void) | null>(null);

	function getViewport() {
		return editorShellElement?.closest<HTMLElement>('[data-scroll-area-viewport]') ?? null;
	}

	function readPixelValue(value: string) {
		const pixels = Number.parseFloat(value);
		return Number.isFinite(pixels) ? pixels : 0;
	}

	function getEditorHeight(editorElement: HTMLDivElement, shellElement: HTMLDivElement) {
		const shellStyles = getComputedStyle(shellElement);
		return (
			editorElement.scrollHeight +
			readPixelValue(shellStyles.paddingTop) +
			readPixelValue(shellStyles.paddingBottom)
		);
	}

	function getScrollComfortGap() {
		if (size === 'small') return 32;
		if (size === 'large') return 48;
		return 40;
	}

	function getCaretRect(editorElement: HTMLDivElement) {
		const selection = window.getSelection();
		if (!selection?.anchorNode || selection.rangeCount === 0) return null;
		if (!editorElement.contains(selection.anchorNode)) return null;

		const range = selection.getRangeAt(0).cloneRange();
		range.collapse(false);
		const rect = range.getBoundingClientRect();
		return rect.width > 0 || rect.height > 0 ? rect : null;
	}

	function scrollCaretIntoComfortZone() {
		const editorElement = rootElement;
		const viewport = getViewport();
		if (!editorElement || !viewport || document.activeElement !== editorElement) return;

		const caretRect = getCaretRect(editorElement);
		if (!caretRect) return;

		const viewportRect = viewport.getBoundingClientRect();
		const overshoot = caretRect.bottom - (viewportRect.bottom - getScrollComfortGap());
		if (overshoot > 0) viewport.scrollTop += overshoot;
	}

	function refreshScrollComfortSpacer() {
		const shellElement = editorShellElement;
		const editorElement = rootElement;
		const viewport = getViewport();

		if (!shellElement || !editorElement || !viewport || isEmpty) {
			showScrollComfortSpacer = false;
			return;
		}

		showScrollComfortSpacer =
			getEditorHeight(editorElement, shellElement) > viewport.clientHeight + 1;
		if (showScrollComfortSpacer) requestAnimationFrame(scrollCaretIntoComfortZone);
	}

	const observeViewport: Attachment<HTMLDivElement> = (node) =>
		untrack(() => {
			editorShellElement = node;
			let frame: number | null = null;
			const schedule = () => {
				if (frame !== null) cancelAnimationFrame(frame);
				frame = requestAnimationFrame(() => {
					frame = null;
					refreshScrollComfortSpacer();
				});
			};
			scheduleRefresh = schedule;

			$effect(() => {
				const editorElement = rootElement;
				const viewport = node.closest<HTMLElement>('[data-scroll-area-viewport]');
				schedule();
				if (!editorElement || !viewport) return;

				const resizeObserver = new ResizeObserver(schedule);
				const mutationObserver = new MutationObserver(schedule);
				resizeObserver.observe(node);
				resizeObserver.observe(editorElement);
				resizeObserver.observe(viewport);
				mutationObserver.observe(editorElement, {
					childList: true,
					characterData: true,
					subtree: true
				});

				return () => {
					resizeObserver.disconnect();
					mutationObserver.disconnect();
				};
			});

			return () => {
				if (frame !== null) cancelAnimationFrame(frame);
				if (scheduleRefresh === schedule) scheduleRefresh = null;
				if (editorShellElement === node) editorShellElement = null;
			};
		});

	// Anything that can change the editor's box re-measures the comfort spacer.
	$effect(() => {
		void size;
		void isEmpty;
		void maxHeightCss;
		scheduleRefresh?.();
	});
</script>

<div
	data-slot="rich-text-input"
	class={classes.viewport({ size })}
	style:--rich-text-input-max-height={maxHeightCss}
>
	<ScrollArea
		type="hover"
		delay={100}
		class={classes.scrollArea({ size, disabled, standalone, height })}
	>
		<div
			{@attach observeViewport}
			data-slot="rich-text-input-shell"
			class={classes.editorShell({ size })}
		>
			<div
				{id}
				{@attach editorAttachment}
				data-slot="ai-composer-editor"
				data-rich-text-input-editor="true"
				contenteditable={disabled ? 'false' : 'true'}
				role="textbox"
				aria-label={placeholder}
				aria-multiline="true"
				aria-disabled={disabled || undefined}
				tabindex={disabled ? undefined : 0}
				spellcheck="true"
				class={classes.editor({ size, disabled })}
				onkeydown={onKeydown}
				onfocus={onFocus}
				onblur={onBlur}
			></div>
			{#if isEmpty}
				<div data-slot="rich-text-input-placeholder" class={classes.placeholder({ size })}>
					{placeholder}
				</div>
			{/if}
			{#if showScrollComfortSpacer}
				<div
					aria-hidden="true"
					data-slot="rich-text-input-scroll-comfort"
					class={classes.scrollComfortSpacer({ size })}
				></div>
			{/if}
		</div>
	</ScrollArea>
</div>
