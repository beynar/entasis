<script lang="ts">
	// Harness for `aiThemeKeys.svelte.test.ts`: the AI input components under one `<Theme
	// components>` registry, so a registry key that does not match the component's own key shows.
	import Theme from '../Theme/Theme.svelte';
	import AIFilePreview from '../AIFilePreview/AIFilePreview.svelte';
	import AIModelSelector from '../AIModelSelector/AIModelSelector.svelte';
	import AISuggestions from './AISuggestions.svelte';
</script>

<Theme
	components={{
		'ai-suggestion': { suggestion: { base: 'registry-suggestion' } },
		'ai-file-preview': { root: { base: 'registry-file-preview' } },
		'ai-model-selector': { root: { base: 'registry-model-selector' } }
	}}
>
	<AISuggestions suggestions={['Summarize']} />
	<AIFilePreview file={{ name: 'brief.pdf', size: 2048, type: 'application/pdf' }} />
	<AIModelSelector models={[{ id: 'fast', label: 'Fast' }]} />
</Theme>
