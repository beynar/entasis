<script lang="ts">
	// Test-only harness: one AIMessage inside a Theme, in a fixed-width box and a chosen direction.
	import type { Colors } from '$lib/types/theme.js';
	import Theme from '../Theme/Theme.svelte';
	import AIMessage from './AIMessage.svelte';
	import type { AIMessageVariant } from './aiMessage.props.js';

	let {
		from = 'assistant',
		content = 'Hello',
		variant,
		color,
		streaming = false,
		dir = 'ltr',
		width = 640,
		files,
		onEdit,
		onRetry
	}: {
		from?: 'user' | 'assistant';
		content?: string;
		variant?: AIMessageVariant;
		color?: Colors;
		streaming?: boolean;
		dir?: 'ltr' | 'rtl';
		width?: number;
		files?: { name: string; size?: number; type?: string }[];
		onEdit?: () => void;
		onRetry?: () => void;
	} = $props();
</script>

<Theme>
	<div {dir} data-testid="container" style:width={`${width}px`}>
		<AIMessage
			{from}
			{content}
			{variant}
			{color}
			{streaming}
			{files}
			actionsVisibility="always"
			copyable
			{onEdit}
			{onRetry}
		/>
	</div>
</Theme>
