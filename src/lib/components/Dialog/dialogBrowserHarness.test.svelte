<script lang="ts">
	// Harness for `dialog.browser.test.ts`: a non-modal dialog over a clickable page, and a bottom
	// drawer with snap points.
	import Theme from '../Theme/Theme.svelte';
	import Dialog from './Dialog.svelte';

	let { scenario }: { scenario: 'non-modal' | 'snap' } = $props();
	let clicks = $state(0);
	let snap = $state<number | string | undefined>();
	const instant = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<button type="button" onclick={() => (clicks += 1)}>Page button {clicks}</button>
	{#if scenario === 'non-modal'}
		<Dialog
			modal={false}
			responsive={false}
			type="drawerRight"
			transition={instant}
			title="Inspector"
			trigger={{ content: 'Open inspector' }}
		>
			<button type="button">Inside button</button>
		</Dialog>
	{:else}
		<Dialog
			responsive={false}
			type="drawerBottom"
			transition={instant}
			title="Sheet"
			snapPoints={[0.4, 1]}
			defaultSnapPoint={0.4}
			bind:snapPoint={snap}
			trigger={{ content: 'Open sheet' }}
		>
			<p data-testid="sheet-body">Sheet body</p>
		</Dialog>
		<output data-testid="snap">{snap}</output>
	{/if}
</Theme>
