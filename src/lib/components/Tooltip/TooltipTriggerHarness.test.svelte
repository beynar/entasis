<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import Theme from '../Theme/Theme.svelte';
	import Tooltip from './Tooltip.svelte';
</script>

{#snippet hint(attach: Attachment<HTMLElement>)}
	<span data-testid="hint" {@attach attach}>What is this?</span>
{/snippet}

{#snippet richBody()}
	<em>Rich</em> trigger
{/snippet}

<Theme>
	<Tooltip content="An explanation" delay={0} trigger={hint} />
	<Tooltip content="More" delay={0} trigger={{ children: richBody }} />
</Theme>
