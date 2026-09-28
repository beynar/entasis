<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import {
		sidebarViewTransition,
		type SidebarViewKind,
		type SidebarViewLayer,
		type SidebarViewsState
	} from './sidebar.views.svelte.js';
	import { useSidebarMotion, useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		views,
		kind,
		layers,
		layerClass,
		label,
		theme,
		children
	}: {
		views: SidebarViewsState;
		/** `panel` slides the whole panel and owns the swipe; `body` slides the menu inside it. */
		kind: SidebarViewKind;
		layers: SidebarViewLayer[];
		/** Classes each layer wears on top of `viewLayer`. */
		layerClass?: string;
		/** Landmark name; the body stage is the nav landmark. */
		label?: string;
		theme?: SidebarThemeProps;
		children: Snippet<[layer: SidebarViewLayer]>;
	} = $props();

	const classes = $derived(useSidebarTheme(theme));
	// The `view` motion of the Sidebar motion slot: travel, rest opacity, duration and easing come
	// from it, so a `<Theme motion>` retune and a reduced-motion preference reach the view slide.
	const resolveMotion = useSidebarMotion();
	const motion = $derived(resolveMotion({ part: 'view' }, { motion: theme?.motion }));
	const duration = $derived(motion.in.duration ?? 0);
	const travel = $derived(motion.in.x ?? 0);
	const restOpacity = $derived(motion.in.opacity ?? 0);
	const isPanel = $derived(kind === 'panel');
	const swipe = $derived(views.canSwipeBack);
	const dragging = $derived(views.swipe?.phase === 'drag');

	// A settling swipe (commit or cancel) ends once its layers have eased to rest.
	$effect(() => {
		const phase = views.swipe?.phase;
		if (!isPanel || !phase || phase === 'drag') return;
		const timer = setTimeout(() => views.settleSwipe(), duration);
		return () => clearTimeout(timer);
	});

	// Focus that sat in the view being replaced lands in the new one: on the row that opens the view
	// just left (a back row after going deeper, the row that opened it after coming back), else on
	// the first control. Focus anywhere else stays put, so a route change never pulls it here.
	const arrive: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			const stage = node.parentElement;
			const active = document.activeElement;
			if (node.dataset.swipe || !stage || !(active instanceof HTMLElement)) return;
			if (!stage.contains(active) || node.contains(active)) return;
			const from = views.lastChange.from;
			const target =
				(from !== undefined &&
					node.querySelector<HTMLElement>(`[data-sidebar-view-target="${CSS.escape(from)}"]`)) ||
				node.querySelector<HTMLElement>(
					'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
				);
			target?.focus({ preventScroll: true });
		});
</script>

<svelte:element
	this={isPanel ? 'div' : 'nav'}
	data-slot="sidebar-view-stage"
	data-sidebar={isPanel ? undefined : 'nav'}
	data-view-kind={kind}
	aria-label={label}
	data-no-swipe={isPanel && views.ownsDrawerSwipe ? '' : undefined}
	class={classes.viewStage()}
	{@attach isPanel ? views.swipeAttachment : undefined}
>
	{#each layers as layer (layer.key)}
		{@const swipeStyle = views.swipeStyle(layer.role, travel, restOpacity)}
		<div
			data-slot="sidebar-view-layer"
			data-sidebar="view-layer"
			data-view={layer.view}
			data-swipe={layer.role}
			data-dragging={layer.role && dragging ? 'true' : undefined}
			inert={layer.role === 'under' && dragging ? true : undefined}
			class={[layerClass, classes.viewLayer({ swipe })]}
			style:translate={swipeStyle.translate}
			style:opacity={swipeStyle.opacity}
			style:transition-duration={`${duration}ms`}
			in:sidebarViewTransition={{ phase: 'in', direction: views.lastChange.direction, motion }}
			out:sidebarViewTransition={{ phase: 'out', direction: views.lastChange.direction, motion }}
			{@attach arrive}
		>
			{@render children(layer)}
		</div>
	{/each}
</svelte:element>
