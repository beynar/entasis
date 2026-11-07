<script lang="ts">
	// An Overlay holding a real Spinner, whose animation never ends.
	import Spinner from '../Spinner/Spinner.svelte';
	import Theme from '../Theme/Theme.svelte';
	import Overlay from './Overlay.svelte';

	let {
		open = false,
		onAfterOpen,
		onAfterClose
	}: { open?: boolean; onAfterOpen?: () => void; onAfterClose?: () => void } = $props();
</script>

<Theme>
	<div style="position: relative; width: 200px; height: 100px;">
		<Overlay {open} {onAfterOpen} {onAfterClose}>
			<Spinner />
		</Overlay>
	</div>
</Theme>
