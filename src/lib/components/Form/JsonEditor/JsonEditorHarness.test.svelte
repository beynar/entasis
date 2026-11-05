<script lang="ts">
	// Harness for the JsonEditor tests: reports every value it hears about.
	import Theme from '../../Theme/Theme.svelte';
	import JsonEditor from './JsonEditor.svelte';
	import type { JsonEditorProps } from './jsonEditor.props.js';
	import type { JsonValue } from './jsonEditor.schema.js';

	let {
		value = $bindable(),
		api = $bindable(),
		onChange,
		...props
	}: JsonEditorProps & { onChange?: (value: JsonValue | null) => void } = $props();
</script>

<Theme>
	<JsonEditor
		bind:value
		bind:api
		onValueChange={(next) => onChange?.($state.snapshot(next as unknown) as JsonValue | null)}
		{...props}
	/>
</Theme>
