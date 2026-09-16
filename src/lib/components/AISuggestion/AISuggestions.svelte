<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { getAISuggestionsScrollAreaTheme } from './aiSuggestions.scrollArea.theme.js';
	import type { AISuggestionsProps } from './aiSuggestions.props.js';
	import { useAISuggestionTheme } from './aiSuggestion.theme.js';
	import AISuggestion from './AISuggestion.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		ref = $bindable(null),
		viewportRef = $bindable(null),
		listRef = $bindable(null),
		suggestions,
		label,
		defaultValue,
		value = $bindable(),
		onValueChange,
		disabled = false,
		variant = 'soft',
		scrollFade = true,
		suggestion,
		onSelect,
		class: className,
		theme,
		scrollAreaTheme,
		...scrollAreaProps
	}: AISuggestionsProps = $props();
	const t = $derived(useI18n());
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);
	const classes = $derived(useAISuggestionTheme(theme));
	const resolvedScrollAreaTheme = $derived(getAISuggestionsScrollAreaTheme(scrollAreaTheme));

	function select(nextValue: string) {
		if (disabled) return;
		if (valueState.value !== nextValue) {
			valueState.value = nextValue;
			onValueChange?.(nextValue);
		}
		onSelect?.(nextValue);
	}
</script>

<ScrollArea
	bind:ref
	bind:viewportRef
	label={label ?? t.promptSuggestions}
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
				<AISuggestion
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
