<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import AIComposer from './AIComposer.svelte';
	import type { AIComposerHandle, AIComposerProps } from './aiComposer.props.js';

	let {
		value,
		defaultValue,
		onValueChange
	}: Pick<AIComposerProps, 'value' | 'defaultValue' | 'onValueChange'> = $props();
	let composer: AIComposerHandle | undefined = $state();
</script>

<Theme>
	<AIComposer bind:this={composer} {value} {defaultValue} {onValueChange} toolbar="none" />
	<button type="button" onclick={() => composer?.clear()}>Clear composer</button>
</Theme>
