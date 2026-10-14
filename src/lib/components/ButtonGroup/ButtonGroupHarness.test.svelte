<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Button from '../Button/Button.svelte';
	import ButtonGroup from './ButtonGroup.svelte';

	let { mode }: { mode: 'items' | 'children' | 'focusable' } = $props();
</script>

<Theme>
	{#if mode === 'items'}
		<ButtonGroup
			label="Alignment"
			disabled
			items={[{ children: 'Left' }, { children: 'Right', disabled: false }]}
		/>
	{:else if mode === 'focusable'}
		<ButtonGroup
			label="Publishing"
			disabled
			items={[{ children: 'Draft' }, { children: 'Publish', focusableWhenDisabled: true }]}
		/>
	{:else}
		<ButtonGroup label="History">
			<Button>Undo</Button>
			<Button variant="outline">Redo</Button>
		</ButtonGroup>
	{/if}
</Theme>
