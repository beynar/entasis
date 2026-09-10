import { setContext, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { FieldState } from '../Field/field.state.svelte.js';
import type { FieldValue, InputType } from '../Field/field.js';
import type {
	FlatFormField,
	FormGroup,
	FormInputs,
	FormRenderableInput,
	FormSubmitHandler,
	FormValueRecord,
	InferFormValue,
	LiveFormValue
} from './form.js';
import { flattenFormInputs, getFormValueInputType } from './form.js';
import { isFieldVisible } from './visibility.js';

type FormStateOptions<I extends FormInputs> = {
	inputs: I;
	onSubmit?: FormSubmitHandler<I>;
	value?: LiveFormValue<I>;
	onValueChange?: (value: LiveFormValue<I>) => void;
};

type RegisteredField = FieldState<InputType>;

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
	private configuredValues = new SvelteMap<string, FieldValue<InputType> | null | undefined>();
	private defaultValues = new SvelteMap<string, FieldValue<InputType> | null | undefined>();
	private publishedValue: LiveFormValue<I> | undefined;
	private submitPromise: Promise<InferFormValue<I> | false> | null = null;

	value = $derived.by(() => this.getVisibleValue());

	constructor(private readonly options: FormStateOptions<I>) {
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

	registerField<T extends InputType>(field: FieldState<T>): () => void {
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

		return () => {
			if (this.fields.get(field.name) !== registeredField) return;
			if (this.getFieldDefinition(field.name)) this.setCachedValue(field.name, field.value);
			else this.removeCachedValue(field.name);
			this.fields.delete(field.name);
		};
	}

	updateFieldValue<T extends InputType>(field: FieldState<T>, notify = false): void {
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
		const lastFieldIndex = navigableFields.length - 1;
		if (currentIndex === lastFieldIndex) {
			void this.submit();
			return;
		}

		const currentField = navigableFields[currentIndex];
		const [hasError] = currentField.field.validate();
		if (hasError) {
			currentField.focusTarget.focus();
			return;
		}

		navigableFields[currentIndex + 1]?.focusTarget.focus();
	};

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

	validate = (): InferFormValue<I> | false => {
		let firstErroredField: RegisteredField | null = null;
		const validatedValue: FormValueRecord = {};

		for (const definition of this.getActiveFieldDefinitions()) {
			const field = this.fields.get(definition.name);
			if (!field) {
				throw new Error(`Form field "${definition.name}" is visible but not registered.`);
			}

			const [hasFieldError, parsedValue] = field.validate();
			if (hasFieldError) {
				firstErroredField ??= field;
				continue;
			}
			validatedValue[definition.name] = parsedValue as FieldValue<InputType> | null;
		}

		this.hasError = firstErroredField !== null;
		if (firstErroredField) {
			this.revealField(firstErroredField);
			return false;
		}

		return validatedValue as InferFormValue<I>;
	};

	submit = (): Promise<InferFormValue<I> | false> => {
		if (this.submitPromise) return this.submitPromise;

		const validatedValue = this.validate();
		if (validatedValue === false) return Promise.resolve(false);

		this.submitPromise = this.submitValidatedValue(validatedValue);
		return this.submitPromise;
	};

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
			if (!supportedInputTypes.has(inputType)) {
				throw new Error(`Form field "${name}" uses unsupported input type "${String(inputType)}".`);
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

			let nextValue: FieldValue<InputType> | null | undefined;
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

	private setCachedValue(name: string, value: FieldValue<InputType> | null | undefined): void {
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
		return field.node ?? field.rootNode?.querySelector<HTMLElement>(focusableControl) ?? null;
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
