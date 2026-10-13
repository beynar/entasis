<script lang="ts" module>
	// Roles that take aria-required / aria-readonly (ARIA 1.2, plus slider from 1.3, which axe
	// accepts). Native inputs keep their own `required` and `readonly` attributes instead.
	const ARIA_REQUIRED_ROLES = new Set([
		'checkbox',
		'combobox',
		'gridcell',
		'listbox',
		'radiogroup',
		'searchbox',
		'slider',
		'spinbutton',
		'switch',
		'textbox',
		'tree',
		'treegrid'
	]);
	const ARIA_READONLY_ROLES = new Set([
		'checkbox',
		'combobox',
		'grid',
		'gridcell',
		'listbox',
		'radiogroup',
		'searchbox',
		'slider',
		'spinbutton',
		'switch',
		'textbox',
		'treegrid'
	]);
	// Input types whose native `readonly` attribute the browser honours.
	const TEXT_ENTRY_INPUT_TYPES = new Set([
		'date',
		'datetime-local',
		'email',
		'month',
		'number',
		'password',
		'search',
		'tel',
		'text',
		'time',
		'url',
		'week'
	]);
	// Presses on these keep their own behaviour instead of focusing the field's control.
	const INTERACTIVE =
		'a[href], button, input, select, textarea, label, summary, [contenteditable]:not([contenteditable="false"]), [tabindex], [role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="radio"], [role="slider"], [role="option"], [role="tab"], [role="menuitem"]';

	const splitIds = (value: string | null) => value?.split(/\s+/).filter(Boolean) ?? [];

	const acceptsNativeReadOnly = (element: Element) =>
		element instanceof HTMLTextAreaElement ||
		(element instanceof HTMLInputElement && TEXT_ENTRY_INPUT_TYPES.has(element.type));

	const isTextEntry = (element: Element) =>
		acceptsNativeReadOnly(element) || (element as HTMLElement).isContentEditable;

	const roleOf = (element: Element): string | undefined => {
		const explicit = splitIds(element.getAttribute('role'))[0];
		if (explicit) return explicit;
		if (element instanceof HTMLTextAreaElement) return 'textbox';
		if (element instanceof HTMLSelectElement) {
			return element.multiple || element.size > 1 ? 'listbox' : 'combobox';
		}
		if (element instanceof HTMLInputElement) {
			if (element.type === 'checkbox') return 'checkbox';
			if (element.type === 'range') return 'slider';
			if (element.type === 'number') return 'spinbutton';
			if (TEXT_ENTRY_INPUT_TYPES.has(element.type)) return 'textbox';
		}
		return undefined;
	};

	const isNativeFormControl = (element: Element) =>
		element instanceof HTMLInputElement ||
		element instanceof HTMLSelectElement ||
		element instanceof HTMLTextAreaElement;

	const restoreAttribute = (element: Element, name: string, value: string | null) => {
		if (value === null) element.removeAttribute(name);
		else element.setAttribute(name, value);
	};

	// Sets an attribute and returns its undo. A control's own template can write the same
	// attribute (aria-readonly on Rating, aria-required on Switch); once that template removes it,
	// the undo must not bring back a value this effect captured earlier, so it only restores
	// while the attribute still holds what was set here.
	const claimAttribute = (element: Element, name: string, value: string) => {
		const initial = element.getAttribute(name);
		element.setAttribute(name, value);
		return () => {
			if (element.getAttribute(name) === value) restoreAttribute(element, name, initial);
		};
	};
</script>

<script lang="ts" generics="Type extends FieldType">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { on } from 'svelte/events';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { presence } from '$lib/utils/stateAttributes.js';
	import type { FieldType, FieldProps } from './field.js';
	import { provideFieldGroup } from './field.state.svelte.js';
	import { useFieldTheme } from './field.theme.js';

	let {
		class: className = '',
		children,
		errorsContainer,
		description,
		helper,
		actions,
		error,
		suffix,
		label,
		prefix,
		footer,
		header,
		size = 'normal',
		density = 'normal',
		labelPosition = 'top',
		theme,
		field,
		as = 'div',
		labelFor = field.id,
		fieldAttrs,
		...attachments
	}: FieldProps<Type> = $props();

	// A fieldset Field is a group, like a FormGroup: a field rendered inside it shares its
	// disabled and read-only state.
	if (untrack(() => as) === 'fieldset') {
		provideFieldGroup({
			get disabled() {
				return field.disabled;
			},
			get readOnly() {
				return field.readOnly;
			}
		});
	}

	const classes = $derived(useFieldTheme(theme));
	const resolvedLabelPosition = $derived(
		label || actions || header ? labelPosition : ('top' as const)
	);

	$effect(() => {
		const control = field.node ?? field.rootNode;
		if (!control) return;

		const initialDescribedBy = control.getAttribute('aria-describedby');
		const initialLabelledBy = control.getAttribute('aria-labelledby');
		const undo: (() => void)[] = [];

		if (field.hasError) undo.push(claimAttribute(control, 'aria-invalid', 'true'));

		// The app's own ids come first, then the description, the helper and the errors.
		const fieldDescriptionIds = new Set([field.descriptionId, field.helperId, field.errorId]);
		const describedByIds = [
			...splitIds(initialDescribedBy).filter((id) => !fieldDescriptionIds.has(id)),
			...field.describedBy
		];
		if (describedByIds.length === 0) control.removeAttribute('aria-describedby');
		else control.setAttribute('aria-describedby', describedByIds.join(' '));

		// A control that declared its own labelledby (Switch's inline label) keeps it, and the label
		// id is listed once even then; only the id this effect adds is subject to removal. An
		// aria-label on the control names it instead of the field label.
		const labelledByIds = splitIds(initialLabelledBy);
		const namedByControl = Boolean(control.getAttribute('aria-label')?.trim());
		const linksLabel = label && labelFor === false && as !== 'fieldset' && !namedByControl;
		if (linksLabel && !labelledByIds.includes(field.labelId)) labelledByIds.push(field.labelId);
		if (labelledByIds.length === 0) control.removeAttribute('aria-labelledby');
		else control.setAttribute('aria-labelledby', labelledByIds.join(' '));

		// Native controls carry `required` themselves; a role-based control announces it.
		const role = roleOf(control);
		if (field.required && !isNativeFormControl(control) && role && ARIA_REQUIRED_ROLES.has(role)) {
			undo.push(claimAttribute(control, 'aria-required', 'true'));
		}
		if (field.readOnly) {
			if (acceptsNativeReadOnly(control)) undo.push(claimAttribute(control, 'readonly', ''));
			else if (role && ARIA_READONLY_ROLES.has(role)) {
				undo.push(claimAttribute(control, 'aria-readonly', 'true'));
			}
		}

		return () => {
			for (const restore of undo) restore();
			restoreAttribute(control, 'aria-describedby', initialDescribedBy);
			restoreAttribute(control, 'aria-labelledby', initialLabelledBy);
		};
	});

	// A label that is not a native <label> (labelFor={false}) still focuses its control when
	// clicked, without activating it, and leaves a text selection alone.
	const focusFromLabel: Attachment<HTMLElement> = (labelNode) =>
		on(labelNode, 'click', (event) => {
			if (event.defaultPrevented) return;
			const target = event.target instanceof Element ? event.target : null;
			const interactive = target?.closest(INTERACTIVE);
			if (interactive && interactive !== labelNode && labelNode.contains(interactive)) return;
			const selection = labelNode.ownerDocument.getSelection();
			if (selection && !selection.isCollapsed && labelNode.contains(selection.anchorNode)) return;
			field.focusControl();
		});

	// A press on the container around a text control (its padding, an icon, a chip) focuses the
	// control instead of blurring it; buttons and other controls inside keep their own behaviour.
	const focusFromContainer: Attachment<HTMLElement> = (container) =>
		on(container, 'mousedown', (event) => {
			if (event.button !== 0 || event.defaultPrevented || field.disabled) return;
			const control = field.node;
			const target = event.target;
			if (!control || !(target instanceof Element) || !isTextEntry(control)) return;
			if (control.contains(target)) return;
			const interactive = target.closest(INTERACTIVE);
			if (interactive && container.contains(interactive)) return;
			event.preventDefault();
			if (control.ownerDocument.activeElement !== control) control.focus();
		});
</script>

<!-- Suffixed id: the bare field.id belongs to the control element, so <label for={field.id}>
     resolves to it — a duplicate id here (first in tree order) would steal the label linkage. -->
<svelte:element
	this={as}
	data-label-position={resolvedLabelPosition}
	data-invalid={presence(field.hasError)}
	data-disabled={presence(field.disabled)}
	data-readonly={presence(field.readOnly)}
	data-focused={presence(field.focused)}
	data-filled={presence(field.filled)}
	data-dirty={presence(field.dirty)}
	data-touched={presence(field.touched)}
	{...as === 'fieldset' ? { disabled: field.disabled || undefined } : {}}
	class={classes.root({
		className,
		density,
		hasError: field.hasError,
		labelPosition: resolvedLabelPosition
	})}
	bind:this={field.rootNode}
	{...fieldAttrs}
	id="{field.id}-field"
	{...attachments}
>
	{#if label || actions || header}
		{#if as === 'fieldset'}
			<Slot
				as="legend"
				render={header}
				attrs={{ id: field.labelId }}
				class={classes.header({
					density,
					required: field.required,
					hasError: field.hasError,
					labelPosition: resolvedLabelPosition
				})}
			>
				<Slot
					as="span"
					class={classes.label({
						size,
						hasError: field.hasError,
						required: field.required,
						disabled: field.disabled
					})}
					render={label}
				/>
				<Slot class={classes.actions({ density })} render={actions} />
			</Slot>
		{:else}
			<Slot
				render={header}
				class={classes.header({
					density,
					required: field.required,
					hasError: field.hasError,
					labelPosition: resolvedLabelPosition
				})}
			>
				<Slot
					as={labelFor === false ? 'span' : 'label'}
					attrs={labelFor === false ? { id: field.labelId } : { id: field.labelId, for: labelFor }}
					class={classes.label({
						size,
						hasError: field.hasError,
						required: field.required,
						disabled: field.disabled
					})}
					render={label}
					{@attach labelFor === false ? focusFromLabel : undefined}
				/>
				<Slot class={classes.actions({ density })} render={actions} />
			</Slot>
		{/if}
	{/if}
	<div
		class={classes.inputContainer({
			density,
			hasError: field.hasError,
			labelPosition: resolvedLabelPosition
		})}
		{@attach focusFromContainer}
	>
		<Slot render={prefix} class={classes.prefix({ density })} />
		{@render children()}
		<Slot render={suffix} class={classes.suffix({ density })} />
	</div>
	{#if description || helper || footer}
		<Slot render={footer} class={classes.footer({ density, labelPosition: resolvedLabelPosition })}>
			<Slot
				class={classes.description({ size, disabled: field.disabled })}
				render={description}
				attrs={{ id: field.descriptionId }}
				{@attach field.descriptionPart}
			/>
			<Slot
				class={classes.helper({ size, disabled: field.disabled })}
				render={helper}
				attrs={{ id: field.helperId }}
				{@attach field.helperPart}
			/>
		</Slot>
	{/if}
	{#if field.hasError}
		<!-- One live-region model: an alert, announced when the errors appear. -->
		<Slot
			render={errorsContainer}
			class={classes.errorsContainer({ size, labelPosition: resolvedLabelPosition })}
			attrs={{ id: field.errorId, role: 'alert' }}
		>
			{#each field.errorMessages as err, index (index)}
				<Slot render={error} class={classes.error({ size })}>
					{err}
				</Slot>
			{/each}
		</Slot>
	{/if}
</svelte:element>
