<script lang="ts">
	// Harness for `useHoverAction.svelte.test.ts`: one trigger (with a child, for `mouseout`
	// between descendants) wired to `useHoverAction`, and an element outside it.
	import type { HoverIntentGroup } from './hoverIntent.js';
	import { useHoverAction } from './useHoverAction.svelte.js';

	let {
		delay = 100,
		active = true,
		disabled = false,
		ariaDisabled = false,
		dataDisabled,
		skipDisabled,
		group,
		open = false,
		onEnter,
		onLeave
	}: {
		delay?: number;
		active?: boolean;
		disabled?: boolean;
		ariaDisabled?: boolean;
		dataDisabled?: string;
		skipDisabled?: boolean;
		group?: HoverIntentGroup;
		/** Reported as the owner's open state, for group membership. */
		open?: boolean;
		onEnter?: () => void;
		onLeave?: () => void;
	} = $props();

	const hover = useHoverAction({
		isActive: () => active,
		onMouseEnter: () => onEnter?.(),
		onMouseLeave: () => onLeave?.(),
		delay: () => delay,
		get skipDisabled() {
			return skipDisabled;
		},
		group: () => group,
		isOpen: () => open
	});
</script>

<button
	type="button"
	{disabled}
	aria-disabled={ariaDisabled ? 'true' : undefined}
	data-disabled={dataDisabled}
	{@attach hover.reference}
>
	Trigger <span data-testid="child">child</span>
</button>
<div data-testid="outside">outside</div>
<output data-testid="hovered">{hover.isHovered}</output>
