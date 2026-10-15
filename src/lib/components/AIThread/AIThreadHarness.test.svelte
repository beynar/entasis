<script lang="ts">
	// Test-only harness: an AIThread in a fixed-size box inside a Theme, driven by props.
	import Theme from '../Theme/Theme.svelte';
	import AIThread from './AIThread.svelte';
	import type { AIThreadItem, AIThreadMessageActionsVisibility } from './aiThread.props.js';

	let {
		messages = [],
		streaming = false,
		error,
		suggestions,
		width = 720,
		height = 400,
		showToc = false,
		messageActionsVisibility,
		onErrorRetry,
		onSelect
	}: {
		messages?: AIThreadItem[];
		streaming?: boolean;
		error?: unknown;
		suggestions?: string[];
		width?: number;
		height?: number;
		showToc?: boolean;
		messageActionsVisibility?: AIThreadMessageActionsVisibility;
		onErrorRetry?: () => void;
		onSelect?: (suggestion: string) => void;
	} = $props();
</script>

<Theme>
	<div
		data-testid="container"
		style:width={`${width}px`}
		style:height={`${height}px`}
		style:display="flex"
	>
		<AIThread
			{messages}
			{streaming}
			{error}
			{suggestions}
			{showToc}
			{messageActionsVisibility}
			{onErrorRetry}
			{onSelect}
			scrollBehavior="instant"
		/>
	</div>
</Theme>
