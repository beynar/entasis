import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import type { FieldType, FieldValue, InputType } from './field.js';
import * as v from 'valibot';
import { schemas } from './schemas.js';
import { getFormInputDefinition, getRegisteredInputSchema } from '../Form/form.registry.js';
import { getContext, onDestroy, setContext, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { FormState } from '../Form/form.state.svelte.js';
import type { Density, Sizes } from '$lib/types/theme.js';
import type { LayerHandle, LayerStack } from '$lib/utils/layers.svelte.js';
import { getFirstTabbable } from '$lib/utils/focus.js';
import { isEmptyValue, valuesEqual } from '$lib/utils/values.js';
import { useI18nResolver } from '$lib/i18n/context.svelte.js';
import {
	describeFieldIssue,
	resolveFieldMessages,
	type FieldMessageOverrides,
	type FieldMessages
} from './field.messages.js';

export type FieldValidationResult = string | string[] | boolean | null | undefined;

type FieldStateStaticOptions<T extends FieldType> = {
	type: T;
	name?: string;
	required?: boolean;
	disabled?: boolean;
	/** Refuses user edits while the control stays focusable, validated and submitted. */
	readOnly?: boolean;
	size?: Sizes;
	density?: Density;
	visible?: boolean;
	/** Per-field overrides for the catalog validation messages. */
	messages?: FieldMessageOverrides;
	/** Minimum length of a text value; a shorter, non-empty value reports `tooShort`. */
	minLength?: number;
	/** Maximum length of a text value; a longer value reports `tooLong`. */
	maxLength?: number;
	onValidate?: (value: FieldValue<T>) => FieldValidationResult;
	onValueChange?: (value: FieldValue<T> | null) => void;
	id: string;
};

type FieldStateBindableOptions<T extends FieldType> = {
	value?: FieldValue<T> | null;
	errors: string[] | boolean;
	focused: boolean;
};

export type FieldState<T extends FieldType> = ReturnType<typeof createFieldState<T>>;
export type FieldControlAttributes = {
	id: string;
	name: string;
	disabled: boolean | undefined;
	required: boolean | undefined;
	readonly: boolean | undefined;
	'aria-invalid': 'true' | undefined;
	'aria-describedby': string | undefined;
};

/** The disabled and read-only state a group (a Form, a FormGroup, a fieldset Field) hands down. */
export type FieldGroupState = {
	readonly disabled: boolean;
	readonly readOnly: boolean;
};

const FIELD_GROUP_CONTEXT = Symbol('entasis:field-group');

/**
 * Makes every field created below the calling component disabled or read-only while the group is.
 * Nested groups combine: a field is disabled when it, or any group around it, is. Call during
 * component initialisation.
 */
export const provideFieldGroup = (own: {
	readonly disabled?: boolean;
	readonly readOnly?: boolean;
}): FieldGroupState => {
	const parent = getContext<FieldGroupState | undefined>(FIELD_GROUP_CONTEXT);
	const group: FieldGroupState = {
		get disabled() {
			return Boolean(own.disabled || parent?.disabled);
		},
		get readOnly() {
			return Boolean(own.readOnly || parent?.readOnly);
		}
	};
	setContext(FIELD_GROUP_CONTEXT, group);
	return group;
};

// A checkbox or switch answers a required question only when it is on.
const BOOLEAN_TYPES = new Set<string>(['checkbox', 'switch']);

const normalizeErrors = (validation: FieldValidationResult, invalid: string): string[] => {
	if (!validation) return [];
	if (validation === true) return [invalid];
	return Array.isArray(validation) ? validation : [validation];
};

const unique = (messages: string[]) => [...new Set(messages)];

const containsNode = (container: Node, node: Node) =>
	container === node || container.contains(node);

// Parts of a field that take focus when pressed (WebKit leaves buttons unfocused): a press on one
// keeps the field's focus parked. A press on anything else in the field (its description, say)
// moves focus to the body, which leaves the field.
const PRESSABLE =
	'a[href], button, input, select, textarea, label, summary, [tabindex], [role="button"], [role="checkbox"], [role="switch"], [role="radio"], [role="slider"], [role="option"], [role="tab"], [role="menuitem"], [role="combobox"], [contenteditable]:not([contenteditable="false"])';

const sameStrings = (a: unknown, b: readonly string[]) =>
	Array.isArray(a) && a.length === b.length && a.every((entry, index) => entry === b[index]);

export const createFieldState = <T extends FieldType>(
	options: FieldStateBindableOptions<T> & FieldStateStaticOptions<T>
) => {
	let mounted = false;
	let localValue = $state(options.value);
	let localErrors = $state(options.errors);
	let localFocused = $state(options.focused);
	const group = getContext<FieldGroupState | undefined>(FIELD_GROUP_CONTEXT);
	const resolveMessages = useI18nResolver();
	// Focus that moves into a popup the field opened (a Select listbox, a date picker) stays inside
	// the field even though the popup is portaled elsewhere in the document.
	const layers = (getContext('entasisTheme') as { layers?: LayerStack } | undefined)?.layers;

	// Interaction state the controller keeps private: plain closure state, since the class type is
	// exported and cannot carry `#private` members.
	let focusWithin = false;
	let stopWatchingFocus: (() => void) | null = null;
	// The errors the last catalog-driven validation produced, and the locale they were written in.
	let validation: { errors: string[]; locale: string } | null = null;
	let initialValue = $state<FieldValue<T> | null | undefined>(undefined);
	let hasBaseline = $state(false);
	let hasDescription = $state(false);
	let hasHelper = $state(false);

	class FieldState extends createBindableStateClass<
		FieldStateBindableOptions<T> & FieldStateStaticOptions<T>
	>() {
		declare name: string;
		declare size: Sizes;
		declare density: Density;
		declare disabled: boolean;
		declare readOnly: boolean;
		declare messages: FieldMessages;
		declare form?: FormState;
		node = $state<HTMLElement | null>(null);
		rootNode = $state<HTMLElement | null>(null);
		labelId = `${options.id}-label`;
		errorId = `${options.id}-errors`;
		/** Id Field gives the rendered description, referenced from the control's `aria-describedby`. */
		descriptionId = `${options.id}-description`;
		/** Id Field gives the rendered helper text, referenced from the control's `aria-describedby`. */
		helperId = `${options.id}-helper`;
		errorMessages = $derived.by(() => normalizeErrors(this.errors, this.messages.invalid));
		hasError = $derived(this.errorMessages.length > 0);
		/** True once focus has left the field after entering it (popups the field opened included). */
		touched = $state(false);
		/** The value differs from the initial one; empty values (`null`, `''`, `[]`) count as equal. */
		dirty = $derived(hasBaseline && !valuesEqual(this.value, initialValue));
		/** The field holds a value: text, a selection, a file; for a checkbox or switch, on. */
		filled = $derived(!isEmpty(this.value));
		/** Description, helper and error ids for the control's `aria-describedby`, errors last. */
		describedBy = $derived(
			[
				hasDescription ? this.descriptionId : undefined,
				hasHelper ? this.helperId : undefined,
				this.hasError ? this.errorId : undefined
			].filter((id): id is string => id !== undefined)
		);
		control: Attachment<HTMLElement> = (node) => {
			this.node = node;
			return () => {
				if (this.node === node) this.node = null;
			};
		};

		/** @internal Field attaches this to the rendered description. */
		descriptionPart: Attachment<HTMLElement> = () => {
			hasDescription = true;
			return () => {
				hasDescription = false;
			};
		};

		/** @internal Field attaches this to the rendered helper text. */
		helperPart: Attachment<HTMLElement> = () => {
			hasHelper = true;
			return () => {
				hasHelper = false;
			};
		};

		get controlAttrs(): FieldControlAttributes {
			return {
				id: this.id,
				name: this.name,
				disabled: this.disabled,
				required: this.required,
				readonly: this.readOnly || undefined,
				'aria-invalid': this.hasError ? 'true' : undefined,
				'aria-describedby': this.describedBy.length > 0 ? this.describedBy.join(' ') : undefined
			};
		}

		/** The value the field started with, the baseline for `dirty`; reset re-captures it. */
		get initialValue(): FieldValue<T> | null | undefined {
			return initialValue;
		}

		constructor(options: FieldStateBindableOptions<T> & FieldStateStaticOptions<T>) {
			super(options);
			const hasValueGetter = Boolean(Object.getOwnPropertyDescriptor(options, 'value')?.get);
			const hasErrorsGetter = Boolean(Object.getOwnPropertyDescriptor(options, 'errors')?.get);
			const hasFocusedGetter = Boolean(Object.getOwnPropertyDescriptor(options, 'focused')?.get);
			Object.defineProperty(this, 'value', {
				get: () => {
					const value = hasValueGetter ? options.value : localValue;
					return value === undefined ? localValue : value;
				},
				set: (value: FieldValue<T> | null | undefined) => this.setValue(value),
				enumerable: true,
				configurable: true
			});
			Object.defineProperties(this, {
				errors: {
					get: () => (hasErrorsGetter ? options.errors : localErrors),
					set: (errors: string[] | boolean) => {
						options.errors = errors;
						localErrors = options.errors;
					}
				},
				focused: {
					get: () => (hasFocusedGetter ? options.focused : localFocused),
					set: (focused: boolean) => {
						// While focus is inside the root, a control's own blur handler is stale: focus
						// moved to another part of the field. The root tracking clears `focused`.
						if (!focused && focusWithin) return;
						options.focused = focused;
						localFocused = options.focused;
					}
				},
				// Effective state: the field's own, or that of any group around it (Form, FormGroup,
				// a fieldset Field).
				disabled: {
					get: () => Boolean(options.disabled || group?.disabled),
					set: (disabled: boolean | undefined) => {
						options.disabled = disabled;
					},
					enumerable: true,
					configurable: true
				},
				readOnly: {
					get: () => Boolean(options.readOnly || group?.readOnly),
					set: (readOnly: boolean | undefined) => {
						options.readOnly = readOnly;
					},
					enumerable: true,
					configurable: true
				},
				messages: {
					get: () => resolveFieldMessages(resolveMessages(), this.type, options.messages),
					enumerable: true,
					configurable: true
				},
				size: { get: () => options.size ?? 'normal' },
				density: { get: () => options.density ?? 'normal' }
			});
			if (!this.name) {
				this.name = `${this.type}-input-${this.id}`;
			}
			$effect.pre(() => {
				const value = options.value;
				untrack(() => {
					if (value === undefined) options.value = localValue;
					else localValue = value;
				});
			});
			$effect(() => {
				const newValue = this.value;
				untrack(() => {
					if (!mounted) {
						// The first settled value (after a Form or parent applied its own) is the
						// baseline `dirty` compares against.
						mounted = true;
						initialValue = newValue;
						hasBaseline = true;
					} else {
						if (this.hasError) {
							this.validate(newValue);
						}
						if (this.form) {
							this.form.updateFieldValue(field);
						}
					}
				});
			});
			// A shown validation message follows the active locale: errors the catalog wrote are
			// written again when the locale changes.
			$effect(() => {
				const locale = resolveMessages().locale;
				untrack(() => {
					if (!validation || validation.locale === locale) return;
					if (!this.hasError || !sameStrings(this.errors, validation.errors)) {
						validation = null;
						return;
					}
					this.validate(this.value);
				});
			});
			// Focus is tracked on the field root, so every control reports it, including those with
			// several focusable parts.
			$effect(() => {
				const root = this.rootNode;
				if (!root) return;
				const onFocusIn = () => {
					if (!focusWithin) enterFocus(root);
				};
				root.addEventListener('focusin', onFocusIn);
				return () => {
					root.removeEventListener('focusin', onFocusIn);
					queueMicrotask(releaseStaleFocus);
				};
			});
			// A focused control that becomes disabled or leaves the document gets no blur in
			// Chromium, so `focused` would stay true.
			$effect(() => {
				if (!this.disabled) return;
				untrack(() => leaveFocus(false));
			});
			$effect(() => {
				const node = this.node;
				return () => {
					if (node) queueMicrotask(releaseStaleFocus);
				};
			});
			onDestroy(() => stopWatchingFocus?.());
		}

		/** Updates the control value and publishes one callback for an accepted change. */
		setValue = (nextValue: FieldValue<T> | null | undefined) => {
			if (this.disabled || this.readOnly || Object.is(this.value, nextValue)) return;
			const previousValue = this.value;
			this.syncValue(nextValue);
			const acceptedValue = this.value;
			if (Object.is(previousValue, acceptedValue)) return;
			this.form?.updateFieldValue(this, true);
			this.onValueChange?.(acceptedValue ?? null);
		};

		/** @internal Applies parent/Form state without echoing a control change callback. */
		syncValue = (nextValue: FieldValue<T> | null | undefined) => {
			options.value = nextValue;
			localValue = options.value;
		};

		/**
		 * Restores a value, the initial one by default, as the new untouched baseline: no value
		 * callback, no errors, not dirty, not touched.
		 */
		reset = (nextValue: FieldValue<T> | null | undefined = initialValue) => {
			this.syncValue(nextValue);
			initialValue = this.value;
			hasBaseline = true;
			this.errors = [];
			this.touched = false;
		};

		/**
		 * Moves focus to the control without activating it, as clicking a label does: a Switch is
		 * not toggled, a Select does not open. Returns whether something took focus.
		 */
		focusControl = (): boolean => {
			if (this.disabled) return false;
			const target = this.node ?? (this.rootNode ? getFirstTabbable(this.rootNode) : null);
			if (!target) return false;
			target.focus();
			return target.ownerDocument.activeElement === target;
		};

		/** The registered definition behind an app-defined input type, if this field has one. */
		get definition() {
			return getFormInputDefinition(this.type);
		}

		checkSchema(value?: FieldValue<T> | null) {
			const definition = this.definition;
			// An explicit minimum replaces the built-in password minimum.
			const type = this.type === 'password' && this.minLength !== undefined ? 'text' : this.type;
			const schema = definition
				? getRegisteredInputSchema(definition, Boolean(this.required))
				: schemas[this.required ? 'required' : 'optional'][type as InputType];
			return v.safeParse(schema, value);
		}

		get isValid() {
			const value = this.value;
			if (this.required && isEmpty(value)) return false;
			return this.checkSchema(value).success && lengthMessage(value) === null;
		}

		/** Validates a value, writes the errors, and remembers the locale they were written in. */
		validate = (value = this.value) => {
			const result = this.runValidation(value);
			validation =
				result[0] && Array.isArray(this.errors) && this.errors.length > 0
					? { errors: [...this.errors], locale: resolveMessages().locale }
					: null;
			return result;
		};

		/** @internal The validation `validate` wraps. */
		runValidation = (value: FieldValue<T> | null | undefined) => {
			// Disabled fields are barred from validation, as in a native form; errors an app set
			// on them stay visible.
			if (this.disabled) return [false, value] as const;
			const messages = this.messages;
			this.errors = [];

			// An empty required field gets one message, whatever its type check would add.
			if (this.required && isEmpty(value)) {
				this.errors = [messages.required];
				return [true, value] as const;
			}

			const parseResult = this.checkSchema(value);
			if (!parseResult.success && parseResult.issues.length > 0) {
				const locale = resolveMessages().locale;
				this.errors = unique(
					parseResult.issues.map((issue) => describeFieldIssue(issue, messages, locale))
				);
				return [true, parseResult.output] as const;
			}

			const lengthError = lengthMessage(value);
			if (lengthError !== null) {
				this.errors = [lengthError];
				return [true, parseResult.output] as const;
			}

			// We should only call onValidate if the value is not null or undefined and not an empty string when the field is not required
			const definition = this.definition;
			const shouldCallOnValidate = definition
				? !definition.isEmpty(value)
				: this.required || (value !== null && value !== undefined && value !== '');
			if (shouldCallOnValidate) {
				// A registered type's own rule runs first; the entry's onValidate adds to it.
				const errors = [
					...normalizeErrors(definition?.validate?.(value), messages.invalid),
					...normalizeErrors(this.onValidate?.(value as FieldValue<T>), messages.invalid)
				];
				if (errors.length > 0) this.errors = errors;
			}

			return [this.hasError, parseResult.output] as const;
		};
	}

	const field = new FieldState(options);
	const formContext = getContext<FormState>('form');
	if (formContext) {
		field.form = formContext;
		onDestroy(formContext.registerField(field));
	}

	function isEmpty(value: unknown): boolean {
		const definition = field.definition;
		if (definition) return definition.isEmpty(value);
		if (BOOLEAN_TYPES.has(field.type)) return value !== true;
		// A rating of zero stars is no rating.
		if (field.type === 'rating') return !value;
		return isEmptyValue(value);
	}

	function lengthMessage(value: unknown): string | null {
		if (typeof value !== 'string' || value.length === 0) return null;
		if (field.minLength !== undefined && value.length < field.minLength) {
			return field.messages.tooShort(field.minLength);
		}
		if (field.maxLength !== undefined && value.length > field.maxLength) {
			return field.messages.tooLong(field.maxLength);
		}
		return null;
	}

	/** Inside the field root, or inside a popup layer the field opened. */
	function isWithin(target: EventTarget | null): target is Node {
		const root = field.rootNode;
		if (!root || !(target instanceof Node)) return false;
		if (root.contains(target)) return true;
		if (!layers) return false;
		for (const layer of layers.open) {
			if (![...layer.nodes].some((node) => containsNode(node, target))) continue;
			for (let current: LayerHandle | null = layer; current; current = current.parent) {
				if ([...current.nodes].some((node) => root.contains(node))) return true;
			}
		}
		return false;
	}

	// A press inside a popup the field opened, or on a pressable part of the field, keeps focus
	// parked; a press on its text or padding takes focus away.
	function pressKeepsFocus(target: EventTarget | null): boolean {
		const root = field.rootNode;
		if (!root || !isWithin(target)) return false;
		if (!root.contains(target)) return true;
		const element = target instanceof Element ? target : target.parentElement;
		const pressable = element?.closest(PRESSABLE);
		return (
			pressable !== null &&
			pressable !== undefined &&
			pressable !== root &&
			root.contains(pressable)
		);
	}

	function enterFocus(root: HTMLElement): void {
		focusWithin = true;
		if (!field.focused && !field.disabled) field.focused = true;
		// Leaving is judged at the document: focus can leave from a portaled popup, which the root
		// never hears about.
		const document = root.ownerDocument;
		// A press on a part of the field that takes no focus (a button in WebKit, a popup's
		// padding) parks focus on the body without leaving the field; the next press or focus
		// elsewhere decides.
		let pressInside = false;
		let parked = false;
		const onPointerDown = (event: PointerEvent) => {
			pressInside = pressKeepsFocus(event.target);
			if (parked && !pressInside) leaveFocus(true);
		};
		const onPointerUp = () => {
			setTimeout(() => (pressInside = false));
		};
		const onFocusIn = (event: FocusEvent) => {
			if (!isWithin(event.target)) leaveFocus(true);
			else parked = false;
		};
		const onFocusOut = (event: FocusEvent) => {
			if (!isWithin(event.target) || isWithin(event.relatedTarget)) return;
			if (event.relatedTarget === null && pressInside) parked = true;
			else leaveFocus(true);
		};
		stopWatchingFocus?.();
		document.addEventListener('pointerdown', onPointerDown, true);
		document.addEventListener('pointerup', onPointerUp, true);
		document.addEventListener('pointercancel', onPointerUp, true);
		document.addEventListener('focusin', onFocusIn, true);
		document.addEventListener('focusout', onFocusOut, true);
		stopWatchingFocus = () => {
			document.removeEventListener('pointerdown', onPointerDown, true);
			document.removeEventListener('pointerup', onPointerUp, true);
			document.removeEventListener('pointercancel', onPointerUp, true);
			document.removeEventListener('focusin', onFocusIn, true);
			document.removeEventListener('focusout', onFocusOut, true);
			stopWatchingFocus = null;
		};
	}

	function leaveFocus(touch: boolean): void {
		focusWithin = false;
		stopWatchingFocus?.();
		if (field.focused) field.focused = false;
		if (touch) field.touched = true;
	}

	// Runs a microtask after the control or the root left: focus that went with them is gone.
	function releaseStaleFocus(): void {
		if (!focusWithin && !field.focused) return;
		const root = field.rootNode;
		const active = root?.ownerDocument.activeElement ?? null;
		const stillFocused =
			root?.isConnected === true &&
			active !== null &&
			isWithin(active) &&
			!(active as HTMLElement).matches?.(':disabled');
		if (!stillFocused) leaveFocus(false);
	}

	return field;
};
