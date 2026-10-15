<script lang="ts">
	import { untrack } from 'svelte';
	import { transitionSize } from '$lib/attachments/transitionSize.js';
	import { requestOpenChange, type OpenChangeDetails } from '$lib/utils/openChange.js';
	import Popover from '../Popover/Popover.svelte';
	import Slot from '../Slot/Slot.svelte';
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import {
		applyStateAttributes,
		openStateAttributes,
		placementAttributes,
		transitionStatusAttributes
	} from '$lib/utils/stateAttributes.js';
	import type { PopoverApi } from '../Popover/popover.api.js';
	import { reportTooltipContentHover } from './tooltip.surface.js';
	import { useTooltipTheme, useTooltipMotion } from './tooltip.theme.js';

	const theme = useTheme();
	const id = $props.id();
	const surfaceId = `${id}-tooltip`;
	theme.tooltipId = surfaceId;
	let currentTooltip = $state(theme.tooltip);
	// Whether the surface moved from one trigger to another without closing in between: it keeps
	// its place, resizes to the new content and tells neither tooltip to animate in or out.
	let handoff = $state(false);
	let shownFor: HTMLElement | null = null;
	// Whether the open transition of the tooltip now shown has ended. A handoff in the middle of it
	// leaves the new tooltip's `onAfterOpen` to that transition's end, so it fires once.
	let opened = false;

	$effect.pre(() => {
		const next = theme.tooltip;
		untrack(() => {
			const previous = currentTooltip;
			const moved = !!next && !!shownFor && shownFor !== next.ref;
			// The same trigger refreshing its entry (the `open` state seeding it again) changes nothing.
			if (moved) handoff = true;
			else if (!next || !shownFor) handoff = false;
			if (next && !shownFor) opened = false;
			shownFor = next?.ref ?? null;
			// The pointer on the content of a tooltip that is gone is no longer on it.
			if (previous && previous.ref !== next?.ref) reportTooltipContentHover(previous.ref, false);
			// A handed-over tooltip plays no transition of its own, so its lifecycle ends and begins now,
			// unless the one it replaces had not finished opening: then neither of them ever completed,
			// and the open transition still running delivers the new tooltip's `onAfterOpen`.
			if (moved && previous && opened) {
				previous.onAfterClose?.();
				next.onAfterOpen?.();
			}
		});
		if (next) currentTooltip = next;
	});

	function handleAfterOpen() {
		opened = true;
		currentTooltip?.onAfterOpen?.();
	}

	function handleAfterClose() {
		currentTooltip?.onAfterClose?.();
		if (!theme.tooltip) currentTooltip = null;
	}

	function handleOpenChange(open: boolean, details: OpenChangeDetails) {
		if (open) return;
		const shown = theme.tooltip;
		if (!shown) return;
		// A press on the trigger is the trigger's to judge: `closeOnClick` closes the tooltip with
		// the `trigger-press` reason, and `false` leaves it open.
		const target = details.event?.composedPath?.()[0];
		if (
			details.reason === 'outside-press' &&
			target instanceof Node &&
			shown.ref.contains(target)
		) {
			details.cancel();
			return;
		}
		if (!requestOpenChange(shown.onOpenChange, false, details)) return;
		theme.tooltip = null;
	}

	// However the shared surface closes (pointer, focus, Escape, unmount), the hover warm-up
	// window starts: the next tooltip, hover card or hover popover opens at once. A tooltip held
	// open (`open`, keyboard focus) does not warm the group while it shows.
	$effect(() => {
		if (!theme.tooltip) return;
		return () => theme.hoverIntent.markClosed();
	});
	const color = $derived(currentTooltip?.color ?? 'neutral');
	const size = $derived(currentTooltip?.size ?? 'normal');
	const variant = $derived(currentTooltip?.variant ?? 'solid');
	const hoverable = $derived(currentTooltip?.hoverable !== false);
	// The surface grows or shrinks to the content of the trigger it moved to.
	const resizeWithContent = transitionSize({ axis: 'both', isActive: () => handoff });

	const classes = $derived(useTooltipTheme(currentTooltip?.theme));
	// The surface is what a tooltip's `class` and theme style, so it carries the panel's hooks:
	// open state, transition phase and the side it landed on (see `tooltipDataAttributes`).
	const surfaceAttributes = (popover: PopoverApi) => ({
		...openStateAttributes(popover.isOpen),
		...transitionStatusAttributes(popover.status),
		...placementAttributes(
			popover.placement
				? { side: popover.placement.side, align: popover.placement.align ?? undefined }
				: undefined,
			{ anchorHidden: popover.placement?.anchorHidden }
		)
	});
	// Written from here as well as by the template: Svelte pauses the effects of a block while its
	// out-transition plays, so only an effect outside the surface reaches it while it fades out.
	// Raw state: the entry holds a DOM node and is compared by identity when the surface unmounts.
	let surface = $state.raw<{ node: HTMLElement; popover: PopoverApi } | null>(null);
	const trackSurface = (popover: PopoverApi) => (node: HTMLElement) => {
		const entry = { node, popover };
		surface = entry;
		return () => {
			if (surface === entry) surface = null;
		};
	};
	$effect(() => {
		if (surface) applyStateAttributes(surface.node, surfaceAttributes(surface.popover));
	});
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

<!-- Content that ignores the pointer lets it through to the page: the positioning wrapper and
     the surface both need to, since the wrapper is the box that hugs the surface. -->
<Popover
	{id}
	bind:open={() => !!theme.tooltip, () => {}}
	ref={currentTooltip?.ref}
	lockScroll={false}
	tabBridge={false}
	closeOnFocusOut={false}
	position={currentTooltip?.position}
	transition={tooltipTransition}
	closeOnMouseLeave={false}
	offset={currentTooltip?.offset}
	onAfterOpen={handleAfterOpen}
	onAfterClose={handleAfterClose}
	onOpenChange={handleOpenChange}
	class="!w-fit !max-w-fit !bg-transparent !p-0 !shadow-none !ring-0"
	{@attach (wrapper: HTMLElement) => {
		if (hoverable) return;
		wrapper.style.pointerEvents = 'none';
		return () => {
			wrapper.style.pointerEvents = '';
		};
	}}
>
	{#snippet children(popover: PopoverApi)}
		<div
			id={surfaceId}
			role="tooltip"
			data-color={color}
			data-size={size}
			data-variant={variant}
			data-instant={handoff ? '' : undefined}
			{...surfaceAttributes(popover)}
			{@attach trackSurface(popover)}
			class={classes.root({ color, size, variant, className: currentTooltip?.class })}
			style:pointer-events={hoverable ? undefined : 'none'}
			onmouseenter={(event) => {
				if (currentTooltip) reportTooltipContentHover(currentTooltip.ref, true, event);
			}}
			onmouseleave={(event) => {
				if (currentTooltip) reportTooltipContentHover(currentTooltip.ref, false, event);
			}}
		>
			<!-- The surface keeps its minimum width, so its content is what grows and shrinks. -->
			<span
				class="inline-flex items-center justify-center gap-[inherit]"
				{@attach resizeWithContent}
			>
				<Slot render={currentTooltip?.content} />
			</span>
		</div>
	{/snippet}
</Popover>
