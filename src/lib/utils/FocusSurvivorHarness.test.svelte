<script lang="ts">
	// Harness for the nearest-survivor focus return in `useFocusScope.browser.test.ts`: rows whose
	// own "Actions" menu or "Remove" dialog deletes the row it belongs to.
	import Theme from '../components/Theme/Theme.svelte';
	import Dialog from '../components/Dialog/Dialog.svelte';
	import Popover from '../components/Popover/Popover.svelte';

	let { kind = 'popover' }: { kind?: 'popover' | 'dialog' } = $props();

	const motion = { in: { duration: 0 }, out: { duration: 0 } };
	let rows = $state([1, 2, 3]);
	const remove = (row: number) => {
		rows = rows.filter((candidate) => candidate !== row);
	};
</script>

<Theme>
	<button type="button">Far away</button>
	<ul>
		{#each rows as row (row)}
			<li>
				<span>Row {row}</span>
				{#if kind === 'popover'}
					<Popover transition={motion} focusOnOpen="first" trigger={{ content: `Actions ${row}` }}>
						<button type="button" onclick={() => remove(row)}>Delete {row}</button>
					</Popover>
				{:else}
					<Dialog
						responsive={false}
						transition={motion}
						title={`Remove row ${row}`}
						trigger={{ content: `Remove ${row}` }}
					>
						<button type="button" onclick={() => remove(row)}>Confirm {row}</button>
					</Dialog>
				{/if}
			</li>
		{/each}
	</ul>
</Theme>
