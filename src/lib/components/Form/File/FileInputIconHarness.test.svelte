<script lang="ts">
	import { plusIcon } from '../../Icons/plus.js';
	import Theme from '../../Theme/Theme.svelte';
	import FileInput from './FileInput.svelte';

	let { custom = false }: { custom?: boolean } = $props();
</script>

<Theme>
	{#if custom}
		<FileInput label="Photos" placeholder="Add" placeholderIcon={plusIcon} />
	{:else}
		<FileInput label="Photos" />
	{/if}
</Theme>
