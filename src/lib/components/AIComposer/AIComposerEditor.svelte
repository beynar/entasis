<script lang="ts">
	import RichTextInput from '../RichTextInput/RichTextInput.svelte';
	import type {
		RichTextInputChange,
		RichTextInputFormat,
		RichTextInputHandle,
		RichTextInputSubmitShortcut,
		RichTextInputSuggestionLifecycleState,
		RichTextInputToolbar,
		RichTextInputTriggers
	} from '../RichTextInput/richTextInput.props.js';
	import { aiComposerEditorTheme } from './aiComposer.editor.theme.js';
	import Slot from '../Slot/Slot.svelte';
	import type { Slot as SlotType } from '../Slot/slot.js';
	import type { AIComposerSuggestionLifecycleCallback } from './aiComposer.props.js';
	import { notifyAIComposerSuggestion } from './aiComposerSourceAdapter.js';
	import { useAIComposerTheme, type AIComposerThemeProps } from './aiComposer.theme.js';

	let {
		handle = $bindable<RichTextInputHandle>(),
		value = $bindable(''),
		toolbar,
		formats,
		autoresize,
		triggers,
		placeholder,
		disabled,
		submitShortcut,
		prefix,
		suffix,
		onSubmit,
		onValueChange,
		onSuggestionOpen,
		onSuggestionClose,
		onSuggestionQueryChange,
		onSuggestionHighlightChange,
		theme
	}: {
		handle?: RichTextInputHandle;
		value?: string;
		toolbar: RichTextInputToolbar;
		formats?: RichTextInputFormat[];
		autoresize: boolean;
		triggers: RichTextInputTriggers;
		placeholder: string;
		disabled: boolean;
		submitShortcut: RichTextInputSubmitShortcut;
		prefix?: SlotType;
		suffix?: SlotType;
		onSubmit: (event: KeyboardEvent) => void;
		onValueChange: (payload: RichTextInputChange) => void;
		onSuggestionOpen?: AIComposerSuggestionLifecycleCallback;
		onSuggestionClose?: AIComposerSuggestionLifecycleCallback;
		onSuggestionQueryChange?: AIComposerSuggestionLifecycleCallback;
		onSuggestionHighlightChange?: AIComposerSuggestionLifecycleCallback;
		theme?: AIComposerThemeProps;
	} = $props();

	const classes = $derived(useAIComposerTheme(theme));
</script>

<div data-slot="ai-composer-editor" class={classes.body()}>
	{#if prefix}<Slot render={prefix} />{/if}
	<RichTextInput
		bind:this={handle}
		bind:value
		standalone
		{toolbar}
		{formats}
		maxHeight={autoresize ? 200 : 96}
		{triggers}
		{placeholder}
		{disabled}
		{submitShortcut}
		theme={aiComposerEditorTheme}
		toolbarClass={classes.toolbar()}
		onSubmitShortcut={onSubmit}
		onSuggestionOpen={(state: RichTextInputSuggestionLifecycleState) =>
			notifyAIComposerSuggestion(onSuggestionOpen, state)}
		onSuggestionClose={(state: RichTextInputSuggestionLifecycleState) =>
			notifyAIComposerSuggestion(onSuggestionClose, state)}
		onSuggestionQueryChange={(state: RichTextInputSuggestionLifecycleState) =>
			notifyAIComposerSuggestion(onSuggestionQueryChange, state)}
		onSuggestionHighlightChange={(state: RichTextInputSuggestionLifecycleState) =>
			notifyAIComposerSuggestion(onSuggestionHighlightChange, state)}
		{onValueChange}
		class={classes.editor({ autoresize })}
	/>
	{#if suffix}<Slot render={suffix} />{/if}
</div>
