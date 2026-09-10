<script lang="ts">
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { KeyValueInputProps } from './keyValueInput.props.js';
	import type { KeyValuePair } from '../Field/field.js';
	import { useKeyValueInputTheme } from './keyValueInput.theme.js';
	import { plusIcon } from '../../Icons/plus.js';
	import { xIcon } from '../../Icons/x.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { tick, untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { scale } from 'svelte/transition';

	type KeyValueRow = { id: string; key: string; value: string };
	type InputField = 'key' | 'value';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		size = 'normal',
		keyPlaceholder,
		valuePlaceholder,
		addLabel,
		maxRows,
		i18n,
		theme,
		disabled,
		name,
		onValidate,
		onValueChange,
		visible,
		prefix,
		suffix,
		description,
		...rest
	}: KeyValueInputProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();

	// Stable per-row uid from an instance counter. The each block is keyed by row.id
	// because keys can be empty or duplicated while typing, and duplicate/empty keys in a
	// keyed each crash Svelte.
	let uid = 0;
	const nextId = () => `${id}-row-${uid++}`;
	const inputElements: Record<InputField, Map<string, HTMLInputElement>> = {
		key: new Map(),
		value: new Map()
	};

	// Row IDs remain stable during edits; a parent replacement creates a new row set.
	let rows = $state<KeyValueRow[]>(
		untrack(() => (value ?? []).map((pair) => ({ id: nextId(), key: pair.key, value: pair.value })))
	);

	// Output pairs derived from the editor rows.
	const pairs = $derived(rows.map((row) => ({ key: row.key, value: row.value })));

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
			onValueChange?.(v ?? []);
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
		get onValidate() {
			return onValidate;
		},
		get visible() {
			return visible;
		},
		type: 'keyvalue'
	});

	const hasSamePairs = (left: KeyValuePair[], right: KeyValuePair[]) =>
		left.length === right.length &&
		left.every((pair, index) => pair.key === right[index].key && pair.value === right[index].value);

	$effect(() => {
		const nextValue = value;
		untrack(() => {
			if (hasSamePairs(nextValue ?? [], pairs)) return;
			rows = (nextValue ?? []).map((pair) => ({ id: nextId(), ...pair }));
		});
	});

	$effect(() => {
		const nextPairs = pairs;
		untrack(() => {
			if (!hasSamePairs(value ?? [], nextPairs)) field.setValue(nextPairs);
		});
	});

	const atMaxRows = $derived(maxRows !== undefined && rows.length >= maxRows);

	// Append a fresh empty row. Never mutates the array in place.
	const addRow = async () => {
		if (disabled || atMaxRows) return;

		const row = { id: nextId(), key: '', value: '' };
		rows = [...rows, row];
		await tick();
		inputElements.key.get(row.id)?.focus();
	};

	// Remove a row by id. Never mutates the array in place; early-returns when disabled.
	const removeRow = (rowId: string) => {
		if (disabled) return;
		rows = rows.filter((row) => row.id !== rowId);
	};

	const registerInput = (rowId: string, field: InputField, input: HTMLInputElement) => {
		const fieldInputs = inputElements[field];
		fieldInputs.set(rowId, input);
		return () => {
			if (fieldInputs.get(rowId) === input) fieldInputs.delete(rowId);
		};
	};

	const getInput = (rowIndex: number, field: InputField) => {
		const row = rows[rowIndex];
		return row ? inputElements[field].get(row.id) : undefined;
	};

	const getHorizontalInput = (rowIndex: number, field: InputField, direction: -1 | 1) => {
		if (direction === -1) {
			return field === 'value' ? getInput(rowIndex, 'key') : getInput(rowIndex - 1, 'value');
		}
		return field === 'key' ? getInput(rowIndex, 'value') : getInput(rowIndex + 1, 'key');
	};

	const focusInput = (input: HTMLInputElement, caret: number) => {
		input.focus();
		const offset = Math.max(0, Math.min(caret, input.value.length));
		input.setSelectionRange(offset, offset);
	};

	const focusAfterRemoval = async (input: HTMLInputElement) => {
		await tick();
		if (input.isConnected) focusInput(input, input.value.length);
	};

	const handleKeydown = (event: KeyboardEvent, row: KeyValueRow, field: InputField) => {
		if (event.isComposing) return;

		if (event.key === 'Enter') {
			event.preventDefault();
			if (field === 'value' && row.value.trim()) void addRow();
			return;
		}

		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) return;
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

		const rowIndex = rows.findIndex((candidate) => candidate.id === row.id);
		const selectionStart = input.selectionStart;
		const selectionEnd = input.selectionEnd;
		if (rowIndex < 0 || selectionStart === null || selectionEnd === null) return;

		if (event.key === 'ArrowRight') {
			if (selectionStart !== selectionEnd || selectionEnd !== input.value.length) return;
			const nextInput = getHorizontalInput(rowIndex, field, 1);
			if (!nextInput) return;
			event.preventDefault();
			focusInput(nextInput, 0);
			return;
		}

		if (event.key === 'ArrowLeft') {
			if (selectionStart !== selectionEnd || selectionStart !== 0) return;
			const previousInput = getHorizontalInput(rowIndex, field, -1);
			if (!previousInput) return;
			event.preventDefault();
			focusInput(previousInput, previousInput.value.length);
			return;
		}

		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			const direction = event.key === 'ArrowUp' ? -1 : 1;
			const verticalInput = getInput(rowIndex + direction, field);
			if (!verticalInput) return;
			event.preventDefault();
			focusInput(verticalInput, selectionStart);
			return;
		}

		if (event.key === 'Backspace' && !input.value) {
			const isEmptyRow = !row.key && !row.value;
			const previousInput = isEmptyRow
				? getInput(rowIndex - 1, 'value')
				: getHorizontalInput(rowIndex, field, -1);
			if (!isEmptyRow && !previousInput) return;

			event.preventDefault();
			if (isEmptyRow) {
				removeRow(row.id);
				if (previousInput) void focusAfterRemoval(previousInput);
				return;
			}
			if (previousInput) focusInput(previousInput, previousInput.value.length);
		}
	};

	const t = $derived(useI18n(i18n));
	const classes = $derived(useKeyValueInputTheme(theme));
</script>

<Field
	as="fieldset"
	{field}
	{description}
	{prefix}
	{suffix}
	theme={{
		...(theme || {}),
		inputContainer: {
			...(theme?.inputContainer || {}),
			base: classes.inputContainer({ class: theme?.inputContainer?.base, size })
		}
	}}
	{...rest}
>
	<ul role="list" class="contents">
		{#each rows as row (row.id)}
			<li
				role="listitem"
				class={classes.row({ size })}
				animate:flip={{ duration: 200 }}
				transition:scale={{ duration: 150, start: 0.8 }}
			>
				<input
					data-1p-ignore
					type="text"
					autocomplete="off"
					bind:value={row.key}
					{@attach (node) => registerInput(row.id, 'key', node)}
					placeholder={keyPlaceholder ?? t.keyLabel}
					{disabled}
					class={classes.input({ size, disabled })}
					onkeydown={(event) => handleKeydown(event, row, 'key')}
				/>
				<input
					data-1p-ignore
					type="text"
					autocomplete="off"
					bind:value={row.value}
					{@attach (node) => registerInput(row.id, 'value', node)}
					placeholder={valuePlaceholder ?? t.valueLabel}
					{disabled}
					class={classes.input({ size, disabled })}
					onkeydown={(event) => handleKeydown(event, row, 'value')}
				/>
				<button
					type="button"
					aria-label={t.remove(row.key || t.keyLabel)}
					{disabled}
					class={classes.removeButton({ size, disabled })}
					onclick={() => removeRow(row.id)}
				>
					{@render xIcon({ size: 16 })}
				</button>
			</li>
		{/each}
	</ul>
	<button
		type="button"
		disabled={disabled || atMaxRows}
		class={classes.addButton({ size, disabled: disabled || atMaxRows })}
		onclick={() => void addRow()}
	>
		{@render plusIcon({ size: 16 })}
		{addLabel ?? t.add}
	</button>
</Field>
