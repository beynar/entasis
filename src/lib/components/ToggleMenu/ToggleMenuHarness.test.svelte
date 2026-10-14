<script lang="ts">
	// A toolbar with toggles, a text field and a radio group, for the keyboard tests of ToggleMenu.
	import Theme from '../Theme/Theme.svelte';
	import ToggleMenu from './ToggleMenu.svelte';
	import type { ToggleMenuItem } from './toggleMenu.props.js';

	let { disabled = false, itemDisabled = false }: { disabled?: boolean; itemDisabled?: boolean } =
		$props();

	const initial = (): ToggleMenuItem[] => [
		{ type: 'toggle', label: 'Bold', children: 'Bold', value: false },
		{ type: 'toggle', label: 'Italic', children: 'Italic', value: false, disabled: itemDisabled },
		{
			type: 'custom',
			overflowItems: [],
			children: field
		},
		{
			type: 'radio-group',
			label: 'Align',
			value: 'left',
			items: [
				{ value: 'left', label: 'Left', children: 'Left' },
				{ value: 'right', label: 'Right', children: 'Right', disabled: itemDisabled }
			]
		}
	];
	let items = $state<ToggleMenuItem[]>(initial());
</script>

{#snippet field({
	reference
}: {
	reference?: import('svelte/attachments').Attachment<HTMLElement>;
})}
	<input aria-label="Font size" value="12" {@attach reference} />
{/snippet}

<Theme>
	<button type="button">Before</button>
	<ToggleMenu bind:items label="Format" {disabled} />
	<button type="button">After</button>
</Theme>
