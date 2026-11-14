<script lang="ts">
	import { on } from 'svelte/events';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { Edytor, type JSONDoc, type Plugin } from 'edytor';
	import type { RichTextInputCollaboration } from './richTextInput.props.js';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import type { Sizes } from '$lib/types/theme.js';
	import type { RichTextInputMaxHeight } from './richTextInput.props.js';
	import type { RichTextInputThemeProps } from './richTextInput.theme.js';
	import { useRichTextInputTheme } from './richTextInput.theme.js';

	type Props = {
		id?: string;
		/** The editable root, once edytor attached it. */
		rootElement?: HTMLElement | null;
		/** The document edytor mounts with (read once). */
		value: JSONDoc;
		plugins: Plugin[];
		/** edytor's collaboration settings, passed as they are. */
		collaboration?: RichTextInputCollaboration;
		size: Sizes;
		theme?: RichTextInputThemeProps;
		disabled?: boolean;
		readOnly?: boolean;
		placeholder: string;
		standalone?: boolean;
		maxHeight?: RichTextInputMaxHeight;
		isEmpty: boolean;
		onFocus?: (event: FocusEvent) => void;
		onBlur?: (event: FocusEvent) => void;
		/** A press below the last line: the caret goes to the end of the text. */
		onPressBelowContent?: () => void;
	};

	let {
		id,
		rootElement = null,
		value,
		plugins,
		collaboration,
		size,
		theme,
		disabled = false,
		readOnly = false,
		placeholder,
		standalone = false,
		maxHeight = false,
		isEmpty,
		onFocus,
		onBlur,
		onPressBelowContent
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

	function getEditorHeight(editorElement: HTMLElement, shellElement: HTMLDivElement) {
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

	function getCaretRect(editorElement: HTMLElement) {
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
		if (!editorElement || !viewport || !editorElement.contains(document.activeElement)) return;

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

	// edytor starts a new paragraph for a press under its last block (Notion's page). In an input
	// that press means "write at the end", as a textarea does.
	const pressBelowContent: Attachment<HTMLDivElement> = (node) => {
		const onPointerDown = (event: PointerEvent) => {
			const root = rootElement;
			if (event.button !== 0 || !root || event.target !== root || disabled || readOnly) return;
			const blocks = root.querySelectorAll(':scope > [data-edytor-block]');
			const last = blocks[blocks.length - 1];
			if (last && event.clientY <= last.getBoundingClientRect().bottom) return;
			event.preventDefault();
			event.stopPropagation();
			onPressBelowContent?.();
		};
		node.addEventListener('pointerdown', onPointerDown, { capture: true });
		return () => node.removeEventListener('pointerdown', onPointerDown, { capture: true });
	};

	// edytor renders the editable root; the input names it and states what it may do.
	$effect(() => {
		const root = rootElement;
		if (!root) return;
		root.setAttribute('data-slot', 'ai-composer-editor');
		root.setAttribute('data-rich-text-input-editor', 'true');
		if (disabled) root.setAttribute('aria-disabled', 'true');
		else root.removeAttribute('aria-disabled');
		// A read-only input stays focusable (its text can be selected and read); a disabled one does not.
		if (readOnly && !disabled) root.setAttribute('tabindex', '0');
		else root.removeAttribute('tabindex');
		if (!onFocus && !onBlur) return;
		// `on()` runs the handler outside any reaction: a browser can blur the editor while Svelte
		// updates the block that removes it, and the handler writes `focused`
		// (`state_unsafe_mutation` from a plain listener).
		const stopFocus = on(root, 'focus', (event) => onFocus?.(event));
		const stopBlur = on(root, 'blur', (event) => onBlur?.(event));
		return () => {
			stopFocus();
			stopBlur();
		};
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
			{@attach pressBelowContent}
			data-slot="rich-text-input-shell"
			class={classes.editorShell({ size })}
		>
			<Edytor
				{...collaboration}
				{id}
				{value}
				{plugins}
				defaultPlugins={false}
				readonly={disabled || readOnly}
				aria-label={placeholder}
				class={classes.editor({ size, disabled })}
			/>
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
