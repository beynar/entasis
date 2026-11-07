<script lang="ts">
	// Test-only: a file preview under the French catalog.
	import { setI18n } from '$lib/i18n/context.svelte.js';
	import { fr } from '$lib/i18n/fr.js';
	import Theme from '../Theme/Theme.svelte';
	import AIFilePreview from './AIFilePreview.svelte';
	import type { AIFilePreviewProps } from './aiFilePreview.props.js';

	let { status }: { status?: AIFilePreviewProps['status'] } = $props();
	setI18n(fr);
</script>

<Theme>
	<AIFilePreview
		file={{ name: 'plan.pdf', size: 1.5 * 1024 ** 2, type: 'application/pdf' }}
		{status}
	/>
</Theme>
