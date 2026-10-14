<script lang="ts">
	// PinInput inside the contexts the pin tests need: a locale, a native <form>, and an entasis
	// Form that has an earlier field.
	import { I18n } from '$lib/i18n/index.js';
	import type { LocaleCode } from '$lib/i18n/locales.js';
	import Theme from '../../Theme/Theme.svelte';
	import Form from '../Form/Form.svelte';
	import PinInput from './PinInput.svelte';
	import type { PinInputProps } from './pinInput.props.js';

	let {
		scenario = 'locale',
		locale = 'en',
		onSubmit,
		onNativeSubmit,
		...props
	}: PinInputProps & {
		scenario?: 'locale' | 'native-form' | 'form';
		locale?: LocaleCode;
		onSubmit?: (value: unknown) => void;
		onNativeSubmit?: () => void;
	} = $props();
</script>

<Theme>
	<I18n {locale} manageDocument={false}>
		{#if scenario === 'native-form'}
			<form
				data-testid="native-form"
				onsubmit={(event) => {
					event.preventDefault();
					onNativeSubmit?.();
				}}
			>
				<PinInput name="code" label="Code" {...props} />
				<button type="submit">Send</button>
			</form>
		{:else if scenario === 'form'}
			<Form
				inputs={{
					email: { type: 'email', label: 'Email', required: true },
					code: { type: 'pin', label: 'Code', length: 4, ...props }
				}}
				{onSubmit}
			/>
		{:else}
			<PinInput {...props} />
		{/if}
	</I18n>
</Theme>
