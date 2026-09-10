<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { getSuggestionsScrollAreaTheme } from './suggestions.scrollArea.theme.js';
	import type { SuggestionsProps } from './aiSuggestion.props.js';
	import { useAISuggestionTheme } from './aiSuggestion.theme.js';
	import Suggestion from './Suggestion.svelte';

	let {
		ref = $bindable(null),
		viewportRef = $bindable(null),
		listRef = $bindable(null),
		suggestions,
		ariaLabel = 'Prompt suggestions',
		defaultValue,
		value = $bindable(),
		onValueChange,
		disabled = false,
		variant = 'soft',
		scrollFade = true,
		suggestion,
		onSuggestionSelect,
		class: className,
		theme,
		scrollAreaTheme,
		...scrollAreaProps
	}: SuggestionsProps = $props();
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);
	const classes = $derived(useAISuggestionTheme(theme));
	const resolvedScrollAreaTheme = $derived(getSuggestionsScrollAreaTheme(scrollAreaTheme));

	function select(nextValue: string) {
		if (disabled) return;
		if (valueState.value !== nextValue) {
			valueState.value = nextValue;
			onValueChange?.(nextValue);
		}
		onSuggestionSelect?.(nextValue);
	}
</script>

<ScrollArea
	bind:ref
	bind:viewportRef
	{ariaLabel}
	{scrollFade}
	theme={resolvedScrollAreaTheme}
	{...scrollAreaProps}
	data-slot="ai-suggestions"
	data-disabled={disabled ? 'true' : undefined}
	data-value={valueState.value}
	aria-disabled={disabled}
	class={classes.root({ className })}
>
	<div bind:this={listRef} data-slot="ai-suggestions-list" class={classes.list()}>
		{#each suggestions as item, index (`${item}:${index}`)}
			{#if suggestion}
				<Slot
					render={suggestion}
					payload={{
						suggestion: item,
						selected: valueState.value === item,
						disabled,
						select: () => select(item)
					}}
				/>
			{:else}
				<Suggestion
					suggestion={item}
					selected={valueState.value === item}
					{disabled}
					{variant}
					onSelect={select}
					{theme}
				/>
			{/if}
		{/each}
	</div>
</ScrollArea>
