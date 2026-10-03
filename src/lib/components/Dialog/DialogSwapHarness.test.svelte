<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Dialog from './Dialog.svelte';

	// Two panels that each own a dialog, swapped like the tabs of a docs page.
	let panel = $state<'first' | 'second'>('first');
</script>

<Theme>
	<button type="button" onclick={() => (panel = panel === 'first' ? 'second' : 'first')}>
		Swap panels
	</button>
	{#if panel === 'first'}
		<Dialog title="First" trigger={{ content: 'Open first' }}><p>First body</p></Dialog>
	{:else}
		<Dialog title="Second" trigger={{ content: 'Open second' }}><p>Second body</p></Dialog>
	{/if}
</Theme>
