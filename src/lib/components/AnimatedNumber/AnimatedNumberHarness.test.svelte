<script lang="ts">
	// An animated number on a line of text, optionally under a Theme that reduces motion, for the
	// browser tests.
	import Theme from '../Theme/Theme.svelte';
	import AnimatedNumber from './AnimatedNumber.svelte';
	import type { AnimatedNumberProps } from './animatedNumber.props.js';

	let {
		reduceMotion,
		scroller = false,
		...props
	}: AnimatedNumberProps & {
		/** Mounts a Theme with this `reduceMotion`. */
		reduceMotion?: boolean;
		/** Puts the line in a scroll container no taller than it. */
		scroller?: boolean;
	} = $props();
</script>

{#snippet number()}
	<p
		data-testid="line"
		style:font-size="40px"
		style:line-height="60px"
		style:width="max-content"
		style:margin="0"
		style:height={scroller ? '60px' : undefined}
		style:overflow={scroller ? 'auto' : undefined}
	>
		<span data-testid="before">Total</span>
		<AnimatedNumber {...props} />
		<span data-testid="after">today</span>
	</p>
{/snippet}

{#if reduceMotion === undefined}
	{@render number()}
{:else}
	<Theme {reduceMotion}>
		{@render number()}
	</Theme>
{/if}
