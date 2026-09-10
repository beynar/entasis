<script lang="ts">
	import Button from '../../Button/Button.svelte';
	import { caretDownIcon } from '../../Icons/caretDown.js';
	import type { Sizes } from '$lib/types/theme.js';
	import type { PhoneInputThemeProps } from './phoneInput.theme.js';
	import { usePhoneInputTheme } from './phoneInput.theme.js';
	import type { PhoneCountryOption } from './phoneInputCountry.js';

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
	const label = $derived(
		country ? `Change country, ${country.name} +${country.dialCode}` : 'Choose country'
	);
</script>

<Button
	type="button"
	variant="ghost"
	color="neutral"
	{size}
	{disabled}
	{label}
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-controls={open ? controls : undefined}
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
