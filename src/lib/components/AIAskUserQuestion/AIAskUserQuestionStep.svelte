<script lang="ts">
	import { tick } from 'svelte';
	import CheckboxesInput from '../Form/CheckboxesInput/CheckboxesInput.svelte';
	import RadioInput from '../Form/RadioInput/RadioInput.svelte';
	import TextArea from '../Form/TextArea/TextArea.svelte';
	import TextInput from '../Form/TextInput/TextInput.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { Slot as SlotType } from '../Slot/slot.js';
	import { composedContains, getDeepActiveElement } from '$lib/utils/focus.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import AIAskUserQuestionFileStep from './AIAskUserQuestionFileStep.svelte';
	import {
		AI_ASK_OTHER_VALUE,
		getAIAskCustomAnswer,
		getAIAskFileAnswer,
		getAIAskOptionAnswers,
		getAIAskStringAnswer,
		getAIAskStringArrayAnswer,
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
		other,
		onValueChange,
		onOtherChange,
		onError,
		onRegister,
		theme
	}: {
		question: AIAskQuestion;
		value: AIAskAnswer | undefined;
		errorMessage?: string;
		disabled?: boolean;
		renderer?: SlotType<AIAskUserQuestionQuestionState>;
		/** The "Other…" text while Other is chosen, kept by the parent so it survives a remount. */
		other?: string;
		/** `advance: false` marks an edit that must never auto-advance (the "Other…" field). */
		onValueChange: (value: AIAskAnswer, options?: { advance?: boolean }) => void;
		onOtherChange: (text: string | undefined) => void;
		onError: (message: string) => void;
		/** Registers the number-key picker; returns its cleanup. */
		onRegister?: (pick: (position: number) => boolean) => () => void;
		theme?: AIAskUserQuestionThemeProps;
	} = $props();

	const id = $props.id();
	const t = $derived(useI18n());
	const classes = $derived(useAIAskUserQuestionTheme(theme));
	const required = $derived(isAIAskQuestionRequired(question));
	const errorId = $derived(`${id}-error`);
	let stepElement = $state<HTMLElement>();
	// The parent remembers whether "Other…" is chosen and its text, so typed text that equals an
	// option id still reads as Other. An answer that arrives with free text (a string that is no
	// option id, from `defaultValue` say) also chooses Other.
	const customAnswer = $derived(getAIAskCustomAnswer(question, value));
	const otherText = $derived(other ?? customAnswer ?? '');
	const otherActive = $derived(other !== undefined || customAnswer !== undefined);
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

	// The option ids of a multiple answer. Its "Other…" text is the last entry, and is left out
	// even when it equals an option id.
	function optionAnswers(): string[] {
		if (question.type !== 'multiple') return [];
		const entries = getAIAskStringArrayAnswer(value);
		const withoutOther =
			otherActive && otherText.trim() && entries.at(-1) === otherText
				? entries.slice(0, -1)
				: entries;
		return getAIAskOptionAnswers(question, withoutOther);
	}

	function selectSingle(answer: string | null): void {
		if (answer === null) return;
		if (answer !== AI_ASK_OTHER_VALUE) {
			onOtherChange(undefined);
			onValueChange(answer);
			return;
		}
		const text = otherText;
		onOtherChange(text);
		onValueChange(text.trim() ? text : '', { advance: false });
		void focusOther();
	}

	function selectMultiple(next: string[]): void {
		const withOther = next.includes(AI_ASK_OTHER_VALUE);
		const options = next.filter((entry) => entry !== AI_ASK_OTHER_VALUE);
		const text = otherText;
		if (withOther && !otherActive) void focusOther();
		onOtherChange(withOther ? text : undefined);
		onValueChange(withOther && text.trim() ? [...options, text] : options, { advance: false });
	}

	function typeOther(text: string): void {
		const options = optionAnswers();
		onOtherChange(text);
		if (question.type === 'multiple') {
			onValueChange(text.trim() ? [...options, text] : options, { advance: false });
			return;
		}
		onValueChange(text, { advance: false });
	}

	$effect(() => onRegister?.(pickOption));

	/** Picks or toggles the option behind a number key: 1 is the first option, Other comes last. */
	function pickOption(position: number): boolean {
		if (renderer || disabled) return false;
		if (question.type !== 'single' && question.type !== 'multiple') return false;
		const items = choiceItems(question);
		const item = items[position];
		if (!item || ('disabled' in item && item.disabled)) return false;
		const followFocus =
			item.value !== AI_ASK_OTHER_VALUE &&
			stepElement !== undefined &&
			composedContains(stepElement, getDeepActiveElement(stepElement.ownerDocument));
		if (question.type === 'single') {
			selectSingle(item.value);
		} else {
			const current = [...optionAnswers(), ...(otherActive ? [AI_ASK_OTHER_VALUE] : [])];
			selectMultiple(
				current.includes(item.value)
					? current.filter((entry) => entry !== item.value)
					: [...current, item.value]
			);
		}
		// Like an arrow key in a radio group, the picked option takes focus and the Tab stop, so
		// Space and Tab act on it next. Other… focuses its own text field instead.
		if (followFocus) void focusChoice(position);
		return true;
	}

	async function focusChoice(position: number): Promise<void> {
		await tick();
		stepElement
			?.querySelectorAll<HTMLElement>('[role="radio"],[role="checkbox"]')
			[position]?.focus();
	}
</script>

<!-- tabindex -1: the step itself takes focus when a step change finds no control inside it. -->
<div
	bind:this={stepElement}
	data-slot="ai-ask-user-question-step"
	tabindex="-1"
	class={classes.stepContent()}
>
	{#if renderer}
		<Slot
			render={renderer}
			payload={{ question, value, setValue: (answer: AIAskAnswer) => onValueChange(answer) }}
		/>
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
				value={[...optionAnswers(), ...(otherActive ? [AI_ASK_OTHER_VALUE] : [])]}
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
				labelledby={`${id}-title`}
				invalid={Boolean(errorMessage)}
				describedby={errorMessage ? errorId : undefined}
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
