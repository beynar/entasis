<script lang="ts">
	// Two icons in one place, crossfading through a blur instead of cutting: the outgoing one
	// shrinks and blurs away while the incoming one grows in sharp, both visible for a moment.
	// With `pulse`, the second icon pops when it arrives, for a confirmation (copied, saved).
	// Durations read the motion tokens, so `<Theme motion>` and reduced motion reach them.
	import type { Snippet } from 'svelte';

	let {
		swapped,
		from,
		to,
		pulse = false,
		class: className
	}: {
		/** Shows `to` when true, `from` when false. */
		swapped: boolean;
		from: Snippet;
		to: Snippet;
		/** Pops `to` as it arrives. */
		pulse?: boolean;
		class?: string;
	} = $props();
</script>

<span
	class={['icon-swap', className]}
	data-swapped={swapped ? 'true' : 'false'}
	data-pulse={pulse ? '' : undefined}
>
	<span class="layer" data-layer="from" aria-hidden={swapped ? 'true' : undefined}>
		{@render from()}
	</span>
	<span class="layer" data-layer="to" aria-hidden={swapped ? undefined : 'true'}>
		{@render to()}
	</span>
</span>

<style>
	.icon-swap {
		display: inline-grid;
		place-items: center;
	}

	.layer {
		grid-area: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		transition-property: opacity, scale, filter;
		transition-duration: var(--duration-fast, 150ms);
		transition-timing-function: var(--ease-enter, cubic-bezier(0.33, 1, 0.68, 1));
	}

	.layer > :global(svg) {
		max-width: 100%;
		max-height: 100%;
	}

	[data-swapped='true'] > [data-layer='from'],
	[data-swapped='false'] > [data-layer='to'] {
		opacity: 0;
		scale: 0.5;
		filter: blur(2px);
	}

	[data-pulse][data-swapped='true'] > [data-layer='to'] {
		animation: icon-swap-pulse var(--duration-slow, 300ms) var(--ease-enter, ease-out);
	}

	@keyframes icon-swap-pulse {
		0% {
			scale: 0.5;
		}
		55% {
			scale: 1.2;
		}
		100% {
			scale: 1;
		}
	}
</style>
