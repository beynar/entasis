<script lang="ts">
	import { sectionComponent } from '../components.js';
	import type { Params, SectionType } from '../engine/types.js';

	let { type, params }: { type: SectionType; params: Params } = $props();

	const Section = $derived(sectionComponent(type));
</script>

{#if Section}
	<Section {params} />
{:else}
	<div class="bg-danger-muted text-danger-muted-readable p-xl text-sm">
		Missing component for {type.id} ({type.file}).
	</div>
{/if}
