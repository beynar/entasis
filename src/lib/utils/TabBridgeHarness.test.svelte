<script lang="ts">
	// Harness for `useTabBridge.browser.test.ts`: a popover portaled to the end of <body>, with
	// controls around its trigger, and the same inside a modal dialog.
	import Theme from '../components/Theme/Theme.svelte';
	import Dialog from '../components/Dialog/Dialog.svelte';
	import Popover from '../components/Popover/Popover.svelte';
	import DateInput from '../components/Form/DateInput/DateInput.svelte';

	let {
		scenario
	}: {
		scenario:
			| 'basic'
			| 'last'
			| 'listbox'
			| 'in-dialog'
			| 'dialog-last'
			| 'nested'
			| 'empty'
			| 'date-input';
	} = $props();
	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<button type="button">Before</button>
	{#if scenario === 'basic'}
		<Popover transition={zero} trigger={{ content: 'Open popover' }}>
			<button type="button">First</button>
			<button type="button">Second</button>
		</Popover>
		<button type="button">After</button>
	{:else if scenario === 'last'}
		<Popover transition={zero} trigger={{ content: 'Open popover' }}>
			<button type="button">First</button>
			<button type="button">Second</button>
		</Popover>
	{:else if scenario === 'empty'}
		<Popover transition={zero} trigger={{ content: 'Open popover' }}>
			<p>Nothing to tab to</p>
		</Popover>
		<button type="button">After</button>
	{:else if scenario === 'listbox'}
		<Popover transition={zero} haspopup="listbox" trigger={{ content: 'Open list' }}>
			<div role="listbox" aria-label="Options">
				<button type="button" role="option" aria-selected="false">Option</button>
			</div>
		</Popover>
		<button type="button">After</button>
	{:else if scenario === 'nested'}
		<Popover transition={zero} trigger={{ content: 'Open outer' }}>
			<button type="button">Outer first</button>
			<Popover transition={zero} trigger={{ content: 'Open inner' }}>
				<button type="button">Inner first</button>
			</Popover>
			<button type="button">Outer last</button>
		</Popover>
		<button type="button">After</button>
	{:else if scenario === 'date-input'}
		<DateInput />
		<button type="button">After</button>
	{:else if scenario === 'dialog-last'}
		<Dialog defaultOpen responsive={false} transition={zero} title="Settings">
			<button type="button">Dialog first</button>
			<Popover transition={zero} trigger={{ content: 'Open popover' }}>
				<button type="button">First</button>
				<button type="button">Second</button>
			</Popover>
		</Dialog>
	{:else}
		<Dialog defaultOpen responsive={false} transition={zero} title="Settings">
			<button type="button">Dialog first</button>
			<Popover transition={zero} trigger={{ content: 'Open popover' }}>
				<button type="button">First</button>
				<button type="button">Second</button>
			</Popover>
			<button type="button">Dialog last</button>
		</Dialog>
	{/if}
</Theme>
