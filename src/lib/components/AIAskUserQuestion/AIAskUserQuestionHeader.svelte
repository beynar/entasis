<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { AIAskQuestion } from './aiAskUserQuestion.props.js';
	import {
		useAIAskUserQuestionTheme,
		type AIAskUserQuestionThemeProps
	} from './aiAskUserQuestion.theme.js';

	let {
		questions,
		activeIndex,
		title,
		requester,
		context,
		disabled = false,
		progressLabel,
		onSelect,
		theme
	}: {
		questions: readonly AIAskQuestion[];
		activeIndex: number;
		title: string;
		requester?: string;
		context?: string;
		disabled?: boolean;
		progressLabel: (active: number, total: number) => string;
		onSelect: (index: number) => void;
		theme?: AIAskUserQuestionThemeProps;
	} = $props();

	const classes = $derived(useAIAskUserQuestionTheme(theme));
	const t = $derived(useI18n());
</script>

<div data-slot="ai-ask-user-question-header" class={classes.header()}>
	<div class={classes.headerTop()}>
		<div class={classes.headerText()}>
			{#if requester}<div class={classes.requester()}>{t.askedBy(requester)}</div>{/if}
			<div class={classes.title()}>{title}</div>
			{#if context}<div class={classes.description()}>{context}</div>{/if}
		</div>
		<div class={classes.progressGroup()}>
			<span class={classes.progress()}>
				{progressLabel(activeIndex + 1, questions.length)}
			</span>
			<div class={classes.steps()} aria-label={t.questions}>
				{#each questions as question, index (question.id)}
					<button
						type="button"
						aria-label={t.goToQuestion(index + 1)}
						aria-current={index === activeIndex ? 'step' : undefined}
						{disabled}
						class={classes.step({ active: index === activeIndex })}
						onclick={() => onSelect(index)}
					></button>
				{/each}
			</div>
		</div>
	</div>
</div>
