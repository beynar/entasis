<script lang="ts">
	// A Combobox inside an open Dialog: Escape belongs to the open list first.
	import Theme from '../../Theme/Theme.svelte';
	import Dialog from '../../Dialog/Dialog.svelte';
	import Combobox from './Combobox.svelte';

	let open = $state(true);
</script>

<Theme>
	<Dialog bind:open title="Pick a fruit">
		<Combobox
			label="Fruit"
			items={[
				{ value: 'apple', label: 'Apple' },
				{ value: 'banana', label: 'Banana' }
			]}
		/>
	</Dialog>
	<output data-testid="dialog-open">{String(open)}</output>
</Theme>
