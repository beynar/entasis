<script lang="ts">
	// Harness for `popover.scrollLock.svelte.test.ts`: one popover with a zero-length transition.
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';

	let { lockScroll = true }: { lockScroll?: boolean } = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<Popover {lockScroll} transition={zero} trigger={{ content: 'Open popover' }}>
		<button type="button">Inside popover</button>
	</Popover>
</Theme>
