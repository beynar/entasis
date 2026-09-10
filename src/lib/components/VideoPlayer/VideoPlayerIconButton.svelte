<script lang="ts">
	import type { Slot } from '$lib/components/Slot/slot.js';
	import type { WithAttachments } from '$lib/types/props.js';
	import type { Sizes } from '$lib/types/theme.js';
	import Button from '../Button/Button.svelte';
	import { tooltip } from '../Tooltip/tooltip.svelte.js';
	import type { useVideoPlayerTheme } from './videoPlayer.theme.js';

	type VideoPlayerClasses = ReturnType<typeof useVideoPlayerTheme>;
	type Props = WithAttachments<{
		classes: VideoPlayerClasses;
		size: Sizes;
		label: string;
		icon: Slot;
		active?: boolean;
		pressed?: boolean;
		disabled?: boolean;
		class?: string;
		href?: string;
		target?: string;
		rel?: string;
		download?: boolean | string;
		'aria-haspopup'?: boolean | 'menu' | 'dialog' | 'listbox' | 'tree' | 'grid';
		'aria-expanded'?: boolean;
		'aria-controls'?: string;
		onPress?: () => void;
	}>;

	let {
		classes,
		size,
		label,
		icon,
		active = false,
		pressed,
		disabled = false,
		class: className,
		href,
		target,
		rel,
		download,
		'aria-haspopup': ariaHaspopup,
		'aria-expanded': ariaExpanded,
		'aria-controls': ariaControls,
		onPress,
		...attachments
	}: Props = $props();
</script>

<Button
	squared
	variant="ghost"
	color="neutral"
	{size}
	{label}
	{disabled}
	{href}
	{target}
	{rel}
	{download}
	aria-haspopup={ariaHaspopup}
	aria-expanded={ariaExpanded}
	aria-controls={ariaControls}
	data-active={active ? 'true' : undefined}
	aria-pressed={pressed}
	class={classes.controlButton({ size, className })}
	prefix={icon}
	onclick={onPress}
	{@attach tooltip({ content: label, position: 'top', size: 'small' })}
	{...attachments}
/>
