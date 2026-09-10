<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import Button from '../Button/Button.svelte';
	import type { textBIcon } from '../Icons/textB.js';
	import { tooltip } from '../Tooltip/tooltip.svelte.js';
	import type { Sizes } from '$lib/types/theme.js';
	import type { RichTextInputThemeProps } from './richTextInput.theme.js';
	import { useRichTextInputTheme } from './richTextInput.theme.js';

	type Props = {
		size: Sizes;
		theme?: RichTextInputThemeProps;
		label: string;
		icon: typeof textBIcon;
		active: boolean;
		shortcut?: string;
		onSelect: () => void;
	};

	let { size, theme, label, icon, active, shortcut, onSelect }: Props = $props();

	const classes = $derived(useRichTextInputTheme(theme));
	const preserveSelection: Attachment<HTMLElement> = (node) => {
		const onPointerDown = (event: PointerEvent) => event.preventDefault();
		node.addEventListener('pointerdown', onPointerDown);
		return () => node.removeEventListener('pointerdown', onPointerDown);
	};
</script>

{#snippet iconSlot()}
	{@render icon({ class: classes.toolbarIcon({ size }), 'aria-hidden': 'true' })}
{/snippet}

<Button
	type="button"
	color="neutral"
	variant={active ? 'soft' : 'ghost'}
	{size}
	{label}
	aria-pressed={active || undefined}
	class={`${classes.toolbarButton({ size })} rich-text-input-toolbar-control`}
	prefix={iconSlot}
	onclick={onSelect}
	{@attach preserveSelection}
	{@attach tooltip({ content: shortcut ? `${label} (${shortcut})` : label, delay: 350 })}
/>
