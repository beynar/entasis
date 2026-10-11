<script lang="ts">
	// Harness for `openLifecycle.svelte.test.ts`: one surface animated by a Svelte transition (or
	// none), reporting its lifecycle status and callbacks.
	import type { TransitionConfig } from 'svelte/transition';
	import { useOpenLifecycle } from './openLifecycle.svelte.js';

	let {
		open = false,
		duration = 0,
		animated = true,
		onAfterOpen,
		onAfterClose
	}: {
		open?: boolean;
		/** The transition duration in ms; jsdom's `animate` stub ends a real one a few macrotasks later. */
		duration?: number;
		/** Whether the surface has a transition at all. */
		animated?: boolean;
		onAfterOpen?: () => void;
		onAfterClose?: () => void;
	} = $props();

	const lifecycle = useOpenLifecycle({
		isOpen: () => open,
		onAfterOpen: () => onAfterOpen?.(),
		onAfterClose: () => onAfterClose?.()
	});
	const fade = lifecycle.transition(
		(_node: Element, params: { duration: number }): TransitionConfig => ({
			duration: params.duration,
			css: (t) => `opacity: ${t}`
		})
	);
</script>

<p data-testid="status">{lifecycle.status}</p>
<!-- One if/else-if chain: a nested block would keep Svelte from playing the local transition. -->
{#if open && animated}
	<div
		data-testid="surface"
		in:fade={{ duration }}
		out:fade={{ duration }}
		onintroend={lifecycle.introEnd}
		onoutroend={lifecycle.outroEnd}
	>
		Surface
	</div>
{:else if open}
	<div data-testid="surface">Surface</div>
{/if}
