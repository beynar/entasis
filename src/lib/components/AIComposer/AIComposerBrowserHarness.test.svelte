<script lang="ts">
	// Harness for `aiComposer.browser.test.ts`: the composer at a desktop or a phone width, with a
	// direct `onSubmit`, a busy queue, a long model name in the footer, and inside AIChat.
	import Theme from '../Theme/Theme.svelte';
	import AIChat from '../AIChat/AIChat.svelte';
	import AIModelSelector from '../AIModelSelector/AIModelSelector.svelte';
	import AIComposer from './AIComposer.svelte';
	import type {
		AIComposerHandle,
		AIComposerQueuedMessage,
		AIComposerSubmitPayload
	} from './aiComposer.props.js';

	let {
		scenario = 'submit',
		width = 720,
		fail = false,
		busy = false,
		voiceInput = false,
		maxTokens,
		queue = $bindable<AIComposerQueuedMessage[]>([]),
		onSubmit
	}: {
		scenario?: 'submit' | 'footer' | 'chat';
		width?: number;
		fail?: boolean;
		busy?: boolean;
		voiceInput?: boolean;
		maxTokens?: number;
		queue?: AIComposerQueuedMessage[];
		onSubmit?: (payload: AIComposerSubmitPayload) => void;
	} = $props();

	let composer: AIComposerHandle | undefined = $state();
	const models = [
		{
			id: 'long',
			label: 'Entasis Research Ultra Long Context Preview',
			provider: 'Entasis',
			contextWindow: 1_000_000
		},
		{ id: 'fast', label: 'Fast', provider: 'Entasis', contextWindow: 128_000 }
	];

	async function submit(payload: AIComposerSubmitPayload): Promise<void> {
		onSubmit?.(payload);
		await new Promise((resolve) => setTimeout(resolve, 20));
		if (fail) throw new Error('The endpoint is unavailable.');
	}
</script>

<Theme>
	<div data-testid="host" style:width={`${width}px`} style:height="560px">
		{#if scenario === 'chat'}
			<AIChat {models} {maxTokens} />
		{:else}
			<AIComposer
				bind:this={composer}
				bind:queue
				{busy}
				{voiceInput}
				fileDropzone
				accept={['image/*', '.pdf']}
				commands={[
					{ id: 'summarize', label: 'Summarize', description: 'Summarize selected context.' }
				]}
				references={{ items: [{ id: 'brief', label: 'brief.md', path: 'docs/brief.md' }] }}
				onSubmit={submit}
				onStop={() => {}}
			>
				{#snippet modelSelector()}
					{#if scenario === 'footer'}
						<AIModelSelector {models} defaultValue="long" />
					{/if}
				{/snippet}
			</AIComposer>
			<button type="button" onclick={() => composer?.submit('From a suggestion')}>
				Submit suggestion
			</button>
		{/if}
	</div>
</Theme>
