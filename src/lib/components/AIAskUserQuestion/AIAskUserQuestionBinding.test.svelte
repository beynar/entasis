<script lang="ts">
	import AIAskUserQuestion from './AIAskUserQuestion.svelte';
	import type { AIAskAnswers } from './aiAskUserQuestion.props.js';
	let { onValueChange }: { onValueChange: (value: AIAskAnswers) => void } = $props();
	let value = $state<AIAskAnswers>({ name: 'Initial' });
</script>

<AIAskUserQuestion questions={[{ id: 'name', title: 'Name' }]} bind:value {onValueChange} />
<output data-testid="bound-answers">{JSON.stringify(value)}</output>
<button
	type="button"
	onclick={() => {
		value = { name: 'Parent replacement' };
	}}
>
	Replace answers
</button>
