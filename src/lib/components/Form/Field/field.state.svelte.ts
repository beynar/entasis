import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import type { FieldValue, InputType } from './field.js';
import * as v from 'valibot';
import { schemas } from './schemas.js';
import { getContext, onDestroy, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { FormState } from '../Form/form.state.svelte.js';
import type { Density, Sizes } from '$lib/types/theme.js';

export type FieldValidationResult = string | string[] | boolean | null | undefined;

type FieldStateStaticOptions<T extends InputType> = {
	type: T;
	name?: string;
	required?: boolean;
	disabled?: boolean;
	size?: Sizes;
	density?: Density;
	visible?: boolean;
	onValidate?: (value: FieldValue<T>) => FieldValidationResult;
	onValueChange?: (value: FieldValue<T> | null) => void;
	id: string;
};

type FieldStateBindableOptions<T extends InputType> = {
	value?: FieldValue<T> | null;
	errors: string[] | boolean;
	focused: boolean;
};

export type FieldState<T extends InputType> = ReturnType<typeof createFieldState<T>>;
export type FieldControlAttributes = {
	id: string;
	name: string;
	disabled: boolean | undefined;
	required: boolean | undefined;
	'aria-invalid': 'true' | undefined;
	'aria-describedby': string | undefined;
};

const normalizeErrors = (validation: FieldValidationResult): string[] => {
	if (!validation) return [];
	if (validation === true) return ['Invalid value'];
	return Array.isArray(validation) ? validation : [validation];
};

export const createFieldState = <T extends InputType>(
	options: FieldStateBindableOptions<T> & FieldStateStaticOptions<T>
) => {
	let mounted = false;
	let localValue = $state(options.value);
	let localErrors = $state(options.errors);
	let localFocused = $state(options.focused);

	class FieldState extends createBindableStateClass<
		FieldStateBindableOptions<T> & FieldStateStaticOptions<T>
	>() {
		declare name: string;
		declare size: Sizes;
		declare density: Density;
		declare form?: FormState;
		node = $state<HTMLElement | null>(null);
		rootNode = $state<HTMLElement | null>(null);
		labelId = `${options.id}-label`;
		errorId = `${options.id}-errors`;
		errorMessages = $derived(normalizeErrors(this.errors));
		hasError = $derived(this.errorMessages.length > 0);
		control: Attachment<HTMLElement> = (node) => {
			this.node = node;
			return () => {
				if (this.node === node) this.node = null;
			};
		};

		get controlAttrs(): FieldControlAttributes {
			return {
				id: this.id,
				name: this.name,
				disabled: this.disabled,
				required: this.required,
				'aria-invalid': this.hasError ? 'true' : undefined,
				'aria-describedby': this.hasError ? this.errorId : undefined
			};
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
						options.focused = focused;
						localFocused = options.focused;
					}
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
						mounted = true;
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
		}

		/** Updates the control value and publishes one callback for an accepted change. */
		setValue = (nextValue: FieldValue<T> | null | undefined) => {
			if (this.disabled || Object.is(this.value, nextValue)) return;
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

		checkSchema(value?: FieldValue<T> | null) {
			const schema = schemas[this.required ? 'required' : 'optional'][this.type];
			return v.safeParse(schema, value);
		}

		get isValid() {
			return this.checkSchema(this.value).success;
		}

		validate = (value = this.value) => {
			const parseResult = this.checkSchema(value);
			this.errors = [];

			if (!parseResult.success && parseResult.issues.length > 0) {
				this.errors = parseResult.issues.map((issue) => issue.message);
				return [true, parseResult.output] as const;
			}

			// We should only call onValidate if the value is not null or undefined and not an empty string when the field is not required
			const shouldCallOnValidate =
				this.required || (value !== null && value !== undefined && value !== '');
			if (this.onValidate && shouldCallOnValidate) {
				this.errors = normalizeErrors(this.onValidate(value as FieldValue<T>));
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
	return field;
};
