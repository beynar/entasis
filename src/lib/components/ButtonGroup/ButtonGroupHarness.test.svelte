<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Button from '../Button/Button.svelte';
	import ButtonGroup from './ButtonGroup.svelte';

	let { mode }: { mode: 'items' | 'children' } = $props();
</script>

<Theme>
	{#if mode === 'items'}
		<ButtonGroup
			label="Alignment"
			disabled
			items={[{ children: 'Left' }, { children: 'Right', disabled: false }]}
		/>
	{:else}
		<ButtonGroup label="History">
			<Button>Undo</Button>
			<Button variant="outline">Redo</Button>
		</ButtonGroup>
	{/if}
</Theme>
