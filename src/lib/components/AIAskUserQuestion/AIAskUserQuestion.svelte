<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import Alert from '../Alert/Alert.svelte';
	import Empty from '../Empty/Empty.svelte';
	import Slot from '../Slot/Slot.svelte';
	import Stepper from '../Stepper/Stepper.svelte';
	import AIAskUserQuestionFooter from './AIAskUserQuestionFooter.svelte';
	import AIAskUserQuestionHeader from './AIAskUserQuestionHeader.svelte';
	import AIAskUserQuestionStep from './AIAskUserQuestionStep.svelte';
	import {
		getFirstMissingAIAskQuestionIndex,
		getAIAskQuestionType,
		hasSameAIAskAnswer,
		isAIAskQuestionAnswered,
		toAIAskAnswerList
	} from './aiAskUserQuestionAnswers.js';
	import type {
		AIAskAnswer,
		AIAskAnswers,
		AIAskQuestion,
		AIAskUserQuestionProps,
		AIAskUserQuestionState
	} from './aiAskUserQuestion.props.js';
	import { useAIAskUserQuestionTheme } from './aiAskUserQuestion.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		ref = $bindable<HTMLDivElement | null>(null),
		questions,
		value = $bindable<AIAskAnswers>(),
		defaultValue = {},
		activeIndex = $bindable(0),
		autoAdvance,
		autoAdvanceSingle,
		autoAdvanceDelay,
		autoAdvanceSingleDelay,
		disabled = false,
		submitting = false,
		title,
		requester,
		context,
		submitLabel,
		submittingLabel,
		discardLabel,
		previousLabel,
		nextLabel,
		emptyLabel,
		emptyTitle,
		emptyDescription,
		progressLabel = (active: number, total: number) => `${active}/${total}`,
		requiredMessage,
		onSubmit,
		onDiscard,
		onValueChange,
		question: questionSlot,
		header,
		footer,
		empty,
		children,
		class: className,
		theme,
		...attachments
	}: AIAskUserQuestionProps = $props();
	const t = $derived(useI18n());
	const valueState = createBindableValue(
		() => value,
		(nextValue) => {
			value = nextValue;
		},
		() => defaultValue
	);

	let errorMessage = $state<string>();
	let errorQuestionId = $state<string>();
	let isSubmitting = $state(false);
	let isDiscarding = $state(false);
	let advanceTimer: ReturnType<typeof setTimeout> | undefined;

	const questionItems = $derived<AIAskQuestion[]>(Array.from(questions));
	const resolvedValues = $derived(valueState.value);
	const shouldAutoAdvance = $derived(autoAdvance ?? autoAdvanceSingle ?? true);
	const resolvedAutoAdvanceDelay = $derived(autoAdvanceDelay ?? autoAdvanceSingleDelay ?? 280);
	const resolvedEmptyLabel = $derived(emptyLabel ?? emptyTitle ?? t.aiAskNoQuestions);
	const activeQuestion = $derived(
		questionItems[Math.max(0, Math.min(activeIndex, questionItems.length - 1))]
	);
	const resolvedIsSubmitting = $derived(submitting || isSubmitting);
	const isWorking = $derived(resolvedIsSubmitting || isDiscarding);
	const controlsDisabled = $derived(disabled || isWorking);
	const isFirst = $derived(activeIndex <= 0);
	const isLast = $derived(activeIndex >= questionItems.length - 1);
	const classes = $derived(useAIAskUserQuestionTheme(theme));
	const componentState = $derived<AIAskUserQuestionState>({
		questions: questionItems,
		value: resolvedValues,
		activeIndex,
		activeQuestion,
		error: errorMessage,
		isSubmitting: resolvedIsSubmitting,
		isDiscarding,
		isWorking,
		isFirst,
		isLast,
		goTo,
		previous: () => goTo(activeIndex - 1),
		next: nextOrSubmit,
		submit: submitAnswers,
		discard: discardAnswers
	});

	onDestroy(clearAdvance);

	$effect(() => {
		if (questionItems.length === 0) {
			activeIndex = 0;
			return;
		}
		activeIndex = Math.max(0, Math.min(activeIndex, questionItems.length - 1));
	});

	function setAnswer(questionId: string, answer: AIAskAnswer): void {
		const question = questionItems.find((candidate) => candidate.id === questionId);
		if (!question) throw new Error(`Cannot answer missing AI question "${questionId}".`);
		if (controlsDisabled) return;
		if (hasSameAIAskAnswer(question, resolvedValues[questionId], answer)) return;
		const nextValues = { ...resolvedValues, [questionId]: answer };
		valueState.value = nextValues;
		if (errorQuestionId === questionId && isAIAskQuestionAnswered(question, nextValues)) {
			errorQuestionId = undefined;
			errorMessage = undefined;
		}
		onValueChange?.(nextValues);
		scheduleAdvance(question, answer);
	}

	function goTo(index: number): void {
		clearAdvance();
		if (questionItems.length === 0) {
			activeIndex = 0;
			return;
		}
		activeIndex = Math.max(0, Math.min(index, questionItems.length - 1));
	}

	function scheduleAdvance(question: AIAskQuestion, answer: AIAskAnswer): void {
		clearAdvance();
		if (
			!shouldAutoAdvance ||
			getAIAskQuestionType(question) !== 'single' ||
			typeof answer !== 'string' ||
			answer.length === 0 ||
			isLast ||
			controlsDisabled ||
			activeQuestion?.id !== question.id
		) {
			return;
		}
		const nextIndex = activeIndex + 1;
		advanceTimer = setTimeout(() => goTo(nextIndex), Math.max(0, resolvedAutoAdvanceDelay));
	}

	function clearAdvance(): void {
		if (advanceTimer === undefined) return;
		clearTimeout(advanceTimer);
		advanceTimer = undefined;
	}

	function setQuestionError(questionId: string, message: string): void {
		errorQuestionId = questionId;
		errorMessage = message;
	}

	function resolveRequiredMessage(question: AIAskQuestion): string {
		if (requiredMessage === undefined) return t.aiAskRequired;
		return typeof requiredMessage === 'function' ? requiredMessage(question) : requiredMessage;
	}

	function requireActiveAnswer(): boolean {
		if (!activeQuestion || isAIAskQuestionAnswered(activeQuestion, resolvedValues)) return true;
		setQuestionError(activeQuestion.id, resolveRequiredMessage(activeQuestion));
		return false;
	}

	function nextOrSubmit(): void {
		if (controlsDisabled || !requireActiveAnswer()) return;
		if (!isLast) {
			goTo(activeIndex + 1);
			return;
		}
		void submitAnswers();
	}

	async function submitAnswers(): Promise<void> {
		if (controlsDisabled) return;
		const missingIndex = getFirstMissingAIAskQuestionIndex(questionItems, resolvedValues);
		if (missingIndex >= 0) {
			const missingQuestion = questionItems[missingIndex];
			if (!missingQuestion) throw new Error(`Cannot read AI question at index ${missingIndex}.`);
			goTo(missingIndex);
			setQuestionError(missingQuestion.id, resolveRequiredMessage(missingQuestion));
			return;
		}
		isSubmitting = true;
		errorMessage = undefined;
		errorQuestionId = undefined;
		try {
			await onSubmit?.({
				answers: toAIAskAnswerList(questionItems, resolvedValues),
				values: resolvedValues,
				questions: questionItems
			});
		} catch (error) {
			errorMessage = getErrorMessage(error, 'Unable to submit the answers.');
		} finally {
			isSubmitting = false;
		}
	}

	async function discardAnswers(): Promise<void> {
		if (controlsDisabled || !onDiscard) return;
		isDiscarding = true;
		errorMessage = undefined;
		errorQuestionId = undefined;
		try {
			await onDiscard();
		} catch (error) {
			errorMessage = getErrorMessage(error, 'Unable to discard the questions.');
		} finally {
			isDiscarding = false;
		}
	}

	function getErrorMessage(error: unknown, fallback: string): string {
		return error instanceof Error && error.message ? error.message : fallback;
	}
</script>

<div
	bind:this={ref}
	data-slot="ai-ask-user-question"
	class={classes.root({ className })}
	{...attachments}
>
	{#if questionItems.length === 0}
		{#if empty}
			<Slot render={empty} payload={componentState} />
		{:else}
			<Empty
				bordered
				size="small"
				title={resolvedEmptyLabel}
				description={emptyDescription ?? t.aiAskEmptyDescription}
				class={classes.empty()}
			/>
		{/if}
	{:else}
		{#if header}
			<Slot render={header} payload={componentState} class={classes.header()} />
		{:else}
			<AIAskUserQuestionHeader
				questions={questionItems}
				{activeIndex}
				title={title ?? t.aiAskTitle}
				{requester}
				{context}
				disabled={controlsDisabled}
				{progressLabel}
				onSelect={goTo}
				{theme}
			/>
		{/if}

		<div data-slot="ai-ask-user-question-body" class={classes.body()}>
			{#if children}
				<Slot render={children} payload={componentState} />
			{:else}
				<Stepper
					items={questionItems}
					bind:value={activeIndex}
					panelRole="group"
					panelAriaLabel={({ index }) => progressLabel(index + 1, questionItems.length)}
					panelAriaLabelledby={false}
				>
					{#snippet children({ item })}
						<AIAskUserQuestionStep
							question={item}
							value={resolvedValues[item.id]}
							errorMessage={errorQuestionId === item.id ? errorMessage : undefined}
							disabled={controlsDisabled}
							renderer={questionSlot}
							onValueChange={(answer) => setAnswer(item.id, answer)}
							onError={(message) => setQuestionError(item.id, message)}
							{theme}
						/>
					{/snippet}
				</Stepper>
			{/if}

			{#if errorMessage && !errorQuestionId}
				<Alert color="danger" variant="soft" description={errorMessage} class={classes.error()} />
			{/if}
		</div>

		{#if footer}
			<Slot render={footer} payload={componentState} class={classes.footer()} />
		{:else}
			<AIAskUserQuestionFooter
				{isFirst}
				{isLast}
				disabled={controlsDisabled}
				isSubmitting={resolvedIsSubmitting}
				{isDiscarding}
				canDiscard={Boolean(onDiscard)}
				previousLabel={previousLabel ?? t.aiAskPrevious}
				nextLabel={nextLabel ?? t.aiAskNext}
				submitLabel={submitLabel ?? t.submit}
				submittingLabel={submittingLabel ?? t.aiAskSubmitting}
				discardLabel={discardLabel ?? t.dismiss}
				onPrevious={() => goTo(activeIndex - 1)}
				onNext={() => goTo(activeIndex + 1)}
				onPrimary={nextOrSubmit}
				onDiscard={() => void discardAnswers()}
				{theme}
			/>
		{/if}
	{/if}
</div>
