<script lang="ts" generics="TData">
	import { tick } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { on } from 'svelte/events';
	import DateInput from '../Form/DateInput/DateInput.svelte';
	import NumberInput from '../Form/NumberInput/NumberInput.svelte';
	import Select from '../Form/Select/Select.svelte';
	import Switch from '../Form/Switch/Switch.svelte';
	import TextInput from '../Form/TextInput/TextInput.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { DataTableClasses } from './dataTable.theme.js';
	import type { DataTableModel } from './dataTable.model.svelte.js';
	import type { DataTableRowInstance } from './dataTable.table.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		row,
		columnId,
		model,
		classes,
		density
	}: {
		row: DataTableRowInstance<TData>;
		columnId: string;
		model: DataTableModel<TData>;
		classes: DataTableClasses;
		density: 'compact' | 'normal' | 'comfortable';
	} = $props();
	const t = $derived(useI18n());

	const config = $derived(model.getColumnConfig(columnId));
	const editor = $derived(config?.editor);
	const payload = $derived(model.getEditorPayload());

	const focusEditor: Attachment<HTMLElement> = (element) => {
		const frame = requestAnimationFrame(() => {
			const target = element.querySelector<HTMLElement>(
				'[role="switch"], input:not([hidden]):not([type="hidden"]), textarea, select, button, [tabindex]:not([hidden]):not(input[type="hidden"])'
			);
			if (target) {
				target.tabIndex = 0;
				target.focus();
				if (editor?.type === 'select' && target.matches('[role="combobox"]')) target.click();
			}
			if (target instanceof HTMLInputElement && target.type !== 'checkbox') target.select();
		});
		return () => cancelAnimationFrame(frame);
	};

	const focusCell = async (element: HTMLElement) => {
		const cell = element.closest<HTMLElement>('td');
		await tick();
		cell?.focus();
	};

	const commitAndFocusCell = async (element: HTMLElement) => {
		const commit = model.commitEditing();
		await focusCell(element);
		await commit;
	};

	const commitCalendarDate = (value: Date | null) => {
		payload?.setDraft(value);
		void model.commitEditing();
	};

	const handleKeydown = async (event: KeyboardEvent) => {
		const editorElement = event.currentTarget as HTMLElement;
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			model.cancelEditing();
			await focusCell(editorElement);
			return;
		}
		if (event.key === 'Tab') {
			event.preventDefault();
			event.stopPropagation();
			await commitAndFocusCell(editorElement);
			return;
		}
		if (event.key.startsWith('Arrow')) {
			event.stopPropagation();
			return;
		}
		if (editor?.type === 'custom') return;
		if (event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			await commitAndFocusCell(editorElement);
		}
	};

	const editorKeyboard: Attachment<HTMLElement> = (element) => {
		element.addEventListener('keydown', handleKeydown);
		return () => element.removeEventListener('keydown', handleKeydown);
	};

	const ownsClickTarget = (element: HTMLElement, target: EventTarget | null) => {
		if (!(target instanceof Node)) return false;
		if (element.contains(target)) return true;

		for (const controller of element.querySelectorAll<HTMLElement>('[aria-controls]')) {
			const controlledIds = controller.getAttribute('aria-controls')?.split(/\s+/) ?? [];
			for (const controlledId of controlledIds) {
				if (element.ownerDocument.getElementById(controlledId)?.contains(target)) return true;
			}
		}

		return false;
	};

	const commitOnClickOutside: Attachment<HTMLElement> = (element) =>
		on(element.ownerDocument, 'click', (event) => {
			if (ownsClickTarget(element, event.target)) return;
			void model.commitEditing();
		});

	const errorMessage = $derived.by(() => {
		if (payload?.error instanceof Error) return payload.error.message;
		if (payload?.error) return 'Could not save';
		return '';
	});

	const fieldTheme = $derived({
		input: { base: classes.editorInput() },
		inputContainer: { base: classes.editorInputContainer({ density }) },
		label: { base: classes.editorFieldLabel() }
	});
</script>

{#if payload && editor && payload.rowId === row.id && payload.columnId === columnId}
	<div
		role="group"
		class={classes.editor()}
		{@attach focusEditor}
		{@attach editorKeyboard}
		{@attach commitOnClickOutside}
	>
		{#if editor.type === 'text'}
			<TextInput
				size="normal"
				class={classes.editorField()}
				theme={fieldTheme}
				placeholder={editor.placeholder}
				disabled={payload.pending}
				value={payload.draft == null ? '' : String(payload.draft)}
				onValueChange={(value) => payload.setDraft(value ?? '')}
			/>
		{:else if editor.type === 'number'}
			<NumberInput
				size="normal"
				class={classes.editorField()}
				theme={fieldTheme}
				min={editor.min}
				max={editor.max}
				step={editor.step}
				showControls={false}
				disabled={payload.pending}
				value={typeof payload.draft === 'number' ? payload.draft : null}
				onValueChange={payload.setDraft}
			/>
		{:else if editor.type === 'select'}
			<Select
				size="normal"
				class={classes.editorField()}
				theme={fieldTheme}
				label={t.dataTableEditColumn(typeof config?.header === 'string' ? config.header : columnId)}
				items={[...editor.options]}
				disabled={payload.pending}
				value={payload.draft == null ? null : String(payload.draft)}
				onValueChange={payload.setDraft}
			/>
		{:else if editor.type === 'date'}
			<DateInput
				size="normal"
				class={classes.editorField()}
				theme={fieldTheme}
				minDate={editor.min}
				maxDate={editor.max}
				disabled={payload.pending}
				value={payload.draft instanceof Date ? payload.draft : null}
				onValueChange={payload.setDraft}
				onSelect={commitCalendarDate}
			/>
		{:else if editor.type === 'switch'}
			<Switch
				size="small"
				class={classes.editorField()}
				theme={{
					inputContainer: { base: classes.editorSwitchContainer() },
					label: { base: classes.editorFieldLabel() }
				}}
				label={t.dataTableEditColumn(columnId)}
				disabled={payload.pending}
				value={Boolean(payload.draft)}
				onValueChange={payload.setDraft}
			/>
		{:else}
			<Slot render={editor.render} {payload} />
		{/if}

		{#if errorMessage}
			<div role="alert" class={classes.editorError()}>{errorMessage}</div>
		{/if}
	</div>
{/if}
