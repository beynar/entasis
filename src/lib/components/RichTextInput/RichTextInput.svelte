<script lang="ts">
	import { untrack } from 'svelte';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Field from '../Form/Field/Field.svelte';
	import { createFieldState } from '../Form/Field/field.state.svelte.js';
	import { AI_COMPOSER_DEFAULT_RICH_TEXT_FORMATS } from './composer/selection-formatting.js';
	import type {
		RichTextInputItem,
		RichTextInputProps as Props,
		RichTextInputToken
	} from './richTextInput.props.js';
	import RichTextInputChrome from './RichTextInputChrome.svelte';
	import { RichTextInputState } from './richTextInput.state.svelte.js';
	import { useRichTextInputTheme } from './richTextInput.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		id: idProp,
		defaultValue = '',
		value = $bindable<string | null>(),
		ref = $bindable<HTMLDivElement | null>(null),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		name,
		onValidate,
		visible,
		triggers = {},
		onSuggestionOpen,
		onSuggestionClose,
		onSuggestionQueryChange,
		onSuggestionHighlightChange,
		onValueChange,
		onSubmitShortcut,
		submitShortcut = 'none',
		toolbar = 'hover',
		standalone = false,
		maxHeight = false,
		formats = AI_COMPOSER_DEFAULT_RICH_TEXT_FORMATS,
		disabled = false,
		placeholder,
		size = 'normal',
		toolbarClass,
		class: className,
		theme,
		header,
		label,
		actions,
		description,
		helper,
		footer,
		prefix,
		suffix,
		error,
		errorsContainer,
		fieldAttrs,
		...attachments
	}: Props = $props();
	const t = $derived(useI18n());
	const valueState = createBindableValue(
		() => value,
		(nextValue) => (value = nextValue),
		() => defaultValue
	);

	const generatedId = $props.id();
	const field = createFieldState({
		get id() {
			return idProp ?? generatedId;
		},
		get value() {
			return valueState.value ?? '';
		},
		set value(nextValue: string | null) {
			valueState.value = nextValue ?? '';
		},
		get errors() {
			return errors;
		},
		set errors(nextErrors: string[] | boolean) {
			errors = nextErrors;
		},
		get focused() {
			return focused;
		},
		set focused(nextFocused: boolean) {
			focused = nextFocused;
		},
		get disabled() {
			return disabled;
		},
		set disabled(nextDisabled: boolean | undefined) {
			disabled = nextDisabled ?? false;
		},
		get required() {
			return required;
		},
		get name() {
			return name;
		},
		set name(nextName: string | undefined) {
			name = nextName;
		},
		get onValidate() {
			return onValidate;
		},
		get visible() {
			return visible;
		},
		type: 'rich-text'
	});

	const state = new RichTextInputState({
		get value() {
			return field.value ?? '';
		},
		set value(nextValue: string) {
			field.value = nextValue;
		},
		get triggers() {
			return triggers;
		},
		get onSuggestionOpen() {
			return onSuggestionOpen;
		},
		get onSuggestionClose() {
			return onSuggestionClose;
		},
		get onSuggestionQueryChange() {
			return onSuggestionQueryChange;
		},
		get onSuggestionHighlightChange() {
			return onSuggestionHighlightChange;
		},
		get onValueChange() {
			return onValueChange;
		},
		get onSubmitShortcut() {
			return onSubmitShortcut;
		},
		get submitShortcut() {
			return submitShortcut;
		},
		get toolbar() {
			return toolbar;
		},
		get formats() {
			return formats;
		},
		get disabled() {
			return field.disabled ?? false;
		}
	});

	const classes = $derived(useRichTextInputTheme(theme));

	export function focus() {
		state.focus();
	}
	export function clear() {
		state.clear();
	}
	export function insertText(text: string) {
		state.insertText(text);
	}
	export function insertItem(trigger: string, item: RichTextInputItem) {
		state.insertItem(trigger, item);
	}
	export function insertToken(token: RichTextInputToken) {
		state.insertToken(token);
	}

	$effect(() => {
		const rootElement = state.rootElement;
		// `ref` is write-only from here: read it untracked so the guard cannot make this
		// effect depend on the parent's binding.
		if (untrack(() => ref) !== rootElement) ref = rootElement;
		field.node = rootElement;
	});
	$effect(() => state.syncEditable());
	$effect(() => state.syncValue());
</script>

{#snippet richTextInputChrome()}
	<RichTextInputChrome
		id={field.id}
		bind:rootElement={state.rootElement}
		bind:suggestions={state.suggestions}
		bind:selectionMenuHandle={state.selectionMenuHandle}
		editorAttachment={state.rootAttachment}
		{size}
		{theme}
		showFixedToolbar={state.showFixedToolbar}
		showHoverToolbar={state.showHoverToolbar}
		fixedToolbar={state.fixedToolbar}
		selectionMenu={state.selectionMenu}
		{formats}
		{toolbarClass}
		disabled={field.disabled ?? false}
		placeholder={placeholder ?? t.aiComposerPlaceholder}
		{standalone}
		{maxHeight}
		isEmpty={state.isEmpty}
		onKeydown={state.handleKeydown}
		onFocus={() => (field.focused = true)}
		onBlur={() => (field.focused = false)}
		menu={state.menu}
		caretAnchor={state.caretAnchor}
		suggestionGroups={state.suggestionGroups}
		suggestionTitle={state.suggestionTitle}
		suggestionStatus={state.suggestionStatus}
		suggestionError={state.suggestionError}
		suggestionEmpty={state.suggestionEmpty}
		onSuggestionSelect={state.selectSuggestion}
		onSuggestionDismiss={state.closeMenu}
		onSuggestionHighlightChange={state.handleSuggestionHighlightChange}
	/>
{/snippet}

{#if standalone}
	<div class={className} {...fieldAttrs} {...attachments}>
		{@render richTextInputChrome()}
	</div>
{:else}
	<Field
		{field}
		{size}
		class={className}
		{header}
		{label}
		{actions}
		{description}
		{helper}
		{footer}
		{prefix}
		{suffix}
		{error}
		{errorsContainer}
		{fieldAttrs}
		theme={{
			...(theme || {}),
			inputContainer: {
				...(theme?.inputContainer || {}),
				base: classes.inputContainer({
					class: theme?.inputContainer?.base,
					size,
					disabled: field.disabled ?? false
				})
			}
		}}
		{...attachments}
	>
		{@render richTextInputChrome()}
	</Field>
{/if}

<input
	type="hidden"
	name={field.name}
	value={field.value ?? ''}
	disabled={field.disabled || undefined}
/>
