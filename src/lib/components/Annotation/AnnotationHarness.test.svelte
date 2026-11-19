<script lang="ts">
	// An annotation with room round it, in either reading direction, for the browser tests.
	import Annotation from './Annotation.svelte';
	import type { AnnotationProps } from './annotation.props.js';

	let {
		dir = 'ltr',
		below = 0,
		...props
	}: AnnotationProps & {
		dir?: 'ltr' | 'rtl';
		/** Pixels of empty page over the annotation, to put it out of view. */
		below?: number;
	} = $props();
</script>

<div {dir} style:padding="160px 260px" style:margin-top="{below}px" style:width="max-content">
	<Annotation {...props}>target</Annotation>
</div>
