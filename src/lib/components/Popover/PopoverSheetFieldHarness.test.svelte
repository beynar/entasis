<script lang="ts">
	// Harness for `popover.session.browser.test.ts` (CX-10): a mobile-sheet Popover in a Field's
	// suffix. The sheet Dialog is built while the popover is closed, before its layer exists, and
	// must still count as inside the field once the popover opens. Tests mount it inside a Theme
	// (ThemeProviderHarness): the field reads the layer stack from context as it is created.
	import { untrack } from 'svelte';
	import Popover from './Popover.svelte';
	import { Field, createFieldState, type FieldState } from '../Form/Field/index.js';
	import type { FieldType } from '../Form/Field/field.js';

	let { onField }: { onField?: (field: FieldState<FieldType>) => void } = $props();

	let value = $state<unknown>(null);
	let errors = $state<string[] | boolean>([]);
	let focused = $state(false);
	const field = createFieldState<FieldType>({
		id: 'sheet-field',
		type: 'text',
		get value() {
			return value as never;
		},
		set value(next) {
			value = next;
		},
		get errors() {
			return errors;
		},
		set errors(next) {
			errors = next;
		},
		get focused() {
			return focused;
		},
		set focused(next) {
			focused = next;
		}
	});
	untrack(() => onField)?.(field);
</script>

<Field {field} label="Name" fieldAttrs={{ 'data-testid': 'field-root' }}>
	<input
		{...field.controlAttrs}
		{@attach field.control}
		value={(field.value as string | null) ?? ''}
		data-testid="control"
	/>
	{#snippet suffix()}
		<Popover trigger={{ content: 'Suggestions' }} mobileSheet>
			<button type="button">Inside sheet</button>
		</Popover>
	{/snippet}
</Field>
<button type="button">After</button>
