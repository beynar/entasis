<script lang="ts">
	import type { AnchoredReference } from './anchored-reference.js';
	import Popover from '../Popover/Popover.svelte';
	import Command from '../Command/Command.svelte';
	import type { CommandGroup } from '../Command/command.props.js';
	import type { CommandState } from '../Command/command.state.svelte.js';
	import type { Sizes } from '$lib/types/theme.js';
	import type { RichTextInputThemeProps } from './richTextInput.theme.js';
	import { useRichTextInputTheme } from './richTextInput.theme.js';

	type Props = {
		size: Sizes;
		theme?: RichTextInputThemeProps;
		open: boolean;
		anchor: AnchoredReference | null;
		items: CommandGroup<string>[];
		query: string;
		title: string;
		status?: 'idle' | 'loading' | 'error';
		error?: unknown | null;
		empty?: string;
		onSelect: (value: string) => void;
		onDismiss: () => void;
		onHighlightChange?: (value: string | undefined) => void;
		class?: string;
	};

	let {
		size,
		theme,
		open,
		anchor,
		items,
		query,
		title,
		status = 'idle',
		error = null,
		empty = 'No results found.',
		onSelect,
		onDismiss,
		onHighlightChange,
		class: className
	}: Props = $props();

	let command: { commandState: CommandState<string> } | undefined = $state();
	let popoverOpen = $derived(open && anchor !== null);

	const classes = $derived(useRichTextInputTheme(theme));

	export function moveHighlight(delta: number) {
		command?.commandState.move(delta);
	}

	export function selectHighlighted() {
		if (command?.commandState.selectHighlighted()) return true;
		const firstItem = visibleItems.flatMap((group) => group.items).find((item) => !item.disabled);
		if (!firstItem) return false;
		onSelect(firstItem.value);
		return true;
	}

	const visibleItems = $derived(items);
	const hasVisibleItems = $derived(visibleItems.some((group) => group.items.length > 0));
	const showStatusFooter = $derived(status !== 'idle' && hasVisibleItems);
	const errorLabel = $derived(
		error instanceof Error
			? error.message
			: typeof error === 'string'
				? error
				: 'Could not load suggestions.'
	);

	function handlePopoverClose() {
		if (open) onDismiss();
	}
</script>

{#snippet emptyState()}
	{#if status === 'loading'}
		<span data-slot="ai-composer-suggestions-loading" aria-live="polite"> Searching... </span>
	{:else if status === 'error'}
		<span data-slot="ai-composer-suggestions-error" class={classes.suggestionsError()}>
			{errorLabel}
		</span>
	{:else}
		{empty}
	{/if}
{/snippet}

{#snippet statusFooter()}
	<div
		data-slot="ai-composer-suggestions-status"
		class={classes.suggestionsStatus({ size, status: status === 'error' ? 'error' : 'loading' })}
		aria-live="polite"
	>
		{#if status === 'loading'}
			Searching...
		{:else if status === 'error'}
			{errorLabel}
		{/if}
	</div>
{/snippet}

<Popover
	bind:open={popoverOpen}
	ref={anchor}
	position="bottom-start"
	offset={6}
	lockScroll={false}
	directedTransition={false}
	closeOnClickOutside
	closeOnEscape
	class={classes.floatingPanel({ size, width: 'suggestions', class: className })}
	onAfterClose={handlePopoverClose}
>
	<Command
		bind:this={command}
		{size}
		items={visibleItems}
		search={query}
		{title}
		empty={emptyState}
		shouldFilter={false}
		showInput={false}
		closeOnSelect={false}
		footer={showStatusFooter ? statusFooter : undefined}
		{onSelect}
		{onHighlightChange}
	/>
</Popover>
