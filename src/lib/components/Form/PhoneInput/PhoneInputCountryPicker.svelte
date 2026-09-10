<script lang="ts">
	import { on } from 'svelte/events';
	import { setContext } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import Button from '../../Button/Button.svelte';
	import { checkIcon } from '../../Icons/check.js';
	import ScrollArea from '../../ScrollArea/ScrollArea.svelte';
	import TextInput from '../TextInput/TextInput.svelte';
	import type { Sizes } from '$lib/types/theme.js';
	import { useListNavigation } from '$lib/utils/useListNavigation.svelte.js';
	import type { PhoneInputThemeProps } from './phoneInput.theme.js';
	import { usePhoneInputTheme } from './phoneInput.theme.js';
	import { filterPhoneCountryOptions, type PhoneCountryOption } from './phoneInputCountry.js';

	type PhoneInputCountryPickerProps = {
		id?: string;
		countries: PhoneCountryOption[];
		selectedCountry: PhoneCountryOption | null;
		searchPlaceholder: string;
		size?: Sizes;
		theme?: PhoneInputThemeProps;
		onSelectCountry: (country: PhoneCountryOption) => void;
	};

	setContext('form', null);

	const generatedId = $props.id();

	let {
		id: customId,
		countries,
		selectedCountry,
		searchPlaceholder,
		size,
		theme,
		onSelectCountry
	}: PhoneInputCountryPickerProps = $props();

	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement | null>(null);

	const id = $derived(customId ?? generatedId);
	const listboxId = $derived(`${id}-listbox`);
	const classes = $derived(usePhoneInputTheme(theme));
	const filteredCountries = $derived(filterPhoneCountryOptions(countries, searchQuery));
	const optionId = (iso2: string) => `${id}-option-${iso2}`;

	const selectCountry = (iso2: string) => {
		const country = filteredCountries.find((country) => country.iso2 === iso2);
		if (country) onSelectCountry(country);
	};

	const nav = useListNavigation({
		values: () => filteredCountries.map((country) => country.iso2),
		optionId,
		onSelect: selectCountry
	});

	const highlightSelectedCountry = () => {
		const selectedIso2 = selectedCountry?.iso2;
		if (selectedIso2 && filteredCountries.some((country) => country.iso2 === selectedIso2)) {
			nav.highlight(selectedIso2);
			return;
		}

		nav.first();
	};

	const attachSearchInput: Attachment<HTMLElement> = (node) => {
		const input = node.querySelector<HTMLInputElement>('input');
		if (!input) return;

		searchInput = input;
		input.setAttribute('role', 'combobox');
		input.setAttribute('aria-autocomplete', 'list');
		input.setAttribute('aria-expanded', 'true');
		input.setAttribute('aria-haspopup', 'listbox');
		input.setAttribute('autocomplete', 'off');
		input.setAttribute('autocorrect', 'off');
		input.setAttribute('autocapitalize', 'off');
		input.setAttribute('spellcheck', 'false');

		const focusTimeout = setTimeout(() => {
			input.focus();
			highlightSelectedCountry();
		}, 0);
		const removeKeydown = on(input, 'keydown', nav.onKeydown);

		return () => {
			clearTimeout(focusTimeout);
			removeKeydown();
			input.removeAttribute('role');
			input.removeAttribute('aria-autocomplete');
			input.removeAttribute('aria-expanded');
			input.removeAttribute('aria-haspopup');
			input.removeAttribute('aria-controls');
			input.removeAttribute('aria-activedescendant');
			input.removeAttribute('autocomplete');
			input.removeAttribute('autocorrect');
			input.removeAttribute('autocapitalize');
			input.removeAttribute('spellcheck');
			if (searchInput === input) searchInput = null;
		};
	};

	$effect(() => {
		if (!searchInput) return;

		searchInput.setAttribute('aria-controls', listboxId);
		if (nav.activeDescendant) {
			searchInput.setAttribute('aria-activedescendant', nav.activeDescendant);
		} else {
			searchInput.removeAttribute('aria-activedescendant');
		}
	});
</script>

<div {id} class={classes.countryPicker({ class: theme?.countryPicker?.base })}>
	<TextInput
		{@attach attachSearchInput}
		bind:value={searchQuery}
		placeholder={searchPlaceholder}
		{size}
		class={classes.countrySearch({ class: theme?.countrySearch?.base })}
		theme={{
			inputContainer: {
				base: classes.countrySearchInputContainer({
					class: theme?.countrySearchInputContainer?.base,
					size
				})
			},
			input: {
				base: classes.countrySearchInput({
					class: theme?.countrySearchInput?.base,
					size
				})
			}
		}}
	/>

	<ScrollArea
		scrollOnEdges
		type="auto"
		class={classes.countryList({ class: theme?.countryList?.base })}
	>
		<div id={listboxId} role="listbox" aria-label="Countries" class={classes.countryListbox()}>
			{#each filteredCountries as country (country.iso2)}
				{@const selected = country.iso2 === selectedCountry?.iso2}
				{@const highlighted = nav.highlighted === country.iso2}
				<Button
					id={optionId(country.iso2)}
					type="button"
					variant="ghost"
					color="neutral"
					{size}
					fullWidth
					role="option"
					aria-selected={selected}
					data-highlighted={highlighted ? 'true' : undefined}
					tabindex={-1}
					class={classes.countryOption({
						size,
						selected,
						highlighted,
						class: theme?.countryOption?.base
					})}
					onpointermove={() => nav.setHighlighted(country.iso2)}
					onclick={() => onSelectCountry(country)}
				>
					<span class={classes.countryFlag({ size, class: theme?.countryFlag?.base })}>
						{country.flag}
					</span>
					<span class={classes.countryName({ size, class: theme?.countryName?.base })}>
						{country.name}
					</span>
					<span
						class={classes.countryOptionDialCode({
							size,
							class: theme?.countryOptionDialCode?.base
						})}
					>
						+{country.dialCode}
					</span>
					{#if selected}
						{@render checkIcon({
							class: classes.countryCheck({ class: theme?.countryCheck?.base })
						})}
					{/if}
				</Button>
			{:else}
				<div class={classes.countryEmpty({ size, class: theme?.countryEmpty?.base })}>
					No countries found
				</div>
			{/each}
		</div>
	</ScrollArea>
</div>
