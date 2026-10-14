<script lang="ts">
	// Harness for `popover.position.browser.test.ts`: a Combobox fixed `top` px down the page, with
	// more options than fit, so its list has to shrink to the room left beside the input.
	import Combobox from '../Form/Combobox/Combobox.svelte';
	import Theme from '../Theme/Theme.svelte';

	let { top }: { top: number } = $props();
	const items = Array.from({ length: 30 }, (_, index) => ({
		value: `option-${index + 1}`,
		label: `Option ${index + 1}`
	}));
</script>

<Theme>
	<div style:position="fixed" style:top="{top}px" style:left="40px" style:width="240px">
		<Combobox {items} showAllOnFocus placeholder="Pick an option" />
	</div>
</Theme>
