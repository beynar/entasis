<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Toaster from './Toaster.svelte';
	import type { ToasterProps } from './toast.state.svelte.js';

	let props: ToasterProps = $props();
</script>

<Theme>
	<Toaster {...props} />
</Theme>
