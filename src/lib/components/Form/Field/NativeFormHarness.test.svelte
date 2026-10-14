<script lang="ts">
	// Built-in controls inside a plain <form>, as in a SvelteKit form action, plus controls that
	// join it from outside through the `form` attribute.
	import Theme from '../../Theme/Theme.svelte';
	import Checkbox from '../Checkbox/Checkbox.svelte';
	import Combobox from '../Combobox/Combobox.svelte';
	import FileInput from '../File/FileInput.svelte';
	import TagsInput from '../TagsInput/TagsInput.svelte';
	import CheckboxesInput from '../CheckboxesInput/CheckboxesInput.svelte';
	import Form from '../Form/Form.svelte';
	import type { LiveFormValue } from '../Form/form.js';
	import RadioInput from '../RadioInput/RadioInput.svelte';
	import Select from '../Select/Select.svelte';
	import Switch from '../Switch/Switch.svelte';
	import TextInput from '../TextInput/TextInput.svelte';
	import HiddenInputsControl from './HiddenInputsControl.test.svelte';

	const formInputs = {
		nickname: { type: 'text', label: 'Nickname' },
		digest: { type: 'switch', label: 'Weekly digest' }
	} as const;

	let {
		scenario = 'controls',
		switchDefault = null,
		switchRequired = false,
		formValue = $bindable(),
		onSubmit,
		onNameChange,
		onSwitchChange,
		onFormValueChange
	}: {
		scenario?: 'controls' | 'outside' | 'entasis-form' | 'drafts' | 'buttons';
		switchDefault?: boolean | null;
		switchRequired?: boolean;
		formValue?: LiveFormValue<typeof formInputs>;
		onSubmit?: (data: FormData) => void;
		onNameChange?: (value: string | null) => void;
		onSwitchChange?: (value: boolean | null) => void;
		onFormValueChange?: (value: LiveFormValue<typeof formInputs>) => void;
	} = $props();

	const submit = (event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
		event.preventDefault();
		onSubmit?.(new FormData(event.currentTarget));
	};
</script>

<Theme>
	{#if scenario === 'controls'}
		<form data-testid="form" onsubmit={submit}>
			<TextInput name="name" label="Name" defaultValue="Ada" onValueChange={onNameChange} />
			<Switch
				name="alerts"
				label="Alerts"
				defaultValue={switchDefault}
				required={switchRequired}
				onValueChange={onSwitchChange}
			/>
			<Checkbox name="terms" label="Terms" />
			<CheckboxesInput
				name="colors"
				label="Colors"
				defaultValue={['red']}
				items={[
					{ value: 'red', label: 'Red' },
					{ value: 'green', label: 'Green' }
				]}
			/>
			<RadioInput
				name="size"
				label="Size"
				defaultValue="s"
				items={[
					{ value: 's', label: 'Small' },
					{ value: 'm', label: 'Medium' }
				]}
			/>
			<Select
				name="plan"
				label="Plan"
				defaultValue="free"
				items={[
					{ value: 'free', label: 'Free' },
					{ value: 'pro', label: 'Pro' }
				]}
			/>
			<HiddenInputsControl name="tags" label="Tags" mode="values" value={['red']} />
			<button type="submit">Save</button>
			<button type="reset">Reset</button>
		</form>
		<form data-testid="other-form">
			<button type="reset">Reset other</button>
		</form>
	{:else if scenario === 'outside'}
		<form id="profile" data-testid="form" onsubmit={submit}>
			<button type="submit">Save</button>
		</form>
		<form data-testid="other-form">
			<TextInput form="profile" name="name" label="Name" defaultValue="Ada" />
			<Switch form="profile" name="alerts" label="Alerts" />
			<HiddenInputsControl form="profile" name="tags" label="Tags" mode="values" value={['red']} />
			<button type="reset">Reset other</button>
		</form>
	{:else if scenario === 'drafts'}
		<form data-testid="form" onsubmit={submit}>
			<Combobox
				name="city"
				label="City"
				defaultValue="paris"
				items={[
					{ value: 'paris', label: 'Paris' },
					{ value: 'rome', label: 'Rome' }
				]}
			/>
			<TagsInput
				name="topics"
				label="Topics"
				defaultValue={['svelte']}
				items={[
					{ value: 'svelte', label: 'Svelte' },
					{ value: 'css', label: 'CSS' }
				]}
			/>
			<button type="reset">Reset</button>
		</form>
	{:else if scenario === 'buttons'}
		<form id="ext" data-testid="form" onsubmit={submit}></form>
		<form data-testid="other-form">
			<FileInput
				form="ext"
				name="files"
				label="Files"
				mode="multiple"
				defaultValue={[new File(['a'], 'a.txt', { type: 'text/plain' })]}
			/>
		</form>
	{:else}
		<form data-testid="form" onsubmit={submit}>
			<Form inputs={formInputs} bind:value={formValue} onValueChange={onFormValueChange} />
			<button type="reset">Reset</button>
		</form>
	{/if}
</Theme>
