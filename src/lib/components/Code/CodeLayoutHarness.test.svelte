<script lang="ts">
	// A Code in a height-bound flex column, like a Dialog body (`flex min-h-0 flex-1 flex-col`).
	import Theme from '../Theme/Theme.svelte';
	import Code from './Code.svelte';

	let {
		code,
		wrap = false,
		showLineNumbers = false,
		tabSize = 2,
		maxHeight,
		class: className
	}: {
		code: string;
		wrap?: boolean;
		showLineNumbers?: boolean;
		tabSize?: number;
		maxHeight?: number;
		class?: string;
	} = $props();
</script>

<Theme>
	<div
		data-testid="panel"
		style="display: flex; flex-direction: column; height: 300px; width: 360px;"
	>
		<div data-testid="body" class="flex min-h-0 flex-1 flex-col">
			<Code language="js" {code} {wrap} {showLineNumbers} {tabSize} {maxHeight} class={className} />
		</div>
	</div>
</Theme>
