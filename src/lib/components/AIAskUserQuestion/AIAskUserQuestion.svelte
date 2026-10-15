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
		hasAIAskAnswer,
		hasSameAIAskAnswer,
		isAIAskQuestionAnswered,
		isAIAskQuestionRequired,
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
		// Deprecated and no longer rendered; destructured so it never lands on the root element.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		previousLabel,
		nextLabel,
		skipLabel,
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
		onkeydown: onKeydownProp,
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
	// Default question steps, keyed by question id, so number keys can pick their options.
	const steps: Record<string, { pickOption: (position: number) => boolean } | undefined> = {};

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
	const canSkip = $derived(
		Boolean(
			activeQuestion &&
			!isAIAskQuestionRequired(activeQuestion) &&
			!hasAIAskAnswer(activeQuestion, resolvedValues)
		)
	);
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
			question.type !== 'single' ||
			typeof answer !== 'string' ||
			// Only a picked option advances; typing an "Other…" answer must not.
			!question.options.some((option) => option.id === answer) ||
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
			errorMessage = getErrorMessage(error, t.aiAskSubmitFailed);
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
			errorMessage = getErrorMessage(error, t.aiAskDiscardFailed);
		} finally {
			isDiscarding = false;
		}
	}

	function getErrorMessage(error: unknown, fallback: string): string {
		return error instanceof Error && error.message ? error.message : fallback;
	}

	function isTextEntry(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true;
		return (
			target instanceof HTMLInputElement &&
			!['radio', 'checkbox', 'button', 'submit', 'reset', 'file'].includes(target.type)
		);
	}

	function isChoice(target: EventTarget | null): boolean {
		return target instanceof Element && target.closest('[role="radio"],[role="checkbox"]') !== null;
	}

	// Number keys 1–9 pick the active question's options (Other… comes last); Enter continues or
	// submits from a choice or a one-line field, and Ctrl/Cmd+Enter does so from a textarea.
	function handleKeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		const preventedBefore = event.defaultPrevented;
		onKeydownProp?.(event);
		if ((!preventedBefore && event.defaultPrevented) || controlsDisabled || event.isComposing) {
			return;
		}
		const target = event.target;
		if (event.key === 'Enter') {
			if (event.repeat || event.shiftKey || event.altKey) return;
			const modified = event.ctrlKey || event.metaKey;
			const textArea = target instanceof HTMLTextAreaElement;
			if (textArea ? !modified : modified && !isTextEntry(target)) return;
			if (!isChoice(target) && !isTextEntry(target)) return;
			if (preventedBefore && !isChoice(target)) return;
			event.preventDefault();
			nextOrSubmit();
			return;
		}
		if (preventedBefore || event.ctrlKey || event.metaKey || event.altKey) return;
		if (!/^[1-9]$/.test(event.key) || isTextEntry(target) || !activeQuestion) return;
		if (steps[activeQuestion.id]?.pickOption(Number(event.key) - 1)) event.preventDefault();
	}
</script>

<div
	bind:this={ref}
	data-slot="ai-ask-user-question"
	class={classes.root({ className })}
	{...attachments}
	onkeydown={handleKeydown}
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
							bind:this={steps[item.id]}
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
				<Alert color="danger" variant="soft" description={errorMessage} class={classes.alert()} />
			{/if}
		</div>

		{#if footer}
			<Slot render={footer} payload={componentState} class={classes.footer()} />
		{:else}
			<AIAskUserQuestionFooter
				{isLast}
				{canSkip}
				disabled={controlsDisabled}
				isSubmitting={resolvedIsSubmitting}
				{isDiscarding}
				canDiscard={Boolean(onDiscard)}
				nextLabel={nextLabel ?? t.aiAskNext}
				skipLabel={skipLabel ?? t.aiAskSkip}
				submitLabel={submitLabel ?? t.submit}
				submittingLabel={submittingLabel ?? t.aiAskSubmitting}
				discardLabel={discardLabel ?? t.dismiss}
				onPrimary={nextOrSubmit}
				onDiscard={() => void discardAnswers()}
				{theme}
			/>
		{/if}
	{/if}
</div>
