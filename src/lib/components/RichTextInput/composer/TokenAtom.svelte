<script lang="ts" module>
	import type { InlineBlockSnippetPayload } from 'edytor';
	import type { AIComposerTokenData } from './markdown.js';

	// The token atom's markup in the editor. edytor wraps it in a non-editable span and keeps it one
	// unit: a click selects it and Backspace removes it whole. `data-ai-token` carries the kind,
	// which AIComposer tints.
	export { tokenAtom };
</script>

{#snippet tokenAtom({ block }: InlineBlockSnippetPayload<AIComposerTokenData>)}
	<span
		data-ai-token={block.data.kind}
		data-ai-token-id={block.data.id}
		class="cn-ai-composer-token border-neutral-muted bg-neutral-muted text-neutral-muted-readable inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 align-baseline text-xs font-medium select-none"
		>{block.data.label}</span
	>
{/snippet}
