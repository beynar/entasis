<script lang="ts">
	import type { Slot } from '$lib/components/Slot/slot.js';
	import type { WithAttachments } from '$lib/types/props.js';
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import Button from '../Button/Button.svelte';
	import type { ButtonInternalProps } from '../Button/button.props.js';
	import { tooltip } from '../Tooltip/tooltip.attachment.svelte.js';

	/**
	 * The control-bar button shared by the media players: a squared icon Button carrying its own
	 * tooltip. The owning player resolves the class string from its theme and passes it in, so this
	 * component stays free of any one player's theme.
	 */
	type Props = WithAttachments<{
		size: Sizes;
		label: string;
		icon: Slot;
		/** Resolved class string from the owning player's theme. */
		class?: string;
		/** `solid` marks the primary transport button; every other control is a ghost. */
		variant?: 'ghost' | 'solid';
		/** Color used while the button is solid or active. Ghost + inactive is always neutral. */
		color?: Colors;
		active?: boolean;
		pressed?: boolean;
		disabled?: boolean;
		href?: string;
		target?: string;
		rel?: string;
		download?: boolean | string;
		haspopup?: ButtonInternalProps['haspopup'];
		expanded?: boolean;
		controls?: string;
		onPress?: () => void;
	}>;

	let {
		size,
		label,
		icon,
		class: className,
		variant = 'ghost',
		color = 'neutral',
		active = false,
		pressed,
		disabled = false,
		href,
		target,
		rel,
		download,
		haspopup,
		expanded,
		controls,
		onPress,
		...attachments
	}: Props = $props();
</script>

<Button
	squared
	{variant}
	color={variant === 'solid' || active ? color : 'neutral'}
	{size}
	{label}
	{disabled}
	{href}
	{target}
	{rel}
	{download}
	{haspopup}
	{expanded}
	{controls}
	data-active={active ? 'true' : undefined}
	{pressed}
	class={className}
	prefix={icon}
	onclick={onPress}
	{@attach tooltip({ content: label, position: 'top', size: 'small' })}
	{...attachments}
/>
