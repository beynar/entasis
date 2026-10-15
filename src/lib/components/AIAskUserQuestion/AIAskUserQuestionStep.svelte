<script lang="ts">
	import { tick } from 'svelte';
	import CheckboxesInput from '../Form/CheckboxesInput/CheckboxesInput.svelte';
	import RadioInput from '../Form/RadioInput/RadioInput.svelte';
	import TextArea from '../Form/TextArea/TextArea.svelte';
	import TextInput from '../Form/TextInput/TextInput.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { Slot as SlotType } from '../Slot/slot.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import AIAskUserQuestionFileStep from './AIAskUserQuestionFileStep.svelte';
	import {
		AI_ASK_OTHER_VALUE,
		getAIAskCustomAnswer,
		getAIAskFileAnswer,
		getAIAskOptionAnswers,
		getAIAskStringAnswer,
		isAIAskQuestionRequired
	} from './aiAskUserQuestionAnswers.js';
	import type {
		AIAskAnswer,
		AIAskQuestion,
		AIAskUserQuestionQuestionState,
		AIMultipleQuestion,
		AISingleQuestion
	} from './aiAskUserQuestion.props.js';
	import {
		useAIAskUserQuestionTheme,
		type AIAskUserQuestionThemeProps
	} from './aiAskUserQuestion.theme.js';

	let {
		question,
		value,
		errorMessage,
		disabled = false,
		renderer,
		onValueChange,
		onError,
		theme
	}: {
		question: AIAskQuestion;
		value: AIAskAnswer | undefined;
		errorMessage?: string;
		disabled?: boolean;
		renderer?: SlotType<AIAskUserQuestionQuestionState>;
		onValueChange: (value: AIAskAnswer) => void;
		onError: (message: string) => void;
		theme?: AIAskUserQuestionThemeProps;
	} = $props();

	const id = $props.id();
	const t = $derived(useI18n());
	const classes = $derived(useAIAskUserQuestionTheme(theme));
	const required = $derived(isAIAskQuestionRequired(question));
	const errorId = $derived(`${id}-error`);
	let stepElement = $state<HTMLElement>();
	// "Other…" stays chosen while its text is still empty, so it needs local state; once text is
	// typed the answer itself (a string that is no option id) says Other is chosen.
	let otherChosen = $state(false);
	let otherDraft = $state<string>();
	const customAnswer = $derived(getAIAskCustomAnswer(question, value));
	const otherText = $derived(otherDraft ?? customAnswer ?? '');
	const otherActive = $derived(otherChosen || customAnswer !== undefined);
	const choiceAttrs = $derived({
		'aria-invalid': errorMessage ? ('true' as const) : undefined,
		'aria-describedby': errorMessage ? errorId : undefined
	});

	function choiceItems(choice: AISingleQuestion | AIMultipleQuestion) {
		const items = choice.options.map((option) => ({ ...option, value: option.id }));
		if (!choice.allowOther) return items;
		return [...items, { value: AI_ASK_OTHER_VALUE, label: choice.otherLabel ?? t.aiAskOther }];
	}

	async function focusOther(): Promise<void> {
		await tick();
		stepElement
			?.querySelector<HTMLInputElement>('[data-slot="ai-ask-user-question-other"] input')
			?.focus();
	}

	function selectSingle(answer: string | null): void {
		if (answer === null) return;
		if (answer !== AI_ASK_OTHER_VALUE) {
			otherChosen = false;
			onValueChange(answer);
			return;
		}
		otherChosen = true;
		onValueChange(otherText.trim() ? otherText : '');
		void focusOther();
	}

	function selectMultiple(next: string[]): void {
		const withOther = next.includes(AI_ASK_OTHER_VALUE);
		const options = next.filter((entry) => entry !== AI_ASK_OTHER_VALUE);
		if (withOther && !otherActive) void focusOther();
		otherChosen = withOther;
		onValueChange(withOther && otherText.trim() ? [...options, otherText] : options);
	}

	function typeOther(text: string): void {
		otherDraft = text;
		otherChosen = true;
		if (question.type === 'multiple') {
			const options = getAIAskOptionAnswers(question, value);
			onValueChange(text.trim() ? [...options, text] : options);
			return;
		}
		onValueChange(text);
	}

	/** Picks or toggles the option behind a number key: 1 is the first option, Other comes last. */
	export function pickOption(position: number): boolean {
		if (renderer || disabled) return false;
		if (question.type !== 'single' && question.type !== 'multiple') return false;
		const items = choiceItems(question);
		const item = items[position];
		if (!item || ('disabled' in item && item.disabled)) return false;
		if (question.type === 'single') {
			selectSingle(item.value);
			return true;
		}
		const current = [
			...getAIAskOptionAnswers(question, value),
			...(otherActive ? [AI_ASK_OTHER_VALUE] : [])
		];
		selectMultiple(
			current.includes(item.value)
				? current.filter((entry) => entry !== item.value)
				: [...current, item.value]
		);
		return true;
	}
</script>

<div bind:this={stepElement} data-slot="ai-ask-user-question-step" class={classes.stepContent()}>
	{#if renderer}
		<Slot render={renderer} payload={{ question, value, setValue: onValueChange }} />
	{:else}
		<div class={classes.question()}>
			<div id={`${id}-title`} class={classes.questionTitle()}>
				{question.title}{#if required}<span
						data-slot="ai-ask-user-question-required"
						class={classes.requiredMarker()}
						><span aria-hidden="true">*</span><span class="sr-only">{t.aiAskRequiredMarker}</span
						></span
					>{/if}
			</div>
			{#if question.description}
				<div class={classes.questionDescription()}>{question.description}</div>
			{/if}
		</div>

		{#if question.type === undefined || question.type === 'text'}
			<TextArea
				value={getAIAskStringAnswer(value)}
				name={question.id}
				placeholder={question.placeholder ?? t.aiAskPlaceholder}
				rows={question.rows ?? 4}
				class={classes.textArea()}
				textareaAttrs={{
					'aria-labelledby': `${id}-title`,
					'aria-invalid': errorMessage ? 'true' : undefined,
					'aria-describedby': errorMessage ? errorId : undefined
				}}
				{required}
				{disabled}
				onValueChange={(answer) => onValueChange(answer ?? '')}
			/>
		{:else if question.type === 'single'}
			<RadioInput
				mode="card"
				value={otherActive ? AI_ASK_OTHER_VALUE : getAIAskStringAnswer(value) || null}
				name={question.id}
				items={choiceItems(question)}
				class={classes.options()}
				fieldAttrs={{ 'aria-label': question.title, ...choiceAttrs }}
				{required}
				{disabled}
				onValueChange={selectSingle}
			/>
		{:else if question.type === 'multiple'}
			<CheckboxesInput
				mode="card"
				value={[
					...getAIAskOptionAnswers(question, value),
					...(otherActive ? [AI_ASK_OTHER_VALUE] : [])
				]}
				name={question.id}
				items={choiceItems(question)}
				class={classes.options()}
				fieldAttrs={{ role: 'group', 'aria-label': question.title, ...choiceAttrs }}
				{required}
				{disabled}
				onValueChange={(answer: string[]) => selectMultiple(answer)}
			/>
		{:else if question.type === 'file'}
			<AIAskUserQuestionFileStep
				{question}
				files={getAIAskFileAnswer(value)}
				{required}
				{disabled}
				{theme}
				{onError}
				onValueChange={(files) => onValueChange(files)}
			/>
		{/if}

		{#if (question.type === 'single' || question.type === 'multiple') && question.allowOther && otherActive}
			<div data-slot="ai-ask-user-question-other" class={classes.other()}>
				<TextInput
					value={otherText}
					name={`${question.id}-other`}
					placeholder={question.otherPlaceholder ?? t.aiAskOtherPlaceholder}
					inputAttrs={{ 'aria-label': question.otherLabel ?? t.aiAskOther }}
					{disabled}
					onValueChange={(text) => typeOther(text ?? '')}
				/>
			</div>
		{/if}
	{/if}

	{#if errorMessage}
		<p id={errorId} role="alert" data-slot="ai-ask-user-question-error" class={classes.error()}>
			{errorMessage}
		</p>
	{/if}
</div>
