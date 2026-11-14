<script lang="ts">
	// Harness for `popover.modality.browser.test.ts`: a combobox-like popup whose focus stays in
	// the input that anchors it, so its options are only ever under virtual focus.
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';

	let open = $state(false);
	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<Popover bind:open haspopup="listbox" position="bottom-start" transition={zero}>
		{#snippet trigger(popover)}
			<input
				aria-label="Fruit"
				role="combobox"
				onkeydown={(event) => {
					if (event.key === 'ArrowDown') open = true;
				}}
				{@attach popover.reference}
			/>
		{/snippet}
		<ul role="listbox" aria-label="Fruits">
			<li role="option" aria-selected="false" data-highlighted="true">Apple</li>
			<li role="option" aria-selected="false">Pear</li>
		</ul>
	</Popover>
</Theme>
