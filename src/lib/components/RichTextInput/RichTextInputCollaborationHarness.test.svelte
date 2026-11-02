<script lang="ts">
	// Two RichTextInputs on one shared edytor document, each value shown beside it.
	import { onDestroy } from 'svelte';
	import { createDocument } from 'edytor';
	import Theme from '../Theme/Theme.svelte';
	import RichTextInput from './RichTextInput.svelte';
	import type { RichTextInputChange, RichTextInputHandle } from './richTextInput.props.js';

	let { onSecondChange }: { onSecondChange?: (payload: RichTextInputChange) => void } = $props();

	const document = createDocument({ actor: { id: 'tester', name: 'Tester' } });
	onDestroy(() => document.destroy());
	let first = $state('Shared **draft** text');
	let second = $state('');
	let firstEditor: RichTextInputHandle | undefined = $state();
</script>

<Theme>
	<div data-testid="first">
		<RichTextInput
			bind:this={firstEditor}
			bind:value={first}
			label="First"
			toolbar="none"
			collaboration={{ document }}
		/>
	</div>
	<div data-testid="second">
		<RichTextInput
			bind:value={second}
			label="Second"
			toolbar="none"
			collaboration={{ document }}
			onValueChange={onSecondChange}
		/>
	</div>
	<output data-testid="first-value">{first}</output>
	<output data-testid="second-value">{second}</output>
	<button type="button" onclick={() => (first = 'Replaced by the parent')}>Set first</button>
	<button type="button" onclick={() => firstEditor?.focus()}>Focus first</button>
	<button type="button" onclick={() => firstEditor?.clear()}>Clear first</button>
</Theme>
