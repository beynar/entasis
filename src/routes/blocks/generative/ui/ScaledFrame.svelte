<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Renders its content at a virtual viewport width and scales it to fit. Sections lay out with
	 * container queries, which measure the unscaled width, so a 1280px frame shown at a third of
	 * its size still lays out as desktop — and a 390px frame as a phone.
	 */
	interface Props {
		/** Virtual width the content lays out at, in CSS pixels. */
		width: number;
		/** Fixed scale; omitted, the frame fits the available width (never above `maxScale`). */
		scale?: number;
		maxScale?: number;
		/** A thumbnail is inert and hidden from assistive technology. */
		thumbnail?: boolean;
		class?: string;
		children: Snippet;
	}

	let {
		width,
		scale,
		maxScale = 1,
		thumbnail = false,
		class: className = '',
		children
	}: Props = $props();

	let available = $state(0);
	let natural = $state(0);
	const resolved = $derived(scale ?? (available > 0 ? Math.min(maxScale, available / width) : 0));
	const inset = $derived(Math.max(0, (available - width * resolved) / 2));
</script>

<div
	bind:clientWidth={available}
	class="relative w-full overflow-hidden {className}"
	style:height={resolved ? `${natural * resolved}px` : undefined}
	aria-hidden={thumbnail ? 'true' : undefined}
	inert={thumbnail}
>
	<div
		bind:offsetHeight={natural}
		class="absolute top-0 origin-top-left"
		class:invisible={!resolved}
		style:left="{inset}px"
		style:width="{width}px"
		style:transform="scale({resolved})"
	>
		{@render children()}
	</div>
</div>
