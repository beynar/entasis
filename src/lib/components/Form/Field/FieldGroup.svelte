<script lang="ts">
	// Renderless provider: every field rendered inside shares the group's disabled and read-only
	// state (combined with any group around it). Form uses it for FormGroup fieldsets.
	import type { Snippet } from 'svelte';
	import { provideFieldGroup } from './field.state.svelte.js';

	let {
		disabled = false,
		readOnly = false,
		children
	}: {
		/** Disables every field inside the group. */
		disabled?: boolean;
		/** Makes every field inside the group read-only. */
		readOnly?: boolean;
		children: Snippet;
	} = $props();

	provideFieldGroup({
		get disabled() {
			return disabled;
		},
		get readOnly() {
			return readOnly;
		}
	});
</script>

{@render children()}
