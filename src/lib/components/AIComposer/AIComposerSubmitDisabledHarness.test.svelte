<script lang="ts">
	// A composer whose sending the app holds (`submitDisabled`), with a button that inserts text the
	// way a dictation would.
	import Theme from '../Theme/Theme.svelte';
	import AIComposer from './AIComposer.svelte';
	import type { AIComposerHandle, AIComposerSubmitPayload } from './aiComposer.props.js';

	let {
		submitDisabled = false,
		busy = false,
		onSubmit
	}: {
		submitDisabled?: boolean;
		busy?: boolean;
		onSubmit?: (payload: AIComposerSubmitPayload) => void;
	} = $props();

	let composer: AIComposerHandle | undefined = $state();
</script>

<Theme>
	<div style="width: 720px; height: 400px;">
		<AIComposer
			bind:this={composer}
			{submitDisabled}
			{busy}
			fileDropzone
			onSubmit={(payload) => onSubmit?.(payload)}
			onStop={() => {}}
		>
			{#snippet actions()}
				<button type="button" onclick={() => composer?.insertText(' dictated')}>Dictate</button>
			{/snippet}
		</AIComposer>
	</div>
</Theme>
