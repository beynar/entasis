<script lang="ts">
	// A Form whose footer actions submit, so tests can watch the actions while a submit runs.
	import Theme from '../../Theme/Theme.svelte';
	import Form from './Form.svelte';

	let {
		onSubmit,
		onAction
	}: {
		onSubmit: (value: { name?: string | null }) => Promise<void> | void;
		onAction?: () => void;
	} = $props();
</script>

<Theme>
	<Form
		inputs={{ name: { type: 'text', label: 'Name' } }}
		actions={[
			{ children: 'Archive', disabled: true },
			{
				children: 'Save',
				onAction: (form) => {
					onAction?.();
					return form.submit();
				}
			}
		]}
		{onSubmit}
	/>
</Theme>
