<script lang="ts">
	import Popover from '../../Popover/Popover.svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import {
		loadIntlTelInputFromCdn,
		type IntlTelInputInstance,
		type IntlTelInputLibrary
	} from './phoneInput-cdn.js';
	import PhoneInputCountryPicker from './PhoneInputCountryPicker.svelte';
	import PhoneInputCountryTrigger from './PhoneInputCountryTrigger.svelte';
	import type { PhoneInputProps } from './phoneInput.props.js';
	import { usePhoneInputTheme } from './phoneInput.theme.js';
	import {
		createPhoneCountryOptions,
		getPhoneCountryOption,
		type PhoneCountryOption
	} from './phoneInputCountry.js';
	import { untrack } from 'svelte';
	import { on } from 'svelte/events';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		country = $bindable('fr'),
		iti = $bindable<IntlTelInputInstance | undefined>(),
		required = false,
		strict = true,
		searchPlaceholder,
		placeholder,
		theme,
		disabled,
		name,
		onValidate,
		onValueChange,
		visible,
		...rest
	}: PhoneInputProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	const t = $derived(useI18n());
	const resolvedPlaceholder = $derived(placeholder ?? t.phoneNumber);
	const resolvedSearchPlaceholder = $derived(searchPlaceholder ?? t.search);
	const countryPickerId = `${id}-country-picker`;
	let countryPickerOpen = $state(false);
	let phoneInputNode = $state<HTMLInputElement | null>(null);
	let library = $state<IntlTelInputLibrary | null>(null);
	let attachmentId = 0;
	const countryOptions = $derived(
		library ? createPhoneCountryOptions(library.getAllCountries()) : []
	);

	const getValue = () => {
		if (!iti || !library?.utils) {
			return (phoneInputNode?.value ?? '').replaceAll(' ', '');
		}

		const phoneValue = iti?.getNumber() || '';
		return phoneValue.replaceAll(' ', '');
	};

	const selectedCountry = $derived(
		getPhoneCountryOption(countryOptions, country) ?? getPhoneCountryOption(countryOptions, 'fr')
	);

	const field = createFieldState({
		id,
		get value() {
			return value;
		},
		set value(v) {
			value = v;
		},
		get errors() {
			return errors;
		},
		set errors(v: string[] | boolean) {
			errors = v;
		},
		get focused() {
			return focused;
		},
		set focused(v: boolean) {
			focused = v;
		},
		onValueChange: (v) => {
			onValueChange?.(v);
		},
		get disabled() {
			return disabled;
		},
		set disabled(v: boolean | undefined) {
			disabled = v;
		},
		get required() {
			return required;
		},
		get name() {
			return name;
		},
		set name(v: string | undefined) {
			name = v;
		},
		onValidate: (value) => {
			const customErrors = onValidate?.(value);
			if (!iti || !library?.utils) return customErrors;
			const isValid = Boolean(country && iti.isValidNumber());
			return customErrors || (isValid ? [] : [t.invalidPhoneNumber]);
		},
		get visible() {
			return visible;
		},
		type: 'phone'
	});

	const classes = $derived(usePhoneInputTheme(theme));

	const syncSelectedCountry = () => {
		const selectedIso2 = iti?.getSelectedCountry()?.iso2;

		if (selectedIso2) {
			country = selectedIso2;
		}

		field.value = getValue();
	};

	const selectCountry = (selectedCountry: PhoneCountryOption) => {
		country = selectedCountry.iso2;
		iti?.setSelectedCountry(selectedCountry.iso2);
		field.value = getValue();
		countryPickerOpen = false;
		field.node?.focus();
	};

	const focusInputOnFieldClick = (node: HTMLElement) =>
		on(node, 'click', (event) => {
			const target = event.target;
			if (target instanceof Element && target.closest('button')) return;
			node.querySelector('input')?.focus();
		});

	const usePhoneInput = (node: HTMLInputElement) => {
		return untrack(() => {
			const currentAttachmentId = ++attachmentId;
			phoneInputNode = node;

			if (value) {
				node.value = value;
			}

			let instance: IntlTelInputInstance | undefined;
			let offCountryChange: (() => void) | undefined;

			void loadIntlTelInputFromCdn()
				.then((intlTelInput) => {
					if (currentAttachmentId !== attachmentId || phoneInputNode !== node) {
						return;
					}

					library = intlTelInput;
					const countries = createPhoneCountryOptions(intlTelInput.getAllCountries());
					const initialCountry =
						getPhoneCountryOption(countries, country) ?? getPhoneCountryOption(countries, 'fr');
					instance = intlTelInput(node, {
						strictMode: strict,
						initialCountry: initialCountry?.iso2 ?? '',
						allowPhonewords: false,
						formatAsYouType: true,
						separateDialCode: false,
						showFlags: false,
						countrySelectorMode: 'OFF',
						containerClass: 'min-w-0 w-full flex-1'
					});
					iti = instance;

					syncSelectedCountry();
					void instance.promise.then(() => {
						if (iti === instance) {
							field.value = getValue();
						}
					});

					offCountryChange = on(node, 'countrychange', syncSelectedCountry);
				})
				.catch((error: unknown) => {
					if (currentAttachmentId !== attachmentId) {
						return;
					}
					console.error(error);
				});

			return () => {
				if (currentAttachmentId !== attachmentId) {
					return;
				}

				attachmentId += 1;
				offCountryChange?.();
				instance?.destroy();
				if (phoneInputNode === node) {
					phoneInputNode = null;
				}
				if (iti === instance) {
					iti = undefined;
				}
			};
		});
	};

	$effect(() => {
		const nextCountry = getPhoneCountryOption(countryOptions, country);
		const activeCountry = iti?.getSelectedCountry()?.iso2;

		if (iti && nextCountry && activeCountry !== nextCountry.iso2) {
			iti.setSelectedCountry(nextCountry.iso2);
		}
	});
</script>

<Popover
	id={`${id}-country-popover`}
	bind:open={countryPickerOpen}
	position="bottom-start"
	size="normal"
	class={classes.popover({ class: theme?.popover?.base })}
>
	<PhoneInputCountryPicker
		id={countryPickerId}
		countries={countryOptions}
		{selectedCountry}
		searchPlaceholder={resolvedSearchPlaceholder}
		size={rest.size}
		{theme}
		onSelectCountry={selectCountry}
	/>
	{#snippet trigger(popover)}
		<Field
			{field}
			size={rest.size}
			theme={{
				...(theme || {}),
				inputContainer: {
					...(theme?.inputContainer || {}),
					base: classes.inputContainer({
						class: theme?.inputContainer?.base,
						disabled: field.disabled,
						size: rest.size
					})
				}
			}}
			{...rest}
			{@attach popover.reference}
			{@attach focusInputOnFieldClick}
		>
			<PhoneInputCountryTrigger
				country={selectedCountry}
				open={countryPickerOpen}
				disabled={field.disabled}
				controls={countryPickerId}
				size={rest.size}
				{theme}
				onToggle={popover.toggle}
			/>
			<input
				data-1p-ignore
				{@attach usePhoneInput}
				oninput={() => {
					field.value = getValue();
				}}
				type="tel"
				{id}
				name={field.name}
				bind:this={field.node}
				placeholder={resolvedPlaceholder}
				class={classes.input({ disabled: field.disabled, size: rest.size })}
				disabled={field.disabled}
			/>
		</Field>
	{/snippet}
</Popover>
