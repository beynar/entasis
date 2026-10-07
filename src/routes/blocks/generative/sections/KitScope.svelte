<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolveKit } from '../engine/kit.js';
	import type { Params } from '../engine/types.js';
	import { provideSectionKit } from './sectionKit.js';

	/** Provides a component kit to every section rendered inside it. */
	let { params, children }: { params?: Params; children: Snippet } = $props();

	const kit = $derived(resolveKit(params));
	provideSectionKit(() => kit);
</script>

{@render children()}
