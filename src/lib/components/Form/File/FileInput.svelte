<script lang="ts" generics="Mode extends 'single' | 'multiple' = 'single'">
	import { untrack } from 'svelte';
	import Button from '../../Button/Button.svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import type { FieldValue } from '../Field/field.js';
	import { FileDropzone } from './fileDropzone.svelte.js';
	import type { FileInputProps, FileInputType, FileInputValue } from './fileInput.props.js';
	import { useFileInputTheme } from './fileInput.theme.js';
	import { slide } from 'svelte/transition';
	import Slot from '../../Slot/Slot.svelte';
	import { fileIcon } from '../../Icons/file.js';
	import { plusIcon } from '../../Icons/plus.js';
	import { xIcon } from '../../Icons/x.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		mode = 'single' as Mode,
		onValueChange,
		onReject,
		types = ['image/*'],
		maxFiles = 1,
		clickable = true,
		maxSize = 50 * 1024 * 1024,
		fileList,
		fileListClass,
		file,
		fileClass,
		placeholder,
		placeholderClass,
		required = false,
		theme,
		disabled,
		name,
		onValidate,
		visible,
		...rest
	}: FileInputProps<Mode> = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	const t = $derived(useI18n());
	const resolvedPlaceholder = $derived(placeholder ?? t.fileDropzone);

	const field = createFieldState({
		id,
		get value() {
			return value as FieldValue<FileInputType<Mode>> | null;
		},
		set value(v) {
			value = v as FileInputValue<Mode>;
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
			onValueChange?.(v as FileInputValue<Mode>);
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
		get type() {
			return (mode === 'single' ? 'file' : 'files') as FileInputType<Mode>;
		}
	});

	const classes = $derived(useFileInputTheme(theme));

	const isImage = (file: File): boolean => {
		return file.type.startsWith('image/');
	};

	const dropzone = new FileDropzone(() => ({
		disabled: field.disabled,
		types,
		maxFiles,
		clickable,
		maxSize,
		mode,
		files: normalizeFiles(field.value as File | File[] | null | undefined),
		onReject,
		onValueChange: (files: File[]) => {
			field.value = (mode === 'single' ? (files[0] ?? null) : files) as FieldValue<
				FileInputType<Mode>
			> | null;
		}
	}));

	function normalizeFiles(currentValue: File | File[] | null | undefined): File[] {
		if (!currentValue) return [];
		return Array.isArray(currentValue) ? currentValue : [currentValue];
	}
</script>

<Field
	as="fieldset"
	{@attach dropzone.zone}
	{field}
	size={rest.size}
	theme={{
		...(theme || {}),
		inputContainer: {
			...(theme?.inputContainer || {}),
			base: classes.inputContainer({
				class: theme?.inputContainer?.base,
				state: dropzone.state,
				disabled: field.disabled,
				size: rest.size
			})
		}
	}}
	fieldAttrs={{
		'data-state': dropzone.state,
		'data-clickable': clickable
	}}
	{...rest}
>
	<input
		multiple={mode === 'multiple' && maxFiles > 1}
		hidden
		accept={types.join(',')}
		{@attach dropzone.input}
		type="file"
		disabled={field.disabled}
	/>
	{#if dropzone.files.length === 0}
		<div transition:slide class={classes.placeholder({ class: placeholderClass, size: rest.size })}>
			{@render fileIcon({ size: 40 })}
			{#if resolvedPlaceholder}
				<span class="mt-2">{resolvedPlaceholder}</span>
			{/if}
		</div>
	{:else}
		<div transition:slide class="h-fit w-full">
			<Slot render={fileList} class={classes.fileList({ class: fileListClass, size: rest.size })}>
				{#each dropzone.files as fil (fil.name + fil.size)}
					{@const size = dropzone.formatSize(fil.size)}
					<div transition:slide={{ duration: 300 }}>
						<Slot render={file} class={classes.file({ class: fileClass, size: rest.size })}>
							{#if isImage(fil)}
								{@const src = URL.createObjectURL(fil)}
								<img
									{src}
									alt={fil.name}
									class="border-neutral-muted h-16 w-16 shrink-0 rounded border object-cover"
								/>
							{/if}
							<div class="min-w-0 flex-1">
								<div class="truncate">{fil.name}</div>
								<div class="text-neutral/70 text-xs">{size}</div>
							</div>
							<Button variant="ghost" size="small" squared onclick={() => dropzone.removeFile(fil)}>
								{#snippet prefix()}
									{@render xIcon({ size: 16 })}
								{/snippet}
							</Button>
						</Slot>
					</div>
				{/each}
				{#if mode === 'multiple' && dropzone.files.length > 0 && dropzone.files.length < maxFiles}
					<Button variant="soft" color="primary" fullWidth onclick={() => dropzone.open()}>
						{#snippet prefix()}
							{@render plusIcon({ size: 16 })}
						{/snippet}
						{Number.isFinite(maxFiles)
							? t.addMoreFiles(dropzone.files.length, maxFiles)
							: t.addMoreFilesUnbounded}
					</Button>
				{/if}
			</Slot>
		</div>
	{/if}
</Field>
