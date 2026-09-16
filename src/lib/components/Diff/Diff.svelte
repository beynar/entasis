<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { BROWSER } from 'esm-env';
	import type { DiffLineAnnotation, FileDiffOptions, SelectedLineRange } from '@pierre/diffs';
	import type { DiffProps } from './diff.props.js';
	import type { DiffInput, PreloadedDiffRenderItem } from './diff-input.js';
	import type { DiffOptionProps } from './diff-theme.js';
	import { useDiffTheme } from './diff.theme.js';
	import { createDiffOptions } from './diff-theme.js';
	import { createDiffRenderItems } from './diff-input.js';
	import { DiffRenderer } from './DiffRenderer.js';
	import { DiffAnnotationRenderer } from './DiffAnnotationRenderer.js';
	import CodeTheme from '../Code/CodeTheme.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

	let {
		patch,
		files,
		diffStyle,
		lineNumbers,
		wrapping,
		backgrounds,
		hunkSeparators,
		lineDiffType,
		diffIndicators,
		options,
		lineAnnotations,
		renderAnnotation,
		renderAnnotationClass,
		selection = $bindable(undefined),
		defaultSelection,
		onSelectionChange,
		fileClass,
		class: className,
		theme,
		...attachments
	}: DiffProps = $props();

	const classes = $derived(useDiffTheme(theme));
	const t = $derived(useI18n());
	const selectionState = createBindableValue<SelectedLineRange | null | undefined>(
		() => selection,
		(next) => {
			selection = next;
		},
		() => defaultSelection
	);

	// `WithSlot` widens the slot to `string | Snippet`; annotations are always a
	// snippet, so narrow it for the imperative renderer.
	const annotationSnippet = $derived(
		typeof renderAnnotation === 'function'
			? (renderAnnotation as Snippet<[DiffLineAnnotation<undefined>]>)
			: undefined
	);

	let errorMessage = $state<string | undefined>();
	const renderer = new DiffRenderer();

	const fileWrapperClass = $derived(classes.file({ className: fileClass }));

	// --- SSR: render the diff HTML on the server as declarative shadow DOM so it is
	// visible before hydration (requires `compilerOptions.experimental.async`). ---
	const serverPreloaded = !BROWSER ? await preloadServerDiff() : undefined;
	const serverMarkup = createPreloadedMarkup(
		serverPreloaded,
		untrack(() => fileWrapperClass)
	);
	// First client pass hydrates the SSR'd shadow DOM; later prop changes re-render fresh.
	let hasHydrated = false;

	async function preloadServerDiff(): Promise<PreloadedDiffRenderItem[] | undefined> {
		try {
			const { preloadDiff } = await import('./preloadDiff.js');
			return await preloadDiff(
				{ patch, files },
				createInteractiveOptions(
					new DiffAnnotationRenderer(annotationSnippet, renderAnnotationClass)
				),
				{ lineAnnotations },
				createOptionProps()
			);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : String(error);
			return undefined;
		}
	}

	function createPreloadedMarkup(
		items: PreloadedDiffRenderItem[] | undefined,
		wrapperClass: string
	): string {
		if (items == null || items.length === 0) return '';
		return items
			.map(
				(item) =>
					`<div data-diff-file="${escapeAttribute(item.key)}" class="${escapeAttribute(wrapperClass)}">` +
					`<diffs-container><template shadowrootmode="open">${item.html}</template></diffs-container>` +
					`</div>`
			)
			.join('');
	}

	function readServerPreloaded(node: HTMLElement): PreloadedDiffRenderItem[] | undefined {
		const wrappers = [...node.querySelectorAll<HTMLElement>('[data-diff-file]')];
		if (wrappers.length === 0) return undefined;
		const items = createDiffRenderItems(
			{ patch, files },
			createDiffOptions(undefined, createOptionProps())
		);
		const preloaded: PreloadedDiffRenderItem[] = [];
		for (const item of items) {
			const wrapper = wrappers.find((candidate) => candidate.dataset.diffFile === item.key);
			const host = wrapper?.querySelector('diffs-container');
			const html = host?.shadowRoot?.innerHTML;
			if (html == null || html.length === 0) return undefined;
			preloaded.push({ ...item, html });
		}
		return preloaded;
	}

	function escapeAttribute(value: string): string {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('"', '&quot;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;');
	}

	function createOptionProps(): DiffOptionProps {
		return {
			diffStyle,
			diffIndicators,
			hunkSeparators,
			lineDiffType,
			backgrounds,
			wrapping,
			lineNumbers
		};
	}

	function createInteractiveOptions(
		annotationRenderer: DiffAnnotationRenderer
	): FileDiffOptions<undefined, undefined> | undefined {
		const renderAnnotationCallback =
			annotationSnippet == null ? options?.renderAnnotation : annotationRenderer.render;

		// Selection is "controlled" when the consumer opts in via `selection`,
		// `defaultSelection`, or `onSelectionChange`. `enableLineSelection` gates all of
		// @pierre's pointer selection, so it must be turned on for any of them to do anything.
		const controlled =
			selectionState.value !== undefined ||
			onSelectionChange != null ||
			options?.controlledSelection;

		if (!controlled && renderAnnotationCallback === options?.renderAnnotation) {
			return options;
		}

		return {
			...options,
			controlledSelection: controlled || options?.controlledSelection,
			enableLineSelection: controlled ? true : options?.enableLineSelection,
			renderAnnotation: renderAnnotationCallback,
			onLineSelected: (range) => {
				options?.onLineSelected?.(range);
				// Write back so `bind:selection` works; the sync `$effect` below then
				// pushes it to the instances with `notify: false` (idempotent, no loop).
				selectionState.value = range ?? undefined;
				onSelectionChange?.(range);
			}
		};
	}

	// The attachment mounts/hydrates the `@pierre/diffs` instances on the client and
	// tears them down on cleanup.
	// NB: `selection` is intentionally NOT read here — a selection change must not
	// rebuild the whole diff DOM; it is pushed incrementally via the `$effect` below.
	const attachDiff = $derived.by<Attachment<HTMLDivElement>>(() => {
		// Read every rebuild-worthy input up front so the attachment re-runs when they change.
		const input: DiffInput = { patch, files };
		const optionProps = createOptionProps();
		const wrapperClass = fileWrapperClass;
		const annotations = lineAnnotations;
		const snippet = annotationSnippet;
		const annotationClass = renderAnnotationClass;
		const labelFile = (file: string) => t.diffFileContent(file);
		void options;

		return (node) => {
			return untrack(() => {
				const annotationRenderer = new DiffAnnotationRenderer(snippet, annotationClass);
				const currentOptions = createInteractiveOptions(annotationRenderer);

				try {
					const diffOptions = createDiffOptions(currentOptions, optionProps);
					errorMessage = undefined;
					const items = createDiffRenderItems(input, diffOptions);
					const state = { lineAnnotations: annotations, selectedLines: selectionState.value };

					// First client pass: hydrate the server-rendered shadow DOM in place.
					const preloaded = hasHydrated ? undefined : readServerPreloaded(node);
					hasHydrated = true;
					if (preloaded) {
						renderer.hydrate(node, preloaded, diffOptions, wrapperClass, state, labelFile);
					} else {
						renderer.render(node, items, diffOptions, wrapperClass, state, labelFile);
					}
				} catch (error) {
					renderer.cleanUp();
					annotationRenderer.cleanUp();
					node.replaceChildren();
					errorMessage = error instanceof Error ? error.message : String(error);
				}

				return () => {
					renderer.cleanUp();
					annotationRenderer.cleanUp();
				};
			});
		};
	});

	// Push external `selection` changes into the existing instances incrementally
	// (no rebuild). Idempotent when the change originated from an internal drag.
	$effect(() => {
		const nextSelection = selectionState.value;
		untrack(() => renderer.setSelectedLines(nextSelection ?? null));
	});
</script>

<CodeTheme />

<div data-slot="diff" class={classes.root({ className })} {...attachments}>
	{#if errorMessage}
		<div class={classes.error()} role="alert">{errorMessage}</div>
	{/if}

	<!--
		Brand the diff line decorations with our palette. @pierre resolves the surface bg/fg
		from the registered syntax theme, but its add/remove/modify colors default to hardcoded
		green/red. These `*-color-override` custom properties inherit through the shadow boundary
		into `<diffs-container>`'s `:host`, so the diff's line tints + indicator bars use our
		success/danger/warning tokens (which already switch per light/dark).
	-->
	<div
		{@attach attachDiff}
		class="min-w-0 [--diffs-addition-color-override:var(--color-success)] [--diffs-deletion-color-override:var(--color-danger)] [--diffs-modified-color-override:var(--color-warning)]"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- SSR-only declarative shadow DOM built by `createPreloadedMarkup` from the diff renderer's own escaped output; there is no non-`@html` way to emit a `<template shadowrootmode>`. -->
		{@html serverMarkup}
	</div>
</div>
