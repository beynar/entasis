<script lang="ts" generics="I extends MultiStepFormItems">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Stepper from '$lib/components/Stepper/Stepper.svelte';
	import { useCardTheme } from '$lib/components/Card/card.theme.js';
	import type { MultiStepFormItems, MultiStepFormProps } from './multiStepForm.props.js';
	import { useMultiStepFormTheme } from './multiStepForm.theme.js';
	import Form from '../Form/Form.svelte';
	import Meter from '$lib/components/Meter/Meter.svelte';
	import { MultiStepFormState } from './multiStepForm.state.svelte.js';
	import Button from '$lib/components/Button/Button.svelte';
	import { arrowLeftIcon } from '$lib/components/Icons/arrowLeft.js';
	import { arrowRightIcon } from '$lib/components/Icons/arrowRight.js';
	import { arrowCircleUpIcon } from '$lib/components/Icons/arrowCircleUp.js';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import type { ButtonProps } from '$lib/components/Button/button.props.js';
	import { cx } from '$lib/utils/cva/index.js';
	import FormCardSurfaceBoundary from '../Form/FormCardSurfaceBoundary.svelte';

	let {
		items,
		onSubmitForm,
		onSubmitStep,
		children,
		showMeter = true,
		meterColor,
		nextText = 'Next',
		previousText = 'Previous',
		submitText = 'Submit',
		class: className,
		variant = 'plain',
		theme,
		footer,
		header,
		nextButtonProps = {},
		previousButtonProps = {},
		submitButtonProps = {},
		defaultValue = {},
		value = $bindable(),
		onValueChange
	}: MultiStepFormProps<I> = $props();
	const valueState = createBindableValue(
		() => value,
		(nextValue) => {
			value = nextValue;
		},
		() => defaultValue
	);

	let form = new MultiStepFormState({
		get steps() {
			return items;
		},
		get onSubmitForm() {
			return onSubmitForm;
		},
		get onSubmitStep() {
			return onSubmitStep;
		},
		get meterColor() {
			return meterColor;
		},
		get value() {
			return valueState.value;
		},
		set value(nextValue) {
			valueState.value = nextValue;
		},
		get onValueChange() {
			return onValueChange;
		}
	});

	const getButtonConfig = (props: ButtonProps) => {
		const { onclick, disabled, loading, ...forwardedProps } = props;
		return { onclick, disabled, loading, forwardedProps };
	};

	const previousButton = $derived(getButtonConfig(previousButtonProps));
	const nextButton = $derived(getButtonConfig(nextButtonProps));
	const submitButton = $derived(getButtonConfig(submitButtonProps));
	const activeButton = $derived(form.isLastStep ? submitButton : nextButton);

	const goToPreviousStep: NonNullable<ButtonProps['onclick']> = (event) => {
		form.stepper?.previous();
		previousButton.onclick?.(event);
	};

	const submitCurrentStep: NonNullable<ButtonProps['onclick']> = (event) => {
		void form.submit();
		activeButton.onclick?.(event);
	};

	const formTheme = $derived(theme?.form);
	const isCard = $derived(variant === 'card');
	const baseTheme = $derived.by(() => {
		if (!theme) return undefined;
		const base = { ...theme };
		delete base.form;
		return base;
	});
	const classes = $derived(useMultiStepFormTheme(baseTheme));
	const cardClasses = $derived(useCardTheme());
</script>

<div
	data-slot="multi-step-form"
	data-variant={variant}
	data-color={isCard ? 'neutral' : undefined}
	class={cx(
		isCard
			? cardClasses.root({
					color: 'neutral',
					variant: 'solid',
					size: 'normal',
					density: 'normal',
					clickable: false,
					disabled: false
				})
			: undefined,
		classes.root({ variant, className })
	)}
>
	<Slot
		render={header}
		payload={form}
		renderIf={showMeter || !!header}
		class={classes.multiStepFormHeader({ variant })}
	>
		{#if showMeter}
			<Meter value={[form.progress]} steps={form.meterSteps} />
		{/if}
	</Slot>
	<div class={classes.multiStepFormContent()}>
		<Stepper
			bind:api={form.stepper}
			bind:value={form.activeStep}
			{items}
			class={isCard ? '-mx-xl w-auto max-w-none' : undefined}
		>
			{#snippet children({ item, index })}
				<div class={isCard ? 'min-w-0 pb-1' : 'min-w-0'}>
					<FormCardSurfaceBoundary isOwned={isCard}>
						<Form
							inputs={item.inputs}
							onSubmit={() => form.submit()}
							bind:form={() => form.getForm(index), (nextForm) => form.setForm(index, nextForm)}
							bind:value={
								() => form.getStepValue(index), (nextValue) => form.setStepValue(index, nextValue)
							}
							onValueChange={(nextValue) => form.setStepValue(index, nextValue, true)}
							title={item.title}
							description={item.description}
							{variant}
							theme={formTheme}
						/>
					</FormCardSurfaceBoundary>
				</div>
			{/snippet}
		</Stepper>
		{@render children?.(form)}
	</div>
	<Slot render={footer} payload={form} class={classes.multiStepFormFooter({ variant })}>
		<Button
			{...previousButton.forwardedProps}
			prefix={arrowLeftIcon}
			disabled={form.activeStep === 0 || form.loading || previousButton.disabled}
			loading={form.loading || previousButton.loading}
			onclick={goToPreviousStep}
		>
			{previousText}
		</Button>
		<Button
			{...activeButton.forwardedProps}
			suffix={form.isLastStep ? arrowCircleUpIcon : arrowRightIcon}
			disabled={form.loading || activeButton.disabled}
			loading={form.loading || activeButton.loading}
			onclick={submitCurrentStep}
		>
			{form.isLastStep ? submitText : nextText}
		</Button>
	</Slot>
</div>
