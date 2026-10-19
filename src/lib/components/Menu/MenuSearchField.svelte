<script lang="ts">
	import type { Sizes } from '$lib/types/theme.js';
	import { magnifyingGlassIcon } from '../Icons/magnifyingGlass.js';
	import { useMenuTheme, type MenuThemeProps } from './menu.theme.js';

	let {
		value,
		placeholder,
		label,
		size,
		theme,
		listId,
		activeId,
		input = $bindable(),
		oninput,
		onkeydown
	}: {
		value: string;
		placeholder: string;
		label: string;
		size: Sizes;
		theme?: MenuThemeProps;
		/** The `role="menu"` element the field filters and drives. */
		listId: string;
		/** The id of the highlighted row, which the field names as its active descendant. */
		activeId?: string;
		/** The input element, for the menu to focus it. */
		input?: HTMLInputElement | null;
		oninput: (value: string) => void;
		onkeydown: (event: KeyboardEvent) => void;
	} = $props();

	const classes = $derived(useMenuTheme(theme));
</script>

<div class={classes.search({ size })}>
	{@render magnifyingGlassIcon({ class: classes.searchIcon({ size }) })}
	<input
		data-1p-ignore
		bind:this={input}
		class={classes.searchInput({ size })}
		type="text"
		autocomplete="off"
		autocorrect="off"
		autocapitalize="off"
		spellcheck="false"
		aria-label={label}
		aria-controls={listId}
		aria-activedescendant={activeId}
		{placeholder}
		{value}
		oninput={(event) => oninput(event.currentTarget.value)}
		{onkeydown}
	/>
</div>
