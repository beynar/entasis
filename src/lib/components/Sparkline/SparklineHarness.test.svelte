<script lang="ts">
	// A sparkline in a box of a set size, optionally under a Theme that reduces motion, for the
	// browser tests.
	import Theme from '../Theme/Theme.svelte';
	import Sparkline from './Sparkline.svelte';
	import type { SparklineProps } from './sparkline.props.js';

	let {
		reduceMotion,
		...props
	}: SparklineProps & {
		/** Mounts a Theme with this `reduceMotion`. */
		reduceMotion?: boolean;
	} = $props();
</script>

{#if reduceMotion === undefined}
	<Sparkline {...props} />
{:else}
	<Theme {reduceMotion}>
		<Sparkline {...props} />
	</Theme>
{/if}
