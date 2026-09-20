export const aiMarkerDescription = `
# AIMarker

Transcript marker with default, separator, and bottom-border variants.

\`\`\`svelte
<script>
  import { AIMarker } from 'entasis/ai-marker';
  import { fileTextIcon } from 'entasis/icons/fileText';
</script>

{#snippet icon()}{@render fileTextIcon({ size: 16 })}{/snippet}
{#snippet content()}<span>Imported <strong>3 files</strong></span>{/snippet}

<AIMarker variant="separator" {icon} {content} aria-label="Imported files" />
\`\`\`
`;
