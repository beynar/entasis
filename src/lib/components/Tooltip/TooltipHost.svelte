<script lang="ts">
	import Popover from '../Popover/Popover.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import { useTooltipTheme, useTooltipMotion } from './tooltip.theme.js';

	const theme = useTheme();
	const id = $props.id();
	const surfaceId = `${id}-tooltip`;
	theme.tooltipId = surfaceId;
	let currentTooltip = $state(theme.tooltip);

	$effect.pre(() => {
		if (theme.tooltip) currentTooltip = theme.tooltip;
	});

	function handleAfterClose() {
		currentTooltip?.onAfterClose?.();
		if (!theme.tooltip) currentTooltip = null;
	}

	function handleOpenChange(open: boolean) {
		if (open) return;
		theme.tooltip = null;
		theme.lastTooltipClosed = Date.now();
	}
	const color = $derived(currentTooltip?.color ?? 'neutral');
	const size = $derived(currentTooltip?.size ?? 'normal');
	const variant = $derived(currentTooltip?.variant ?? 'solid');

	const classes = $derived(useTooltipTheme(currentTooltip?.theme));
	// Own motion preset (ladder: registry → setTooltipTheme → theme.motion → transition
	// prop), handed to the Popover as an already-resolved `{ in, out }`.
	const resolveMotion = useTooltipMotion();
	const tooltipTransition = $derived(
		resolveMotion(undefined, {
			motion: currentTooltip?.theme?.motion,
			transition: currentTooltip?.transition
		})
	);
</script>

<Popover
	{id}
	open={!!theme.tooltip}
	ref={currentTooltip?.ref}
	lockScroll={false}
	position={currentTooltip?.position}
	transition={tooltipTransition}
	closeOnMouseLeave={false}
	offset={currentTooltip?.offset}
	onAfterOpen={currentTooltip?.onAfterOpen}
	onAfterClose={handleAfterClose}
	onOpenChange={handleOpenChange}
	class="!w-fit !max-w-fit !bg-transparent !p-0 !shadow-none !ring-0"
>
	<div
		id={surfaceId}
		role="tooltip"
		data-color={color}
		data-size={size}
		data-variant={variant}
		class={classes.root({ color, size, variant, className: currentTooltip?.class })}
	>
		<Slot render={currentTooltip?.content} />
	</div>
</Popover>
