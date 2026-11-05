<script lang="ts">
	// Mounts a Form and the <Ask /> host under a Theme whose `webmcp` the test chooses.
	import Theme from '../../Theme/Theme.svelte';
	import Ask from '../Ask/Ask.svelte';
	import Form from './Form.svelte';
	import type { FormProps } from './form.props.js';
	import type { FormInputs } from './form.js';
	import type { FormState } from './form.state.svelte.js';

	let {
		webmcp,
		onForm,
		...props
	}: {
		webmcp?: boolean;
		onForm?: (form: FormState<FormInputs>) => void;
	} & Partial<FormProps<FormInputs>> = $props();

	let form = $state<FormState<FormInputs>>();
	$effect(() => {
		if (form) onForm?.(form);
	});
</script>

<Theme {webmcp}>
	<Ask />
	<Form inputs={{}} {...props} bind:form />
</Theme>
