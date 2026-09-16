<script lang="ts">
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import { setDialogTheme, type DialogType } from '$lib/components/Dialog/index.js';
	import type { MotionDurationToken, MotionEasingToken } from '$lib/utils/motion/index.js';

	let {
		duration,
		easing,
		type
	}: {
		/** Duration token the retuned preset resolves against the Theme scale. */
		duration: MotionDurationToken;
		/** Easing role the retuned preset resolves against the Theme scale. */
		easing: MotionEasingToken;
		/** Dialog type, so the demo can compare an in-place modal with a drawer. */
		type: DialogType;
	} = $props();

	// `setDialogTheme` stores the object in context and the resolver reads `motion`
	// when it runs, so a getter keeps the live controls above wired to every dialog
	// rendered below this component.
	setDialogTheme({
		get motion() {
			return { duration, easing };
		}
	});
</script>

<Dialog
	{type}
	size="small"
	title="Retuned dialog"
	description="Its motion comes from setDialogTheme, not from the instance."
	trigger={{ content: 'Open retuned dialog', variant: 'solid', color: 'primary' }}
>
	<p class="text-neutral/70 text-sm">
		This dialog opens with <code class="font-mono">duration: '{duration}'</code> and
		<code class="font-mono">easing: '{easing}'</code>, resolved against the current Theme motion
		scale.
	</p>
</Dialog>
