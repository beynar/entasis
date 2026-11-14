<script lang="ts">
	import type { FileTree } from '@pierre/trees';
	import type { Attachment } from 'svelte/attachments';
	import { fromAction } from 'svelte/attachments';
	import { BROWSER } from 'esm-env';
	import type { TreeAttachmentParams, TreeProps, TreePropValues } from './tree.props.js';
	import { TreeRenderer } from './TreeRenderer.js';
	import { TreeSnippetRenderer } from './TreeSnippetRenderer.js';
	import { createTreeOptions } from './tree-input.js';
	import {
		createTreeEventProps,
		createTreeOptionProps,
		createTreeRendererHooks,
		createTreeSnippetProps
	} from './tree.props.js';
	import { createTreeStyle } from './tree-token-style.js';
	import { useTreeTheme } from './tree.theme.js';
	import { preloadTree } from './preloadTree.js';
	import {
		createArrowMirror,
		createTreeTypeahead,
		findTreeElement,
		labelTreeMarkup,
		nameTreeElement
	} from './tree.accessibility.js';
	import { useDirection } from '$lib/utils/useDirection.svelte.js';

	let {
		ref = $bindable(),
		api = $bindable<FileTree | undefined>(),
		paths,
		preparedInput,
		options,
		id,
		initialExpansion,
		initialExpandedPaths,
		initialSelectedPaths,
		flattenEmptyDirectories,
		presorted,
		sort,
		search,
		initialSearchQuery,
		fileTreeSearchMode,
		density,
		itemHeight,
		overscan,
		initialVisibleRowCount,
		icons,
		showGitStatus,
		gitStatus,
		renderRowDecoration,
		unsafeCSS,
		dragAndDrop,
		renaming,
		searchBlurBehavior,
		searchFakeFocus,
		searchTopInset,
		stickyFolders,
		composition,
		onSearchChange,
		onSelectionChange,
		onFocusChange,
		onRename,
		onRenameError,
		onDropComplete,
		onDropError,
		onMutation,
		onReady,
		height,
		class: className,
		hostClass,
		header,
		contextMenu,
		style,
		theme,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		...attachments
	}: TreeProps = $props();

	let errorMessage = $state<string | undefined>();
	const classes = $derived(useTreeTheme(theme));
	const renderer = new TreeRenderer();
	const snippetRenderer = new TreeSnippetRenderer(() => api);
	const serverMarkup = createInitialServerMarkup();
	const direction = useDirection(() => ref);
	const mirrorArrowKey = createArrowMirror(() => direction() === 'rtl');
	const typeahead = createTreeTypeahead(() => api);

	// Keys reach this wrapper from the rows inside Pierre Trees' shadow root, so the listeners are
	// added here rather than as markup handlers on a div that has no interactive role of its own.
	const attachKeyboard: Attachment<HTMLDivElement> = (node) => {
		// Focus moving from row to row also fires focusout; only leaving the tree ends the word.
		const resetTypeahead = (event: FocusEvent) => {
			if (!node.contains(event.relatedTarget as Node | null)) typeahead.reset();
		};
		node.addEventListener('keydown', mirrorArrowKey, { capture: true });
		node.addEventListener('keydown', typeahead.handleKeydown);
		node.addEventListener('focusout', resetTypeahead);
		return () => {
			node.removeEventListener('keydown', mirrorArrowKey, { capture: true });
			node.removeEventListener('keydown', typeahead.handleKeydown);
			node.removeEventListener('focusout', resetTypeahead);
			typeahead.reset();
		};
	};

	// Pierre Trees recreates the tree element on every mount, which also replaces `api`.
	$effect(() => {
		const element = findTreeElement(api);
		if (!element) return;
		nameTreeElement(
			element,
			{ label: ariaLabel, labelledby: ariaLabelledby },
			ref?.getRootNode() ?? null
		);
	});

	const heightStyle = $derived(typeof height === 'number' ? `${height}px` : height);
	const hostClassName = $derived(classes.host({ className: hostClass }));
	const wrapperStyle = $derived(createTreeStyle(style));

	const attachTree: Attachment<HTMLDivElement> = fromAction(
		attachTreeRenderer,
		getAttachmentParams
	);

	function attachTreeRenderer(node: HTMLDivElement, params: TreeAttachmentParams) {
		try {
			errorMessage = undefined;
			renderer.attach(node, createFileTreeOptions(params), params.hostClass, params.rendererHooks);
		} catch (error) {
			snippetRenderer.cleanUp();
			renderer.clear();
			errorMessage = getErrorMessage(error);
		}

		return {
			destroy: cleanUpRenderer,
			update: syncTreeRenderer
		};
	}

	function syncTreeRenderer(params: TreeAttachmentParams): void {
		try {
			errorMessage = undefined;
			renderer.sync(createFileTreeOptions(params), params.hostClass, params.rendererHooks);
		} catch (error) {
			snippetRenderer.cleanUp();
			renderer.clear();
			errorMessage = getErrorMessage(error);
		}
	}

	function getAttachmentParams(): TreeAttachmentParams {
		const propValues = createPropValues();
		return {
			eventProps: createTreeEventProps(propValues),
			hostClass: hostClassName,
			input: { paths, preparedInput },
			optionProps: createTreeOptionProps(propValues),
			options,
			rendererHooks: createTreeRendererHooks(propValues),
			snippets: createTreeSnippetProps(propValues)
		};
	}

	function createFileTreeOptions(params: TreeAttachmentParams) {
		return snippetRenderer.compose(
			createTreeOptions(params.input, params.options, params.optionProps, params.eventProps),
			params.snippets
		);
	}

	function cleanUpRenderer(): void {
		snippetRenderer.cleanUp();
		renderer.cleanUp();
	}

	function preloadInitialTree() {
		const propValues = createPropValues();
		return preloadTree(
			createTreeOptions(
				{ paths, preparedInput },
				options,
				createTreeOptionProps(propValues),
				createTreeEventProps(propValues)
			)
		);
	}

	function createInitialServerMarkup(): string {
		try {
			// The name belongs on the role="tree" element, which Pierre Trees renders in its shadow
			// root; on the outer div, which has no role, assistive technology never announces it.
			return labelTreeMarkup(preloadInitialTree().markup, ariaLabel);
		} catch (error) {
			if (!BROWSER) throw error;
			errorMessage = getErrorMessage(error);
			return '';
		}
	}

	function setFileTree(nextFileTree: FileTree | undefined): void {
		if (Object.is(api, nextFileTree)) return;
		api = nextFileTree;
	}

	function createPropValues(): TreePropValues {
		return {
			composition,
			contextMenu,
			density,
			dragAndDrop,
			fileTreeSearchMode,
			flattenEmptyDirectories,
			gitStatus,
			header,
			icons,
			id,
			initialExpandedPaths,
			initialExpansion,
			initialSearchQuery,
			initialSelectedPaths,
			initialVisibleRowCount,
			itemHeight,
			onDropComplete,
			onDropError,
			onFocusChange,
			onMutation,
			onReady,
			onRename,
			onRenameError,
			onSearchChange,
			onSelectionChange,
			onDispose: () => snippetRenderer.cleanUp(),
			overscan,
			presorted,
			renderRowDecoration,
			renaming,
			search,
			searchBlurBehavior,
			searchFakeFocus,
			searchTopInset,
			setFileTree,
			showGitStatus,
			sort,
			stickyFolders,
			unsafeCSS
		};
	}

	function getErrorMessage(error: unknown): string {
		return error instanceof Error ? error.message : String(error);
	}
</script>

<div
	bind:this={ref}
	data-slot="tree"
	class={classes.root({ className })}
	style={wrapperStyle}
	style:height={heightStyle}
	{...attachments}
>
	{#if errorMessage}
		<div class={classes.error()} role="alert">
			{errorMessage}
		</div>
	{/if}

	<!-- Unavoidable: the initial rows are the SSR payload serialized by the tree engine
	     (@pierre/trees/ssr), never caller supplied HTML; the client attachment then adopts
	     this subtree, so it cannot be expressed as Svelte markup. -->
	<!-- eslint-disable svelte/no-at-html-tags -->
	<div {@attach attachTree} class={classes.viewport()} {@attach attachKeyboard}>
		{@html serverMarkup}
	</div>
	<!-- eslint-enable svelte/no-at-html-tags -->
</div>
