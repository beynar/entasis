<script lang="ts">
	// An AIMessage whose text may start with a token, drawn by the built-in token or by an app's own
	// mention component.
	import Theme from '../Theme/Theme.svelte';
	import AIMessage from './AIMessage.svelte';
	import Mention from './AIMessageHoverMention.test.svelte';

	let { content = '', custom = false }: { content?: string; custom?: boolean } = $props();
</script>

<Theme>
	<div style="width: 480px">
		<AIMessage
			from="user"
			{content}
			markdownProps={custom ? { mdxComponents: { Mention } } : undefined}
		/>
	</div>
</Theme>
