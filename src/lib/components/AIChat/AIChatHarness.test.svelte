<script lang="ts">
	// Test-only harness: AIChat or AIChatSkeleton in a fixed-size box inside a Theme.
	import Theme from '../Theme/Theme.svelte';
	import type { AIThreadItem } from '../AIThread/aiThread.props.js';
	import AIChat from './AIChat.svelte';
	import AIChatSkeleton from './AIChatSkeleton.svelte';

	let {
		scenario = 'chat',
		messages = [],
		error,
		suggestions = [],
		contentWidth,
		customErrorRegion = false,
		onRetry
	}: {
		scenario?: 'chat' | 'skeleton';
		messages?: AIThreadItem[];
		error?: unknown;
		suggestions?: string[];
		contentWidth?: string | number;
		customErrorRegion?: boolean;
		onRetry?: (payload: { target?: unknown }) => void;
	} = $props();
</script>

{#snippet errorRegion()}
	<div data-testid="custom-error">Custom error</div>
{/snippet}

<Theme>
	<div data-testid="container" style:width="960px" style:height="560px" style:display="flex">
		{#if scenario === 'skeleton'}
			<AIChatSkeleton class="h-full w-full" />
		{:else}
			<AIChat
				{messages}
				{error}
				{suggestions}
				{contentWidth}
				{onRetry}
				errorRegion={customErrorRegion ? errorRegion : undefined}
				class="h-full w-full"
			/>
		{/if}
	</div>
</Theme>
