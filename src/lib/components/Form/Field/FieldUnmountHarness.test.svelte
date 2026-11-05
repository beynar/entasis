<script lang="ts">
	// Test-only: a focused control that a block removes, as a panel closing or an {#if} changing does.
	import Theme from '../../Theme/Theme.svelte';
	import RichTextInput from '../../RichTextInput/RichTextInput.svelte';
	import Autocomplete from '../Autocomplete/Autocomplete.svelte';
	import ColorInput from '../ColorInput/ColorInput.svelte';
	import Combobox from '../Combobox/Combobox.svelte';
	import DateInput from '../DateInput/DateInput.svelte';
	import Form from '../Form/Form.svelte';
	import NumberInput from '../NumberInput/NumberInput.svelte';
	import PasswordInput from '../PasswordInput/Password.svelte';
	import Select from '../Select/Select.svelte';
	import TagsInput from '../TagsInput/TagsInput.svelte';
	import TextArea from '../TextArea/TextArea.svelte';
	import TextInput from '../TextInput/TextInput.svelte';
	import TimeInput from '../TimeInput/TimeInput.svelte';
	import VoiceInput from '../VoiceInput/VoiceInput.svelte';

	let { kind }: { kind: string } = $props();
	let show = $state(true);
	let focused = $state(false);
	let removing = $state(false);
	const items = [{ label: 'One', value: 'one' }];

	// Runs inside a reaction, where Svelte refuses state writes.
	const removeFocused = () => {
		document.activeElement?.remove();
		return false;
	};
</script>

<Theme>
	<button type="button" data-testid="hide" onclick={() => (show = false)}>Hide</button>
	<button type="button" data-testid="remove-in-reaction" onclick={() => (removing = true)}>
		Remove in a reaction
	</button>
	{#if removing && removeFocused()}
		<span></span>
	{/if}
	<output data-testid="focused">{focused}</output>
	<div data-testid="host">
		{#if show}
			{#if kind === 'text'}
				<TextInput label="Field" bind:focused />
			{:else if kind === 'number'}
				<NumberInput label="Field" bind:focused />
			{:else if kind === 'combobox'}
				<Combobox label="Field" {items} bind:focused />
			{:else if kind === 'autocomplete'}
				<Autocomplete label="Field" {items} bind:focused />
			{:else if kind === 'select'}
				<Select label="Field" {items} bind:focused />
			{:else if kind === 'textarea'}
				<TextArea label="Field" bind:focused />
			{:else if kind === 'password'}
				<PasswordInput label="Field" bind:focused />
			{:else if kind === 'date'}
				<DateInput label="Field" bind:focused />
			{:else if kind === 'time'}
				<TimeInput label="Field" bind:focused />
			{:else if kind === 'color'}
				<ColorInput label="Field" bind:focused />
			{:else if kind === 'tags'}
				<TagsInput label="Field" bind:focused />
			{:else if kind === 'voice'}
				<VoiceInput label="Field" bind:focused />
			{:else if kind === 'rich'}
				<RichTextInput label="Field" bind:focused />
			{:else if kind === 'form'}
				<Form inputs={{ title: { type: 'text', label: 'Field' } }} />
			{/if}
		{/if}
	</div>
</Theme>
