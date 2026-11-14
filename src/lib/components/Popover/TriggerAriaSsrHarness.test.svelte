<script lang="ts">
	// Harness for the trigger SSR tests of Popover, Dialog and Menu: a built-in trigger and a
	// snippet trigger spreading `triggerAttributes`, rendered with `svelte/server`.
	import Theme from '../Theme/Theme.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import Popover from './Popover.svelte';

	type Scenario =
		| 'popover-snippet'
		| 'popover-button'
		| 'dialog-snippet'
		| 'dialog-button'
		| 'menu-snippet'
		| 'menu-button';

	let { scenario }: { scenario: Scenario } = $props();
	const items = [{ type: 'button' as const, label: 'Rename' }];
</script>

<Theme>
	{#if scenario === 'popover-snippet'}
		<Popover>
			{#snippet trigger(popover)}
				<button type="button" {...popover.triggerAttributes} {@attach popover.trigger}
					>Filters</button
				>
			{/snippet}
			<p>Panel</p>
		</Popover>
	{:else if scenario === 'popover-button'}
		<Popover trigger={{ content: 'Filters' }}><p>Panel</p></Popover>
	{:else if scenario === 'dialog-snippet'}
		<Dialog title="Settings">
			{#snippet trigger(dialog)}
				<button type="button" {...dialog.triggerAttributes} {@attach dialog.trigger}
					>Settings</button
				>
			{/snippet}
			<p>Body</p>
		</Dialog>
	{:else if scenario === 'dialog-button'}
		<Dialog title="Settings" trigger={{ content: 'Settings' }}><p>Body</p></Dialog>
	{:else if scenario === 'menu-snippet'}
		<PopupMenu menu={{ items }}>
			{#snippet trigger(popover)}
				<button type="button" {...popover.triggerAttributes} {@attach popover.trigger}
					>Actions</button
				>
			{/snippet}
		</PopupMenu>
	{:else}
		<PopupMenu menu={{ items }} trigger={{ content: 'Actions' }} />
	{/if}
</Theme>
