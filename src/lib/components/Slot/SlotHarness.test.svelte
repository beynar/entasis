<script lang="ts">
	import Slot from './Slot.svelte';

	let {
		mode,
		class: className = '',
		renderIf = true,
		fallback = false
	}: {
		mode: 'none' | 'empty' | 'text' | 'snippet';
		class?: string;
		renderIf?: boolean;
		fallback?: boolean;
	} = $props();
</script>

{#snippet content(payload: string)}
	<b data-testid="snippet">{payload}</b>
{/snippet}

<div data-testid="host">
	{#if fallback}
		<Slot
			render={mode === 'text'
				? 'Text'
				: mode === 'empty'
					? ''
					: mode === 'snippet'
						? content
						: undefined}
			payload="payload"
			as="span"
			class={className}
			attrs={{ 'data-wrapper': '' }}
			{renderIf}
		>
			<i data-testid="fallback">Fallback</i>
		</Slot>
	{:else}
		<Slot
			render={mode === 'text'
				? 'Text'
				: mode === 'empty'
					? ''
					: mode === 'snippet'
						? content
						: undefined}
			payload="payload"
			as="span"
			class={className}
			attrs={{ 'data-wrapper': '' }}
			{renderIf}
		/>
	{/if}
</div>
