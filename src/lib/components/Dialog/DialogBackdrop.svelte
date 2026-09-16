<script lang="ts">
	import { useTheme } from '../Theme/theme.state.svelte.js';
	import { useDialogMotion, useDialogTheme } from './dialog.theme.js';
	import { easingBezierStrings } from '$lib/transitions/easingFunctions.js';
	import { DIALOG_Z_BASE, type DialogState } from './dialog.state.svelte.js';
	import { fso } from '$lib/transitions/transition.js';
	import type { ResolvedMotion } from '$lib/utils/motion/index.js';
	import { portal } from '$lib/attachments/portal.js';
	import { useScrollLock } from '$lib/utils/useScrollLock.svelte.js';

	const theme = useTheme();
	const classes = $derived(useDialogTheme());
	const fade = fso();
	// The backdrop is rendered by `Theme` itself, so its own context sits *above* every
	// `setDialogTheme({ motion })` an app makes — resolving a preset here would ignore
	// them and desync the fade from the panel. Follow the topmost dialog's already
	// resolved motion instead; the preset below is only the empty-stack fallback.
	const resolveMotion = useDialogMotion();
	const fallbackMotion = $derived(resolveMotion({ type: 'modal' }));

	const openDialogs = $derived(theme.layers.ofKind('dialog'));
	const isVisible = $derived(openDialogs.length > 0);

	// Swipe-to-dismiss on the top drawer fades the backdrop with the drag; a snap-back
	// or dismissal animates it back via the opacity transition.
	const top = $derived(openDialogs.at(-1)?.state as DialogState | undefined);

	// Latched so the out transition, which runs after the last dialog has left the stack,
	// still fades on the timing that dialog was animating with.
	let lastMotion: ResolvedMotion | undefined;
	const backdropMotion = $derived.by(() => {
		const current = top?.computedTransition;
		if (current) lastMotion = current;
		return current ?? lastMotion ?? fallbackMotion;
	});
	const dragOpacity = $derived(
		top && (top.dragging || top.dragProgress > 0) ? 1 - top.dragProgress : undefined
	);

	useScrollLock({ isActive: () => openDialogs.length > 0 });
</script>

{#if isVisible}
	<div
		{@attach portal()}
		class="fixed inset-0"
		style:z-index={DIALOG_Z_BASE - 1}
		aria-hidden="true"
	>
		<div
			class={classes.backdrop()}
			style:opacity={dragOpacity}
			style:transition={top?.dragging
				? 'none'
				: `opacity ${backdropMotion.out.duration ?? 0}ms ${
						easingBezierStrings[backdropMotion.out.easing ?? 'cubicInOut']
					}`}
			in:fade={{
				opacity: 0,
				duration: backdropMotion.in.duration,
				easing: backdropMotion.in.easing
			}}
			out:fade={{
				opacity: 0,
				duration: backdropMotion.out.duration,
				easing: backdropMotion.out.easing
			}}
		></div>
	</div>
{/if}
