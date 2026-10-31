<script lang="ts">
	import { onDestroy, setContext, untrack } from 'svelte';
	import Button from '../../Button/Button.svelte';
	import { builtInAddressProvider, getAddressProvider } from '../../Address/address.provider.js';
	import {
		COUNTRY_CODES,
		countryName,
		formatAddressLine,
		type Address,
		type AddressField
	} from '../../Address/address.js';
	import Autocomplete from '../Autocomplete/Autocomplete.svelte';
	import type { AutocompleteItemsRequest } from '../Autocomplete/autocomplete.props.js';
	import Combobox from '../Combobox/Combobox.svelte';
	import Field from '../Field/Field.svelte';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import TextInput from '../TextInput/TextInput.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type {
		AddressFieldConfig,
		AddressFieldRow,
		AddressInputProps
	} from './addressInput.props.js';
	import { useAddressInputTheme } from './addressInput.theme.js';

	const DEFAULT_FIELDS: readonly AddressFieldRow[] = [
		'line1',
		'line2',
		[
			{ field: 'postalCode', width: 1 },
			{ field: 'city', width: 2 }
		],
		'country'
	];

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		disabled,
		readOnly,
		messages,
		name,
		onValidate,
		onValueChange,
		visible,
		size = 'normal',
		density = 'normal',
		labelPosition,
		provider: providerProp,
		fields = DEFAULT_FIELDS,
		editableFields,
		requiredFields,
		countries,
		defaultCountry,
		layout = 'fields',
		minSearchLength = 3,
		placeholder,
		onResolve,
		i18n,
		label,
		theme,
		fieldAttrs,
		...rest
	}: AddressInputProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	const t = $derived(useI18n(i18n));
	const classes = $derived(useAddressInputTheme(theme));

	const text = (part: string | null | undefined) => (part ?? '').trim();

	// The layout: rows of parts, each with its settings.
	type Part = AddressFieldConfig & { width: number };
	const rows = $derived.by(() => {
		const seen: AddressField[] = [];
		return fields.map((row) =>
			(Array.isArray(row) ? row : [row]).map((item: AddressField | AddressFieldConfig): Part => {
				const part = typeof item === 'string' ? { field: item, width: 1 } : { width: 1, ...item };
				if (seen.includes(part.field)) {
					throw new TypeError(
						`AddressInput fields list the "${part.field}" part twice. Each part appears once.`
					);
				}
				seen.push(part.field);
				return part;
			})
		);
	});
	const parts = $derived(rows.flat());
	const shownParts = $derived(parts.map((part) => part.field));
	const shown = $derived(new Set(shownParts));
	const editable = $derived(new Set(editableFields ?? shownParts));
	const requiredParts = $derived(
		(
			requiredFields ??
			(required ? shownParts.filter((part) => part !== 'line2' && part !== 'region') : [])
		).filter((part) => shown.has(part))
	);

	/** Whether `address` holds anything a person entered (a defaulted country alone does not count). */
	const hasContent = (address: Address | null | undefined) =>
		!!address &&
		shownParts.some((part) => {
			if (part !== 'country') return text(address[part]) !== '';
			const code = text(address.countryCode).toUpperCase();
			if (code) return code !== defaultCountry?.toUpperCase();
			return text(address.country) !== '';
		});

	const partLabel = (part: AddressField) =>
		parts.find((entry) => entry.field === part)?.label ??
		{
			line1: t.addressLine1,
			line2: t.addressLine2,
			postalCode: t.addressPostalCode,
			city: t.addressCity,
			region: t.addressRegion,
			country: t.addressCountry
		}[part];

	const missingParts = (address: Address | null | undefined) =>
		hasContent(address) ? requiredParts.filter((part) => text(address?.[part]) === '') : [];

	const field = createFieldState({
		id,
		get value() {
			return value;
		},
		set value(nextValue) {
			value = nextValue;
		},
		get errors() {
			return errors;
		},
		set errors(nextErrors: string[] | boolean) {
			errors = nextErrors;
		},
		get focused() {
			return focused;
		},
		set focused(nextFocused: boolean) {
			focused = nextFocused;
		},
		onValueChange: (nextValue) => onValueChange?.(nextValue),
		get disabled() {
			return disabled;
		},
		set disabled(nextDisabled: boolean | undefined) {
			disabled = nextDisabled;
		},
		get readOnly() {
			return readOnly;
		},
		get messages() {
			return messages;
		},
		get required() {
			return required;
		},
		get name() {
			return name;
		},
		set name(nextName: string | undefined) {
			name = nextName;
		},
		// The parts a started address still misses come first, then the app's own rule.
		onValidate: (address) => {
			const missing = missingParts(address).map((part) => t.addressPartRequired(partLabel(part)));
			if (missing.length) return missing;
			return onValidate?.(address) ?? false;
		},
		get visible() {
			return visible;
		},
		type: 'address'
	});

	// The search: this field's own `provider`, else the one set for the app, else Google Places
	// through the app's `/api/places` route. `null` at either level turns it off.
	const contextProvider = getAddressProvider();
	const provider = $derived(
		providerProp !== undefined
			? providerProp
			: contextProvider
				? contextProvider.provider
				: builtInAddressProvider()
	);

	// The parts are inputs of their own, but only this field belongs to a surrounding Form: they
	// edit its value, they are not entries of the Form.
	setContext('form', null);

	const address = $derived<Address>(field.value ?? {});
	const countryCode = $derived(
		text(address.countryCode).toUpperCase() || defaultCountry?.toUpperCase() || ''
	);

	const commit = (next: Address) => field.setValue(hasContent(next) ? next : null);

	/** A manual edit: the provider's id, coordinates and one-line address no longer describe it. */
	const edit = (part: AddressField, input: string | null) => {
		const next: Address = {
			...address,
			[part]: input?.trim() ? input : null,
			formatted: null,
			placeId: null,
			location: null
		};
		if (part === 'line1') {
			next.streetNumber = null;
			next.street = null;
		}
		if (!next.countryCode && defaultCountry) {
			next.countryCode = defaultCountry.toUpperCase();
			next.country = countryName(next.countryCode, t.locale);
		}
		commit(next);
	};

	const editCountry = (code: string | null) => {
		commit({
			...address,
			countryCode: code,
			country: code ? countryName(code, t.locale) : null,
			formatted: null,
			placeId: null,
			location: null
		});
	};

	const countryItems = $derived(
		(countries?.length ? countries.map((code) => code.toUpperCase()) : COUNTRY_CODES)
			.map((code) => ({ value: code, label: countryName(code, t.locale) }))
			.sort((a, b) => a.label.localeCompare(b.label, t.locale))
	);

	// One session per search, from the first keystroke to the resolved address: a provider that
	// bills by session (Google Places) counts the suggestions and the details as one.
	const newSession = () =>
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
	let session = newSession();
	let resolving = $state(false);
	let resolveController: AbortController | null = null;
	onDestroy(() => resolveController?.abort());

	const search = async (query: string, { signal }: AutocompleteItemsRequest) => {
		if (!provider || query.trim().length < minSearchLength) return [];
		const suggestions = await provider.search(query, {
			signal,
			session,
			language: t.locale,
			countries
		});
		return suggestions.map((suggestion) => ({
			value: suggestion.id,
			label: suggestion.label,
			description: suggestion.description
		}));
	};

	const choose = async (suggestionId: string) => {
		if (!provider) return;
		resolveController?.abort();
		const controller = new AbortController();
		resolveController = controller;
		resolving = true;
		try {
			const resolved = await provider.resolve(suggestionId, {
				signal: controller.signal,
				session,
				language: t.locale,
				countries
			});
			if (controller.signal.aborted) return;
			session = newSession();
			if (!resolved) return;
			commit(resolved);
			searchText = formatAddressLine(resolved, { locale: t.locale });
			manual = false;
			onResolve?.(resolved);
		} catch (error) {
			if (controller.signal.aborted) return;
			field.errors = [t.addressLookupFailed];
			void error;
		} finally {
			if (resolveController === controller) {
				resolving = false;
				resolveController = null;
			}
		}
	};

	// The search layout's input shows the chosen address on one line; typing only searches.
	let searchText = $state(untrack(() => formatAddressLine(field.value, { locale: t.locale })));
	let manual = $state(false);
	$effect(() => {
		const line = formatAddressLine(field.value, { locale: t.locale });
		untrack(() => {
			if (!resolving) searchText = line;
		});
	});
	const showFields = $derived(layout === 'fields' || manual);
	const searchable = $derived(!!provider && editable.has('line1'));

	// Labels on the left: every part takes its own row, its label in the column all the parts
	// share, and the address's legend heads them.
	const partsLabelLeft = $derived(labelPosition === 'left' && showFields);
	const layoutRows = $derived(partsLabelLeft ? parts.map((part) => [part]) : rows);
	const rowColumns = (row: readonly Part[]) =>
		row.map((part) => `minmax(0, ${Math.max(part.width, 0)}fr)`).join(' ');

	const autofill: Record<AddressField, string> = {
		line1: 'address-line1',
		line2: 'address-line2',
		postalCode: 'postal-code',
		city: 'address-level2',
		region: 'address-level1',
		country: 'country'
	};

	// After a failed validation: the required parts still empty, all of them for an empty
	// required address.
	const missingShown = $derived.by(() => {
		if (!field.hasError) return [];
		if (!hasContent(field.value)) return required ? requiredParts : [];
		return missingParts(field.value);
	});
	// A missing part's input carries its own message, so it is described and marked invalid, but
	// only the address announces it: the part's own error block stays hidden.
	const partErrors = (part: AddressField) =>
		missingShown.includes(part) ? [t.addressPartRequired(partLabel(part))] : [];
	const partTheme = $derived({ errorsContainer: { base: classes.partErrors() } });
	const partRequired = (part: AddressField) =>
		requiredParts.includes(part) && (required || hasContent(field.value));
	const partReadOnly = (part: AddressField) => field.readOnly || !editable.has(part);

	// No part is the field's control: Field would mark it invalid and describe it by every error
	// of the address. The parts a validation finds missing carry their own message instead, and a
	// Form focuses the first part of an invalid address.
	let frame = $state<HTMLElement | null>(null);
	const onfocusin = () => (field.focused = true);
	const onfocusout = (event: FocusEvent) => {
		if (!frame?.contains(event.relatedTarget as Node | null)) field.focused = false;
	};

	// Submitted under `name[part]` (and `name[countryCode]`), only when the app named the field.
	const baseName = $derived(
		field.name === `${field.type}-input-${field.id}` ? undefined : field.name
	);
	const submitted = $derived(
		baseName
			? [...shownParts, 'countryCode' as const].map((part) => ({
					name: `${baseName}[${part}]`,
					value: part === 'countryCode' ? address.countryCode || null : text(address[part]) || null
				}))
			: []
	);
</script>

<Field
	as="fieldset"
	{field}
	{label}
	{size}
	{density}
	labelPosition={partsLabelLeft ? 'top' : labelPosition}
	{theme}
	fieldAttrs={{ ...fieldAttrs, ...(label ? {} : { 'aria-label': t.addressInput }) }}
	{...rest}
>
	<div
		bind:this={frame}
		data-slot="address-input"
		data-layout={layout}
		data-resolving={resolving ? 'true' : undefined}
		aria-busy={resolving || undefined}
		class={classes.parts()}
		{onfocusin}
		{onfocusout}
	>
		{#if !showFields}
			<div data-slot="address-search" class={classes.search()}>
				<Autocomplete
					{size}
					inputAttrs={{ 'aria-label': t.addressSearch }}
					mode="none"
					items={search}
					value={searchText}
					placeholder={placeholder ?? t.addressSearchPlaceholder}
					disabled={field.disabled}
					readOnly={field.readOnly}
					validationMode="submit"
					errors={field.hasError}
					onValueChange={(next) => (searchText = next ?? '')}
					onSelect={({ item }) => choose(item.value)}
				/>
				{#if !field.disabled && !field.readOnly}
					<Button variant="link" size="small" color="neutral" onclick={() => (manual = true)}>
						{t.addressEnterManually}
					</Button>
				{/if}
			</div>
		{:else}
			<div data-slot="address-parts" class={classes.grid({ density })}>
				{#each layoutRows as row (row.map((part) => part.field).join())}
					<div
						data-slot="address-row"
						class={classes.row({ density })}
						style:--address-row-columns={rowColumns(row)}
					>
						{#each row as { field: part, placeholder: partPlaceholder } (part)}
							<div data-slot="address-part" data-part={part} class={classes.part()}>
								{#if part === 'line1' && searchable && !partReadOnly('line1')}
									<Autocomplete
										label={partLabel('line1')}
										{size}
										{density}
										{labelPosition}
										mode="none"
										items={search}
										value={address.line1 ?? ''}
										placeholder={partPlaceholder ?? placeholder ?? t.addressSearchPlaceholder}
										required={partRequired('line1')}
										disabled={field.disabled}
										validationMode="submit"
										errors={partErrors('line1')}
										theme={partTheme}
										onValueChange={(next) => edit('line1', next)}
										onSelect={({ item }) => choose(item.value)}
									/>
								{:else if part === 'country'}
									<Combobox
										label={partLabel('country')}
										{size}
										{labelPosition}
										items={countryItems}
										value={countryCode || null}
										placeholder={partPlaceholder}
										required={partRequired('country')}
										disabled={field.disabled}
										readOnly={partReadOnly('country')}
										validationMode="submit"
										errors={partErrors('country')}
										theme={partTheme}
										onValueChange={({ value: code }) => editCountry(code)}
									/>
								{:else}
									<TextInput
										label={partLabel(part)}
										{size}
										{density}
										{labelPosition}
										value={address[part] ?? ''}
										placeholder={partPlaceholder}
										required={partRequired(part)}
										disabled={field.disabled}
										readOnly={partReadOnly(part)}
										validationMode="submit"
										errors={partErrors(part)}
										theme={partTheme}
										inputAttrs={{ autocomplete: autofill[part] as never }}
										onValueChange={(next) => edit(part, next)}
									/>
								{/if}
							</div>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
	{#each submitted as entry (entry.name)}
		<FieldHiddenInputs {field} name={entry.name} value={entry.value} required={false} />
	{/each}
</Field>
