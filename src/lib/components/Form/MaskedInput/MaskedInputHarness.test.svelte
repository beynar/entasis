<script lang="ts">
	// MaskedInput inside the contexts its browser tests need: a locale, a native <form>, an
	// entasis Form, and a parent that writes the value from outside.
	import { I18n } from '$lib/i18n/index.js';
	import { locales, type LocaleCode } from '$lib/i18n/locales.js';
	import Theme from '../../Theme/Theme.svelte';
	import Form from '../Form/Form.svelte';
	import MaskedInput from './MaskedInput.svelte';
	import type { MaskedInputProps } from './maskedInput.props.js';

	let {
		scenario = 'plain',
		locale = 'en',
		externalValue = null,
		onSubmit,
		value = $bindable(),
		...props
	}: Partial<MaskedInputProps> & {
		scenario?: 'plain' | 'native-form' | 'form' | 'controlled';
		locale?: LocaleCode;
		/** The value the "Set value" button writes in the controlled scenario. */
		externalValue?: string | null;
		onSubmit?: (value: unknown) => void;
	} = $props();
</script>

<Theme>
	<I18n {locale} catalogs={{ [locale]: locales[locale].messages }} manageDocument={false}>
		{#if scenario === 'native-form'}
			<form data-testid="form" onsubmit={(event) => event.preventDefault()}>
				<MaskedInput name="plate" label="Plate" mask="AA-###-AA" {...props} bind:value />
				<button type="submit">Send</button>
			</form>
		{:else if scenario === 'form'}
			<Form
				inputs={{
					plate: { type: 'masked', label: 'Plate', mask: 'AA-###-AA', ...props }
				}}
				{onSubmit}
			/>
		{:else if scenario === 'controlled'}
			<MaskedInput label="Plate" mask="AA-###-AA" {...props} bind:value />
			<button type="button" onclick={() => (value = externalValue)}>Set value</button>
			<output data-testid="value">{JSON.stringify(value ?? null)}</output>
		{:else}
			<MaskedInput label="Plate" mask="AA-###-AA" {...props} bind:value />
			<output data-testid="value">{JSON.stringify(value ?? null)}</output>
		{/if}
	</I18n>
</Theme>
