<script lang="ts">
	import Button from '../../Button/Button.svelte';
	import { caretDownIcon } from '../../Icons/caretDown.js';
	import type { Sizes } from '$lib/types/theme.js';
	import type { PhoneInputThemeProps } from './phoneInput.theme.js';
	import { usePhoneInputTheme } from './phoneInput.theme.js';
	import type { PhoneCountryOption } from './phoneInputCountry.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type PhoneInputCountryTriggerProps = {
		country: PhoneCountryOption | null;
		open: boolean;
		disabled?: boolean;
		controls: string;
		size?: Sizes;
		theme?: PhoneInputThemeProps;
		onToggle: () => void;
	};

	let { country, open, disabled, controls, size, theme, onToggle }: PhoneInputCountryTriggerProps =
		$props();

	const classes = $derived(usePhoneInputTheme(theme));
	const t = $derived(useI18n());
	const label = $derived(
		country ? t.changeCountry(country.name, country.dialCode) : `${t.choose} ${t.country}`
	);
</script>

<Button
	type="button"
	variant="ghost"
	color="neutral"
	{size}
	{disabled}
	{label}
	haspopup="dialog"
	expanded={open}
	controls={open ? controls : undefined}
	class={classes.countryTrigger({
		size,
		open,
		class: theme?.countryTrigger?.base
	})}
	onclick={onToggle}
>
	<span class={classes.countryFlag({ size, class: theme?.countryFlag?.base })}>
		{country?.flag ?? '--'}
	</span>
	<span class={classes.countryDialCode({ size, class: theme?.countryDialCode?.base })}>
		{country ? `+${country.dialCode}` : ''}
	</span>
	{@render caretDownIcon({
		class: classes.countryChevron({
			open,
			class: theme?.countryChevron?.base
		})
	})}
</Button>
