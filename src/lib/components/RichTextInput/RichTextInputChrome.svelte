<script lang="ts">
	import type { AnchoredReference } from './anchored-reference.js';
	import type { CommandGroup } from '../Command/command.props.js';
	import type { Sizes } from '$lib/types/theme.js';
	import type { WithAttachments } from '$lib/types/props.js';
	import type { Attachment } from 'svelte/attachments';
	import type { RichTextInputFormat, RichTextInputMaxHeight } from './richTextInput.props.js';
	import RichTextInputFormattingToolbar from './RichTextInputFormattingToolbar.svelte';
	import RichTextInputSuggestions from './RichTextInputSuggestions.svelte';
	import type { AIComposerSelectionMenuController } from './composer/editor-selection-menu.svelte.js';
	import type { AIComposerSuggestionHandle } from './composer/keyboard.js';
	import type { RichTextInputSearchStatus } from './search.svelte.js';
	import type { TriggerState } from './composer/trigger.js';
	import type { RichTextInputFixedToolbarController } from './fixed-toolbar-controller.svelte.js';
	import RichTextInputViewport from './RichTextInputViewport.svelte';
	import type { RichTextInputThemeProps } from './richTextInput.theme.js';
	import { useRichTextInputTheme } from './richTextInput.theme.js';

	type Props = WithAttachments<{
		id?: string;
		rootElement: HTMLDivElement | null;
		editorAttachment?: Attachment<HTMLDivElement>;
		suggestions: AIComposerSuggestionHandle | undefined;
		selectionMenuHandle: { focusFirst: () => void } | undefined;
		size: Sizes;
		theme?: RichTextInputThemeProps;
		showFixedToolbar: boolean;
		showHoverToolbar: boolean;
		fixedToolbar: RichTextInputFixedToolbarController;
		selectionMenu: AIComposerSelectionMenuController;
		formats: RichTextInputFormat[];
		toolbarClass?: string;
		disabled: boolean;
		/** Focusable and selectable, but not editable; the formatting toolbar is hidden. */
		readOnly?: boolean;
		placeholder: string;
		standalone?: boolean;
		maxHeight?: RichTextInputMaxHeight;
		isEmpty: boolean;
		class?: string;
		menu: TriggerState | null;
		caretAnchor: AnchoredReference | null;
		suggestionGroups: CommandGroup<string>[];
		suggestionTitle: string;
		suggestionStatus: RichTextInputSearchStatus;
		suggestionError: unknown | null;
		suggestionEmpty: string;
		onKeydown: (event: KeyboardEvent) => void;
		onFocus?: (event: FocusEvent) => void;
		onBlur?: (event: FocusEvent) => void;
		onSuggestionSelect: (value: string) => void;
		onSuggestionDismiss: () => void;
		onSuggestionHighlightChange: (value: string | undefined) => void;
	}>;

	let {
		id,
		rootElement = $bindable<HTMLDivElement | null>(null),
		editorAttachment,
		suggestions = $bindable<AIComposerSuggestionHandle | undefined>(),
		selectionMenuHandle = $bindable<{ focusFirst: () => void } | undefined>(),
		size,
		theme,
		showFixedToolbar,
		showHoverToolbar,
		fixedToolbar,
		selectionMenu,
		formats,
		toolbarClass,
		disabled,
		readOnly = false,
		placeholder,
		standalone = false,
		maxHeight = false,
		isEmpty,
		class: className,
		menu,
		caretAnchor,
		suggestionGroups,
		suggestionTitle,
		suggestionStatus,
		suggestionError,
		suggestionEmpty,
		onKeydown,
		onFocus,
		onBlur,
		onSuggestionSelect,
		onSuggestionDismiss,
		onSuggestionHighlightChange,
		...attachments
	}: Props = $props();

	const classes = $derived(useRichTextInputTheme(theme));
</script>

<div
	data-slot="rich-text-input-root"
	class={classes.root({ size, disabled, className })}
	{...attachments}
>
	{#if showFixedToolbar && !readOnly}
		<div
			data-slot="rich-text-input-toolbar"
			class={classes.fixedToolbar({ size, standalone, class: toolbarClass })}
		>
			<RichTextInputFormattingToolbar
				{size}
				{theme}
				formats={fixedToolbar.formats}
				blockType={fixedToolbar.blockType}
				listType={fixedToolbar.listType}
				linkUrl={fixedToolbar.linkUrl}
				availableFormats={formats}
				onFormat={(format) => fixedToolbar.format(format)}
				onList={(listType) => fixedToolbar.list(listType)}
				onBlock={(blockType) => fixedToolbar.block(blockType)}
				onLink={(url) => fixedToolbar.link(url)}
				class="min-w-0"
			/>
		</div>
	{/if}

	<RichTextInputViewport
		{id}
		bind:rootElement
		{editorAttachment}
		{size}
		{theme}
		{disabled}
		{readOnly}
		{placeholder}
		{standalone}
		{maxHeight}
		{isEmpty}
		{onKeydown}
		{onFocus}
		{onBlur}
	/>
</div>

<RichTextInputSuggestions
	bind:this={suggestions}
	{size}
	{theme}
	open={menu !== null}
	anchor={caretAnchor}
	items={suggestionGroups}
	query={menu?.query ?? ''}
	title={suggestionTitle}
	status={suggestionStatus}
	error={suggestionError}
	empty={suggestionEmpty}
	onSelect={onSuggestionSelect}
	onDismiss={onSuggestionDismiss}
	onHighlightChange={onSuggestionHighlightChange}
/>

<RichTextInputFormattingToolbar
	bind:this={selectionMenuHandle}
	{size}
	{theme}
	linkUrl={selectionMenu.linkUrl}
	formats={selectionMenu.formats}
	blockType={selectionMenu.blockType}
	listType={selectionMenu.listType}
	availableFormats={formats}
	showDismiss
	selectionTarget={rootElement}
	selectionEnabled={showHoverToolbar && selectionMenu.open}
	selectionPopoverClass={classes.floatingPanel({ size, width: 'toolbar', class: 'p-1' })}
	onFormat={(format) => selectionMenu.format(format)}
	onList={(listType) => selectionMenu.list(listType)}
	onBlock={(blockType) => selectionMenu.block(blockType)}
	onLink={(url) => selectionMenu.link(url)}
	onLinkEditingChange={(isEditing) => selectionMenu.setLinkEditing(isEditing)}
	onDismiss={() => selectionMenu.close()}
	onSelectionClose={() => selectionMenu.close()}
	onSelectionFocusReturn={() => rootElement?.focus({ preventScroll: true })}
/>
