<script lang="ts">
	// Harness for `select.a11y.svelte.test.ts`: a Select inside <Theme> (overlay context) and a
	// native <form>, so tests can read the submitted FormData.
	import Theme from '../../Theme/Theme.svelte';
	import Select from './Select.svelte';
	import type { SelectProps } from './select.props.js';

	let props: SelectProps = $props();
</script>

<Theme>
	<form data-testid="form">
		<Select {...props} />
	</form>
</Theme>
