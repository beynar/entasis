<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Code from '$lib/components/Code/Code.svelte';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import { buildThemeSnippet, type ThemeSnippetMode } from './themeSnippet.js';

	let { component }: { component: string } = $props();

	let mode = $state<ThemeSnippetMode>('default');
	const snippet = $derived(buildThemeSnippet(component, mode));
</script>

<Dialog
	type="modal"
	size="large"
	title="Customize the {component} theme"
	description="Copy a ready-to-use override for the set{component}Theme method. Full ships the current default classes; empty gives a blank scaffold to fill in."
	trigger={{ content: 'Customize', variant: 'outline', color: 'neutral', size: 'small' }}
>
	<div class="flex flex-col gap-4">
		<div class="border-neutral-muted inline-flex w-fit gap-1 self-start rounded-lg border p-1">
			<Button
				size="small"
				variant={mode === 'default' ? 'solid' : 'ghost'}
				color="neutral"
				onclick={() => (mode = 'default')}
			>
				Full default
			</Button>
			<Button
				size="small"
				variant={mode === 'empty' ? 'solid' : 'ghost'}
				color="neutral"
				onclick={() => (mode = 'empty')}
			>
				Empty scaffold
			</Button>
		</div>

		<Code language="typescript" code={snippet} maxHeight={440} showLineNumbers />
	</div>
</Dialog>
