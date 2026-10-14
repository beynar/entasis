import { setContext, tick, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { FieldState, ValidationMode } from '../Field/field.state.svelte.js';
import type { FieldType, FieldValue, InputType } from '../Field/field.js';
import type {
	FlatFormField,
	FormErrors,
	FormGroup,
	FormInputs,
	FormRenderableInput,
	FormSubmitHandler,
	FormValueRecord,
	InferFormValue,
	LiveFormValue
} from './form.js';
import { flattenFormInputs, getFormValueInputType } from './form.js';
import { getFormInputDefinition } from './form.registry.js';
import { isFieldVisible } from './visibility.js';

type FormStateOptions<I extends FormInputs> = {
	inputs: I;
	onSubmit?: FormSubmitHandler<I>;
	value?: LiveFormValue<I>;
	onValueChange?: (value: LiveFormValue<I>) => void;
	validationMode?: ValidationMode;
	validationDebounce?: number;
	errors?: FormErrors<I>;
};

/** Options for `FormState.validate` and `validateAsync`. */
export type FormValidateOptions = {
	/**
	 * Whether a failed validation scrolls to and focuses the first invalid field, and whether the
	 * call counts as a submit attempt. Pass `false` to check quietly. Defaults to `true`.
	 */
	reveal?: boolean;
};

/** What one validation pass over the visible, enabled fields found. */
type ValidationPass = {
	value: FormValueRecord;
	firstErrored: RegisteredField | null;
	/** Fields whose async validators have not settled. */
	validating: RegisteredField[];
	/** The raw value each field held when it was validated. */
	snapshot: [RegisteredField, unknown][];
};

const toMessages = (messages: string | string[] | null | undefined): string[] =>
	(Array.isArray(messages) ? messages : messages ? [messages] : []).filter(
		(message) => typeof message === 'string' && message !== ''
	);

type RegisteredField = FieldState<FieldType>;

type NavigableField = {
	field: RegisteredField;
	focusTarget: HTMLElement;
};

const focusableControl =
	'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const enterNavigationInputTypes = new Set([
	'text',
	'search',
	'email',
	'url',
	'password',
	'number',
	'tel',
	'date',
	'datetime-local',
	'time',
	'month',
	'week'
]);

const supportedInputTypes = new Set<InputType>([
	'file',
	'files',
	'slider-range',
	'datetime',
	'date',
	'color',
	'number',
	'rating',
	'voice',
	'slider',
	'time',
	'text',
	'password',
	'email',
	'url',
	'textarea',
	'phone',
	'rich-text',
	'switch',
	'checkbox',
	'checkboxes',
	'tag',
	'tag-group',
	'keyvalue',
	'pin',
	'select',
	'select-multiple',
	'radio',
	'combobox',
	'calendar',
	'calendar-range'
]);

const hasOwn = (value: object | undefined, key: string): boolean =>
	value !== undefined && Object.prototype.hasOwnProperty.call(value, key);

const areValuesEqual = (left: LiveFormValue<FormInputs> | undefined, right: object): boolean => {
	const leftEntries = Object.entries(left ?? {});
	const rightEntries = Object.entries(right);
	if (leftEntries.length !== rightEntries.length) return false;
	return rightEntries.every(
		([name, value]) => hasOwn(left, name) && Object.is(left?.[name], value)
	);
};

export class FormState<I extends FormInputs = FormInputs> {
	readonly fields = new SvelteMap<string, RegisteredField>();
	loading = $state(false);
	hasError = $state(false);
	private valueCache = $state<FormValueRecord>({});
	private configuredValues = new SvelteMap<string, FieldValue<FieldType> | null | undefined>();
	private defaultValues = new SvelteMap<string, FieldValue<FieldType> | null | undefined>();
	private initialValues = new SvelteMap<string, FieldValue<FieldType> | null | undefined>();
	private publishedValue: LiveFormValue<I> | undefined;
	private submitPromise: Promise<InferFormValue<I> | false> | null = null;
	// Server errors by field name, kept for fields that register after they were set.
	private externalErrors = new SvelteMap<string, string[]>();
	private revealAfterSubmit = false;
	private revealFieldAfterSubmit: RegisteredField | null = null;
	/** How many times the form was validated to submit; fields re-validate on edit after the first. */
	submitCount = $state(0);

	value = $derived.by(() => this.getVisibleValue());

	/** When fields validate by themselves; a field's own `validationMode` takes precedence. */
	get validationMode(): ValidationMode {
		return this.options.validationMode ?? 'submit';
	}

	/** Milliseconds an edit waits before the validation it triggers; a field's own value wins. */
	get validationDebounce(): number {
		return this.options.validationDebounce ?? 0;
	}

	/** True when any field differs from its initial value. */
	get dirty(): boolean {
		for (const field of this.fields.values()) if (field.dirty) return true;
		return false;
	}

	/** True when focus has entered and left any field. */
	get touched(): boolean {
		for (const field of this.fields.values()) if (field.touched) return true;
		return false;
	}

	/** True while an async validator of any field is pending. */
	get validating(): boolean {
		for (const field of this.fields.values()) if (field.validating) return true;
		return false;
	}

	constructor(private readonly options: FormStateOptions<I>) {
		let appliedErrors = false;
		$effect(() => {
			const errors = this.options.errors;
			untrack(() => {
				// Mounting with errors shows them without taking focus; later ones reveal the first.
				if (errors === undefined && !appliedErrors) return;
				this.applyExternalErrors(errors, appliedErrors);
				appliedErrors = true;
			});
		});

		$effect(() => {
			const inputs = this.options.inputs;
			const externalValue = this.options.value;
			untrack(() => {
				const isExternalUpdate =
					this.publishedValue !== undefined && !areValuesEqual(externalValue, this.publishedValue);
				this.reconcileInputs(inputs, externalValue, isExternalUpdate);
			});
		});

		$effect(() => {
			const visibleValue = this.value;
			untrack(() => {
				this.publishedValue = visibleValue;
				if (!areValuesEqual(this.options.value, visibleValue)) {
					this.options.value = visibleValue;
				}
			});
		});
	}

	registerField<T extends FieldType>(field: FieldState<T>): () => void {
		const existingField = this.fields.get(field.name);
		if (existingField && existingField !== field) {
			throw new Error(`Form field "${field.name}" is already registered.`);
		}

		if (!this.defaultValues.has(field.name)) {
			this.defaultValues.set(field.name, field.value);
		}

		if (hasOwn(this.valueCache, field.name)) {
			const cachedValue = this.valueCache[field.name];
			if (!Object.is(field.value, cachedValue)) {
				field.syncValue(cachedValue as FieldValue<T> | null);
			}
		} else {
			this.setCachedValue(field.name, field.value);
		}

		const registeredField = field as RegisteredField;
		this.fields.set(field.name, registeredField);
		const serverErrors = this.externalErrors.get(field.name);
		if (serverErrors) field.setExternalErrors(serverErrors);

		return () => {
			if (this.fields.get(field.name) !== registeredField) return;
			if (field.initialValue !== undefined) this.initialValues.set(field.name, field.initialValue);
			if (this.getFieldDefinition(field.name)) this.setCachedValue(field.name, field.value);
			else this.removeCachedValue(field.name);
			this.fields.delete(field.name);
		};
	}

	updateFieldValue<T extends FieldType>(field: FieldState<T>, notify = false): void {
		if (this.fields.get(field.name) !== (field as RegisteredField)) return;
		const previousValue = this.value;
		this.setCachedValue(field.name, field.value);
		const visibleValue = this.value;
		if (!notify || areValuesEqual(previousValue, visibleValue)) return;
		this.publishedValue = visibleValue;
		this.options.value = visibleValue;
		this.options.onValueChange?.(visibleValue);
	}

	keyboardNavigation: Attachment<HTMLElement> = (node) => on(node, 'keydown', this.handleKeydown);

	private handleKeydown = (event: KeyboardEvent): void => {
		if (!this.isEnterNavigationEvent(event)) return;

		const target = event.target as Node;
		const navigableFields = this.getNavigableFields();
		const currentIndex = navigableFields.findIndex(({ field }) => field.rootNode?.contains(target));
		if (currentIndex === -1) return;

		event.preventDefault();
		this.advance(navigableFields, currentIndex);
	};

	/**
	 * Moves on from `field` as Enter does in a text field: the last navigable field submits the
	 * form; any other field validates and, when valid, hands focus to the next field, or keeps it
	 * while invalid. Controls that do not reach Form's Enter handling (checkboxes, radios) call it
	 * from their own Enter key. Returns false when `field` is not a visible, enabled field of this
	 * form, so the caller can fall back to the native behaviour.
	 */
	advanceFrom = <T extends FieldType>(field: FieldState<T>): boolean => {
		const navigableFields = this.getNavigableFields();
		const currentIndex = navigableFields.findIndex(
			(entry) => entry.field === (field as RegisteredField)
		);
		if (currentIndex === -1) return false;
		this.advance(navigableFields, currentIndex);
		return true;
	};

	private advance(navigableFields: NavigableField[], currentIndex: number): void {
		if (currentIndex === navigableFields.length - 1) {
			void this.submit();
			return;
		}

		const currentField = navigableFields[currentIndex];
		const [hasError] = currentField.field.validate();
		if (hasError) {
			currentField.focusTarget.focus();
			return;
		}

		const moveOn = () => {
			if (currentField.field.hasValidationError) currentField.focusTarget.focus();
			else navigableFields[currentIndex + 1]?.focusTarget.focus();
		};
		// An async validator decides before focus moves on.
		if (currentField.field.validating) void currentField.field.settle().then(moveOn);
		else moveOn();
	}

	isInputVisible(name: string): boolean {
		return this.getActiveFieldDefinitions().some((field) => field.name === name);
	}

	isFieldVisible(input: FormRenderableInput, group?: FormGroup): boolean {
		return (
			(!group || isFieldVisible(group, this.valueCache)) && isFieldVisible(input, this.valueCache)
		);
	}

	isGroupVisible(group: FormGroup): boolean {
		return isFieldVisible(group, this.valueCache);
	}

	/**
	 * Validates every visible, enabled field synchronously and returns the validated value, or
	 * false after revealing the first invalid field. Disabled fields are skipped and left out of
	 * the value. It does not wait for async validators: use `validateAsync` or `submit` for those.
	 */
	validate = (options: FormValidateOptions = {}): InferFormValue<I> | false => {
		const reveal = options.reveal !== false;
		if (reveal) this.submitCount += 1;
		const pass = this.collect();
		if (pass.firstErrored) return this.fail(pass.firstErrored, reveal);
		this.hasError = false;
		return pass.value as InferFormValue<I>;
	};

	/** Like `validate`, and waits for the async validators of every field to settle. */
	validateAsync = async (options: FormValidateOptions = {}): Promise<InferFormValue<I> | false> =>
		this.validateStaged(options);

	/**
	 * @internal `validate` that returns a promise only when an async validator is pending, for
	 * callers that must keep their synchronous timing otherwise.
	 */
	validateStaged = (
		options: FormValidateOptions = {}
	): InferFormValue<I> | false | Promise<InferFormValue<I> | false> => {
		const reveal = options.reveal !== false;
		if (reveal) this.submitCount += 1;
		return this.stage(reveal);
	};

	/**
	 * Validates one field now and returns whether it is valid. A field that is not a visible
	 * field of this form reads as invalid; a disabled one skips validation and reads as valid.
	 * A field whose async validator is still running reads as invalid: use `validateAsync` to wait.
	 * It neither scrolls nor focuses, and does not count as a submit attempt.
	 */
	validateField = (name: string): boolean => {
		const field = this.fields.get(name);
		if (!field || !this.isInputVisible(name)) return false;
		const [hasError] = field.validate();
		// A pending async validator has not accepted the value yet.
		return !hasError && !field.validating;
	};

	submit = (): Promise<InferFormValue<I> | false> => {
		if (this.submitPromise) return this.submitPromise;

		this.submitCount += 1;
		const staged = this.stage(true);
		if (!(staged instanceof Promise)) {
			if (staged === false) return Promise.resolve(false);
			this.submitPromise = this.submitValidatedValue(staged);
			return this.submitPromise;
		}

		// Async validators are pending: the form is busy until they settle and the handler ran.
		this.submitPromise = (async () => {
			this.loading = true;
			try {
				const value = await staged;
				if (value === false) return false as const;
				return await this.submitValidatedValue(value);
			} finally {
				this.loading = false;
				this.submitPromise = null;
				const invalid = this.revealFieldAfterSubmit;
				this.revealFieldAfterSubmit = null;
				if (invalid) void tick().then(() => this.revealField(invalid));
			}
		})();
		return this.submitPromise;
	};

	/**
	 * Shows errors from outside the form, a server response say, under their fields. They replace
	 * the errors set before, survive validation and clear when the field's value next changes.
	 * Keys are field names; a value is a message or a list of them. Reveals the first field in
	 * render order that has one.
	 */
	setErrors(errors: FormErrors<I> | null | undefined): void {
		this.applyExternalErrors(errors, true);
	}

	/**
	 * Restores every field to its initial value, or to `value` where it gives one, and makes that
	 * the new baseline: errors, touched, dirty and the submit count clear, and fields do not
	 * report the change as an edit. The form's `onValueChange` runs once if the visible value
	 * changed.
	 */
	reset(value?: LiveFormValue<I>): void {
		const previousValue = this.value;
		const given = value as FormValueRecord | undefined;
		const nextCache = { ...this.valueCache };
		const restored: [RegisteredField, FieldValue<FieldType> | null | undefined][] = [];

		for (const { name } of flattenFormInputs(this.options.inputs)) {
			const field = this.fields.get(name);
			let next: FieldValue<FieldType> | null | undefined;
			if (given && hasOwn(given, name)) {
				next = given[name];
				this.initialValues.set(name, next);
				this.defaultValues.set(name, next);
			} else if (field && field.initialValue !== undefined) {
				next = field.initialValue;
			} else if (this.initialValues.has(name)) {
				next = this.initialValues.get(name);
			} else if (this.defaultValues.has(name)) {
				next = this.defaultValues.get(name);
			} else {
				continue;
			}
			nextCache[name] = next;
			if (field) restored.push([field, next]);
		}

		this.externalErrors.clear();
		this.revealAfterSubmit = false;
		this.valueCache = nextCache;
		for (const [field, next] of restored) field.reset(next);
		this.submitCount = 0;
		this.hasError = false;

		const nextValue = this.value;
		if (areValuesEqual(previousValue, nextValue)) return;
		this.publishedValue = nextValue;
		this.options.value = nextValue;
		this.options.onValueChange?.(nextValue);
	}

	/** @internal A field whose value changed drops its server errors from the form's record. */
	forgetExternalErrors(name: string): void {
		this.externalErrors.delete(name);
	}

	private applyExternalErrors(errors: FormErrors<I> | null | undefined, reveal: boolean): void {
		const next = new SvelteMap<string, string[]>();
		for (const [name, messages] of Object.entries(errors ?? {})) {
			const list = toMessages(messages as string | string[] | null | undefined);
			if (list.length > 0) next.set(name, list);
		}
		this.externalErrors = next;
		for (const field of this.fields.values()) field.setExternalErrors(next.get(field.name));
		if (next.size === 0) return;
		this.hasError = true;
		if (!reveal) return;
		// A form that disables itself while submitting cannot focus yet: reveal once it is done.
		if (this.loading) this.revealAfterSubmit = true;
		else this.revealExternalErrors();
	}

	private revealExternalErrors(): void {
		for (const definition of this.getActiveFieldDefinitions()) {
			const field = this.fields.get(definition.name);
			if (field && field.externalErrors.length > 0 && !field.disabled) {
				this.revealField(field);
				return;
			}
		}
	}

	// One validation pass, in render order: disabled fields are skipped, as in a native form.
	private collect(): ValidationPass {
		const pass: ValidationPass = { value: {}, firstErrored: null, validating: [], snapshot: [] };

		for (const definition of this.getActiveFieldDefinitions()) {
			const field = this.fields.get(definition.name);
			if (!field) {
				throw new Error(`Form field "${definition.name}" is visible but not registered.`);
			}
			if (field.disabled) continue;

			pass.snapshot.push([field, field.value]);
			const [hasFieldError, parsedValue] = field.validate();
			if (hasFieldError) {
				pass.firstErrored ??= field;
				continue;
			}
			if (field.validating) pass.validating.push(field);
			pass.value[definition.name] = parsedValue as FieldValue<FieldType> | null;
		}

		return pass;
	}

	private fail(field: RegisteredField, reveal: boolean): false {
		this.hasError = true;
		// A form that disables itself while submitting cannot focus yet: reveal once it is done.
		if (reveal && this.loading && field.disabled) this.revealFieldAfterSubmit = field;
		else if (reveal) this.revealField(field);
		return false;
	}

	// The fields the pass validated, in render order: a form that disables itself while it
	// submits must still honour what their validators decided.
	private firstInvalidField(pass: ValidationPass): RegisteredField | null {
		for (const [field] of pass.snapshot) {
			if (field.hasValidationError) return field;
		}
		return null;
	}

	// A validation pass that returns at once when no async validator is pending, so a plain form
	// keeps validating and submitting synchronously.
	private stage(
		reveal: boolean,
		attempt = 0
	): InferFormValue<I> | false | Promise<InferFormValue<I> | false> {
		const pass = this.collect();
		if (pass.firstErrored) {
			// An async field that renders before the sync error may still turn out invalid: it
			// leads, so focus waits for its result.
			const order = pass.snapshot.map(([field]) => field);
			const errorIndex = order.indexOf(pass.firstErrored);
			const earlier = pass.validating.filter((field) => order.indexOf(field) < errorIndex);
			if (earlier.length === 0) return this.fail(pass.firstErrored, reveal);
			const firstErrored = pass.firstErrored;
			return Promise.all(earlier.map((field) => field.settle())).then(() =>
				this.fail(this.firstInvalidField(pass) ?? firstErrored, reveal)
			);
		}
		if (pass.validating.length === 0) {
			this.hasError = false;
			return pass.value as InferFormValue<I>;
		}

		return Promise.all(pass.validating.map((field) => field.settle())).then(() => {
			const invalid = this.firstInvalidField(pass);
			if (invalid) return this.fail(invalid, reveal);
			// A field edited while the validators ran is validated again before the value is used.
			const edited = pass.snapshot.some(([field, value]) => !Object.is(field.value, value));
			if (edited && attempt < 2) return this.stage(reveal, attempt + 1);
			this.hasError = false;
			return pass.value as InferFormValue<I>;
		});
	}

	private async submitValidatedValue(
		validatedValue: InferFormValue<I>
	): Promise<InferFormValue<I>> {
		this.loading = true;
		try {
			await this.options.onSubmit?.(validatedValue);
			return validatedValue;
		} finally {
			this.loading = false;
			this.submitPromise = null;
			if (this.revealAfterSubmit) {
				this.revealAfterSubmit = false;
				void tick().then(() => this.revealExternalErrors());
			}
		}
	}

	private reconcileInputs(
		inputs: I,
		externalValue: LiveFormValue<I> | undefined,
		isExternalUpdate: boolean
	): void {
		const definitions = flattenFormInputs(inputs);
		const inputNames = new SvelteSet(definitions.map(({ name }) => name));
		const externalRecord = externalValue as FormValueRecord | undefined;
		const nextCache = { ...this.valueCache };
		let hasCacheChange = false;

		for (const cachedName of Object.keys(nextCache)) {
			if (inputNames.has(cachedName)) continue;
			delete nextCache[cachedName];
			this.configuredValues.delete(cachedName);
			this.defaultValues.delete(cachedName);
			hasCacheChange = true;
		}

		for (const { name, input } of definitions) {
			const inputType = getFormValueInputType(input);
			if (!supportedInputTypes.has(inputType as InputType) && !getFormInputDefinition(inputType)) {
				throw new Error(
					`Form field "${name}" uses unsupported input type "${String(inputType)}". Register app-defined types with registerFormInputs().`
				);
			}

			if (!hasOwn(externalValue, name)) continue;
			const nextValue = externalRecord?.[name];
			const field = this.fields.get(name);
			if (field && !Object.is(field.value, nextValue)) {
				field.syncValue(nextValue);
			}
			if (Object.is(nextCache[name], nextValue)) continue;
			nextCache[name] = nextValue;
			hasCacheChange = true;
		}

		const definitionsByName = new SvelteMap<string, FlatFormField[]>();
		for (const definition of definitions) {
			const matchingDefinitions = definitionsByName.get(definition.name) ?? [];
			matchingDefinitions.push(definition);
			definitionsByName.set(definition.name, matchingDefinitions);
		}

		const activeDefinitionsByName = new SvelteMap<string, FlatFormField>();
		const previouslyVisibleNames = new SvelteSet<string>();
		for (const [name, matchingDefinitions] of definitionsByName) {
			const activeDefinitions = matchingDefinitions.filter(({ input, group }) =>
				this.isFieldVisibleForValue(input, group, nextCache)
			);
			if (activeDefinitions.length > 1) {
				throw new Error(
					`Form field "${name}" is active more than once (${activeDefinitions
						.map(({ path }) => `"${path}"`)
						.join(' and ')}).`
				);
			}
			if (activeDefinitions[0]) activeDefinitionsByName.set(name, activeDefinitions[0]);
			if (
				matchingDefinitions.some(({ input, group }) =>
					this.isFieldVisibleForValue(input, group, this.valueCache)
				)
			) {
				previouslyVisibleNames.add(name);
			}
		}

		for (const [name, matchingDefinitions] of definitionsByName) {
			const activeDefinition = activeDefinitionsByName.get(name);
			const definition = activeDefinition ?? matchingDefinitions[0];
			const { input } = definition;
			const hasConfiguredValue = hasOwn(input, 'value');
			const configuredValue = hasConfiguredValue ? input.value : undefined;
			const hasDefaultValue = hasOwn(input, 'defaultValue');
			const defaultValue = hasDefaultValue ? input.defaultValue : undefined;
			const previousConfiguredValue = this.configuredValues.get(name);
			const configuredValueChanged =
				this.configuredValues.has(name) && !Object.is(previousConfiguredValue, configuredValue);

			if (activeDefinition || matchingDefinitions.length === 1) {
				if (hasConfiguredValue) this.configuredValues.set(name, configuredValue);
				else this.configuredValues.delete(name);
			}

			let nextValue: FieldValue<FieldType> | null | undefined;
			let shouldApplyValue = false;
			if (hasOwn(externalValue, name)) {
				nextValue = externalRecord?.[name];
				shouldApplyValue = true;
			} else if (isExternalUpdate && activeDefinition && previouslyVisibleNames.has(name)) {
				nextValue = hasConfiguredValue
					? configuredValue
					: this.defaultValues.has(name)
						? this.defaultValues.get(name)
						: defaultValue;
				shouldApplyValue = true;
			} else if (!hasOwn(nextCache, name) && (hasConfiguredValue || hasDefaultValue)) {
				nextValue = hasConfiguredValue ? configuredValue : defaultValue;
				shouldApplyValue = true;
			} else if (activeDefinition && configuredValueChanged) {
				nextValue = configuredValue;
				shouldApplyValue = true;
			}

			if (!shouldApplyValue || Object.is(nextCache[name], nextValue)) continue;
			nextCache[name] = nextValue;
			hasCacheChange = true;
			const field = this.fields.get(name);
			if (field && !Object.is(field.value, nextValue)) {
				field.syncValue(nextValue);
			}
		}

		if (hasCacheChange) this.valueCache = nextCache;
	}

	private getVisibleValue(): LiveFormValue<I> {
		const visibleValue: FormValueRecord = {};
		for (const definition of this.getActiveFieldDefinitions()) {
			if (!hasOwn(this.valueCache, definition.name)) {
				continue;
			}
			visibleValue[definition.name] = this.valueCache[definition.name];
		}
		return visibleValue as LiveFormValue<I>;
	}

	private getFieldDefinition(name: string): FlatFormField | undefined {
		const definitions = flattenFormInputs(this.options.inputs).filter(
			(field) => field.name === name
		);
		return (
			definitions.find((definition) => this.isFieldDefinitionVisible(definition)) ?? definitions[0]
		);
	}

	private getActiveFieldDefinitions(value = this.valueCache): FlatFormField[] {
		const activeFields: FlatFormField[] = [];
		const activePaths = new SvelteMap<string, string>();
		for (const definition of flattenFormInputs(this.options.inputs)) {
			if (!this.isFieldVisibleForValue(definition.input, definition.group, value)) continue;
			const existingPath = activePaths.get(definition.name);
			if (existingPath) {
				throw new Error(
					`Form field "${definition.name}" is active more than once ("${existingPath}" and "${definition.path}").`
				);
			}
			activePaths.set(definition.name, definition.path);
			activeFields.push(definition);
		}
		return activeFields;
	}

	private isFieldDefinitionVisible({ input, group }: FlatFormField): boolean {
		return this.isFieldVisible(input, group);
	}

	private isFieldVisibleForValue(
		input: FormRenderableInput,
		group: FormGroup | undefined,
		value: FormValueRecord
	): boolean {
		return (!group || isFieldVisible(group, value)) && isFieldVisible(input, value);
	}

	private setCachedValue(name: string, value: FieldValue<FieldType> | null | undefined): void {
		if (hasOwn(this.valueCache, name) && Object.is(this.valueCache[name], value)) return;
		this.valueCache = { ...this.valueCache, [name]: value };
	}

	private removeCachedValue(name: string): void {
		if (!hasOwn(this.valueCache, name)) return;
		const nextCache = { ...this.valueCache };
		delete nextCache[name];
		this.valueCache = nextCache;
		this.configuredValues.delete(name);
		this.defaultValues.delete(name);
	}

	private revealField(field: RegisteredField): void {
		const focusTarget = this.getFieldFocusTarget(field);
		const scrollTarget = field.rootNode ?? focusTarget;
		scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		focusTarget?.focus({ preventScroll: true });
	}

	private getNavigableFields(): NavigableField[] {
		const navigableFields: NavigableField[] = [];
		for (const definition of this.getActiveFieldDefinitions()) {
			const field = this.fields.get(definition.name);
			if (!field || field.disabled) continue;
			const focusTarget = this.getFieldFocusTarget(field);
			if (focusTarget) navigableFields.push({ field, focusTarget });
		}
		return navigableFields;
	}

	private getFieldFocusTarget(field: RegisteredField): HTMLElement | null {
		// A roving group (radios) has one Tab stop, the checked option, which is where focus belongs.
		return (
			field.node ??
			field.rootNode?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]:not([disabled])') ??
			field.rootNode?.querySelector<HTMLElement>(focusableControl) ??
			null
		);
	}

	private isEnterNavigationEvent(event: KeyboardEvent): boolean {
		if (
			event.key !== 'Enter' ||
			event.defaultPrevented ||
			event.repeat ||
			event.isComposing ||
			event.shiftKey ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey
		) {
			return false;
		}

		const target = event.target;
		return (
			target instanceof HTMLInputElement &&
			!target.disabled &&
			!target.readOnly &&
			enterNavigationInputTypes.has(target.type)
		);
	}
}

export const useForm = <I extends FormInputs>(options: FormStateOptions<I>): FormState<I> => {
	const form = new FormState(options);
	setContext('form', form);
	return form;
};
