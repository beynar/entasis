import { untrack } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { StepperState } from '$lib/components/Stepper/stepper.state.svelte.js';
import type { Colors } from '$lib/types/theme.js';
import type { FormState } from '../Form/form.state.svelte.js';
import {
	flattenFormInputs,
	type FormInputs,
	type FormValueRecord,
	type InferFormValue,
	type LiveFormValue
} from '../Form/form.js';
import type {
	FormStep,
	MergedMultiStepFormInputs,
	MultiStepFormItemWithState,
	MultiStepFormItems,
	MultiStepFormItemsWithState,
	MultiStepFormProps
} from './multiStepForm.props.js';

type MultiStepFormValue<I extends MultiStepFormItems> = LiveFormValue<MergedMultiStepFormInputs<I>>;
type MultiStepSubmitValue<I extends MultiStepFormItems> = InferFormValue<
	MergedMultiStepFormInputs<I>
>;
type MultiStepProgressValue<I extends MultiStepFormItems> = Partial<MultiStepSubmitValue<I>>;
type StepInputs<I extends MultiStepFormItems> = I[number]['inputs'];

type MultiStepFormOptions<I extends MultiStepFormItems> = {
	steps: I & MultiStepFormItemsWithState<I>;
	onSubmitForm?: (value: MultiStepSubmitValue<I>) => Promise<void> | void;
	onSubmitStep?: MultiStepFormProps<I>['onSubmitStep'];
	meterColor?: Colors;
	value?: MultiStepFormValue<I>;
	onValueChange?: (value: MultiStepFormValue<I>) => void;
};

type ValidatedSteps<I extends MultiStepFormItems> = {
	mergedValue: MultiStepProgressValue<I>;
	currentValue: InferFormValue<StepInputs<I>>;
	currentForm: FormState<StepInputs<I>>;
};

const hasOwn = (value: object | undefined, key: string): boolean =>
	value !== undefined && Object.prototype.hasOwnProperty.call(value, key);

const areValuesEqual = (left: object | undefined, right: object): boolean => {
	const leftEntries = Object.entries(left ?? {});
	const rightEntries = Object.entries(right);
	const leftRecord = left as Record<string, unknown> | undefined;
	if (leftEntries.length !== rightEntries.length) return false;
	return rightEntries.every(
		([name, value]) => hasOwn(left, name) && Object.is(leftRecord?.[name], value)
	);
};

export class MultiStepFormState<I extends MultiStepFormItems = FormStep[]> {
	readonly forms = new SvelteMap<number, FormState<FormInputs>>();
	readonly stepValues = new SvelteMap<number, LiveFormValue<FormInputs>>();
	stepper = $state<StepperState<MultiStepFormItemWithState<I>>>();
	activeStep = $state(0);
	loading = $state(false);
	private readonly options!: MultiStepFormOptions<I>;
	private submitPromise: Promise<MultiStepProgressValue<I> | false> | null = null;

	steps = $derived(this.options.steps);
	isLastStep = $derived(this.activeStep === this.steps.length - 1);
	value = $derived.by(() => this.mergeStepValues());
	progress = $derived({
		value: ((this.activeStep + 1) / this.steps.length) * 100,
		color: this.options.meterColor ?? 'neutral'
	});
	meterSteps = $derived(
		this.steps.map((_, index) => ({
			label: '',
			start: (index / this.steps.length) * 100,
			end: ((index + 1) / this.steps.length) * 100,
			color: this.options.meterColor ?? 'neutral'
		}))
	);

	constructor(options: MultiStepFormOptions<I>) {
		this.options = options;
		$effect(() => {
			const steps = this.options.steps;
			const externalValue = this.options.value;
			untrack(() => this.reconcileSteps(steps, externalValue));
		});

		$effect(() => {
			const mergedValue = this.value;
			untrack(() => {
				if (!areValuesEqual(this.options.value, mergedValue)) {
					this.options.value = mergedValue;
				}
			});
		});
	}

	getForm(index: number): FormState<FormInputs> | undefined {
		return this.forms.get(index);
	}

	setForm(index: number, form: FormState<FormInputs> | undefined): void {
		if (!form) {
			this.forms.delete(index);
			return;
		}
		this.forms.set(index, form);
	}

	getStepValue(index: number): LiveFormValue<FormInputs> {
		return this.stepValues.get(index) ?? {};
	}

	setStepValue(index: number, value: LiveFormValue<FormInputs>, notify = false): void {
		const currentValue = this.stepValues.get(index);
		if (!areValuesEqual(currentValue, value)) this.stepValues.set(index, value);
		if (notify) {
			const mergedValue = this.value;
			this.options.value = mergedValue;
			this.options.onValueChange?.(mergedValue);
		}
	}

	submit = (): Promise<MultiStepProgressValue<I> | false> => {
		if (this.submitPromise) return this.submitPromise;

		const submission = this.submitCurrentStep();
		this.submitPromise = submission;
		void submission.then(
			() => {
				if (this.submitPromise === submission) this.submitPromise = null;
			},
			() => {
				if (this.submitPromise === submission) this.submitPromise = null;
			}
		);
		return submission;
	};

	private async submitCurrentStep(): Promise<MultiStepProgressValue<I> | false> {
		try {
			const activeStep = this.getActiveStep();
			const validatedSteps = this.validateThrough(activeStep);
			if (validatedSteps === false) return false;

			this.loading = true;
			if (activeStep === this.steps.length - 1) {
				const finalValue = validatedSteps.mergedValue as MultiStepSubmitValue<I>;
				await this.options.onSubmitForm?.(finalValue);
				return finalValue;
			}

			const step = this.steps[activeStep];
			const onBeforeChange = (step as FormStep<StepInputs<I>>).onBeforeChange;
			let canContinue = onBeforeChange === undefined;
			if (onBeforeChange) {
				await onBeforeChange({
					value: validatedSteps.currentValue,
					form: validatedSteps.currentForm,
					next: () => {
						canContinue = true;
					}
				});
			}

			if (!canContinue) return validatedSteps.mergedValue;
			const shouldContinue = await this.options.onSubmitStep?.({
				value: validatedSteps.mergedValue,
				step,
				index: activeStep
			});
			if (shouldContinue !== false) this.stepper?.next();
			return validatedSteps.mergedValue;
		} finally {
			this.loading = false;
		}
	}

	private validateThrough(activeStep: number): ValidatedSteps<I> | false {
		const mergedValue: FormValueRecord = {};
		let currentValue: InferFormValue<StepInputs<I>> | undefined;
		let currentForm: FormState<StepInputs<I>> | undefined;

		for (let index = 0; index <= activeStep; index += 1) {
			const form = this.getForm(index);
			if (!form) throw new Error(`MultiStepForm step ${index + 1} is not registered.`);

			const stepValue = form.validate();
			if (stepValue === false) return false;
			Object.assign(mergedValue, stepValue);
			if (index === activeStep) {
				// The form is registered and read through the same checked step index.
				currentValue = stepValue as unknown as InferFormValue<StepInputs<I>>;
				currentForm = form as unknown as FormState<StepInputs<I>>;
			}
		}

		if (!currentValue || !currentForm) {
			throw new Error('MultiStepForm could not resolve the active form.');
		}

		return {
			mergedValue: mergedValue as MultiStepProgressValue<I>,
			currentValue,
			currentForm
		};
	}

	private reconcileSteps(steps: I, externalValue: MultiStepFormValue<I> | undefined): void {
		if (steps.length === 0) throw new Error('MultiStepForm requires at least one step.');

		const fieldOwners = new SvelteMap<string, number>();
		const externalRecord = externalValue as FormValueRecord | undefined;
		steps.forEach((step, index) => {
			const previousValue = this.stepValues.get(index);
			const currentValue: FormValueRecord = {};
			for (const { name } of flattenFormInputs(step.inputs)) {
				const ownerStepIndex = fieldOwners.get(name);
				if (ownerStepIndex !== undefined && ownerStepIndex !== index) {
					throw new Error(`MultiStepForm field "${name}" is defined in more than one step.`);
				}
				fieldOwners.set(name, index);
				if (hasOwn(externalValue, name)) currentValue[name] = externalRecord?.[name];
			}
			if (!areValuesEqual(previousValue, currentValue)) {
				this.stepValues.set(index, currentValue as LiveFormValue<FormInputs>);
			}
		});

		for (const index of this.stepValues.keys()) {
			if (index < steps.length) continue;
			this.stepValues.delete(index);
			this.forms.delete(index);
		}
	}

	private mergeStepValues(): MultiStepFormValue<I> {
		const mergedValue: FormValueRecord = {};
		for (let index = 0; index < this.steps.length; index += 1) {
			Object.assign(mergedValue, this.stepValues.get(index));
		}
		return mergedValue as MultiStepFormValue<I>;
	}

	private getActiveStep(): number {
		const activeStep = this.activeStep;
		if (activeStep < 0 || activeStep >= this.steps.length) {
			throw new Error(`MultiStepForm active step ${activeStep} is out of range.`);
		}
		return activeStep;
	}
}
