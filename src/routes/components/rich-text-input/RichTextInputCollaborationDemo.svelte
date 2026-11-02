<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createDocument } from 'edytor';
	import { RichTextInput } from '$lib/components/RichTextInput/index.js';

	// One document, two inputs: what one writes shows in the other, as it would for two people in
	// a room. A room (`room`, `server`) syncs the same way across tabs and machines.
	const document = createDocument({ actor: { id: 'docs-demo', name: 'You' } });
	onDestroy(() => document.destroy());
	let notes = $state('Agenda: **launch** review, then pricing.');
	let mirror = $state('');
</script>

<div class="gap-lg grid w-full md:grid-cols-2">
	<RichTextInput
		label="Your view"
		bind:value={notes}
		toolbar="hover"
		collaboration={{ document }}
	/>
	<RichTextInput
		label="Another view of the same document"
		bind:value={mirror}
		toolbar="hover"
		collaboration={{ document }}
	/>
</div>
