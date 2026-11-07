<script lang="ts">
	// A ```mermaid fence. While it is being written the source is often invalid, so a failure keeps
	// the frame; once it is whole, the reader gets what was written instead of an empty box.
	import Code from '../Code/Code.svelte';
	import Mermaid from '../Mermaid/Mermaid.svelte';
	import type { MermaidProps } from '../Mermaid/mermaid.props.js';

	let {
		chart,
		incomplete = false,
		images,
		mermaidSize,
		codeClass,
		frameClass
	}: {
		chart: string;
		incomplete?: boolean;
		images?: boolean;
		mermaidSize: MermaidProps['size'];
		codeClass: string;
		frameClass: string;
	} = $props();

	// The text that failed, not a flag: different text deserves a new try.
	let failedChart = $state<string | null>(null);
</script>

{#if failedChart === chart && !incomplete}
	<Code code={chart} language="mermaid" class={codeClass} />
{:else}
	<Mermaid
		{chart}
		errorForgiving
		{images}
		size={mermaidSize}
		class={frameClass}
		onError={() => (failedChart = chart)}
		onRender={() => (failedChart = null)}
	/>
{/if}
