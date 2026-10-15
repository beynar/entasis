<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import AIComposer from './AIComposer.svelte';
	import type { AIComposerHandle, AIComposerProps } from './aiComposer.props.js';

	let { value, defaultValue, onValueChange, ...rest }: AIComposerProps = $props();
	let composer: AIComposerHandle | undefined = $state();
</script>

<Theme>
	<AIComposer
		bind:this={composer}
		{value}
		{defaultValue}
		{onValueChange}
		toolbar="none"
		{...rest}
	/>
	<button type="button" onclick={() => composer?.clear()}>Clear composer</button>
</Theme>
