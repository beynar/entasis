<script lang="ts">
	// Separators of a known length, in either reading direction, for the browser tests.
	import Separator from './Separator.svelte';
	import type { SeparatorProps } from './separator.props.js';

	let { dir = 'ltr', ...props }: SeparatorProps & { dir?: 'ltr' | 'rtl' } = $props();
</script>

<div
	{dir}
	style:width="400px"
	style:height={props.orientation === 'vertical' ? '200px' : undefined}
	style:display={props.orientation === 'vertical' ? 'flex' : undefined}
>
	<Separator {...props} />
</div>
