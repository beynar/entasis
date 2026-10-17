<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { summarizeAIAskAnswers } from './aiAskUserQuestionAnswers.js';
	import type { AIAskUserQuestionSummaryProps } from './aiAskUserQuestion.props.js';
	import { useAIAskUserQuestionTheme } from './aiAskUserQuestion.theme.js';

	let {
		ref = $bindable(null),
		size = 'normal',
		questions,
		value,
		title,
		showSkipped = true,
		class: className,
		theme,
		...attachments
	}: AIAskUserQuestionSummaryProps = $props();

	const id = $props.id();
	const t = $derived(useI18n());
	const classes = $derived(useAIAskUserQuestionTheme(theme));
	const items = $derived(
		summarizeAIAskAnswers(questions, value).filter((item) => showSkipped || item.answered)
	);
	const heading = $derived(title === false ? undefined : (title ?? t.aiAskSummaryTitle));
</script>

<div
	bind:this={ref}
	data-slot="ai-ask-user-question-summary"
	role="group"
	data-size={size}
	aria-labelledby={heading ? `${id}-title` : undefined}
	class={classes.summary({ className })}
	{...attachments}
>
	{#if heading}
		<div
			id={`${id}-title`}
			data-slot="ai-ask-user-question-summary-title"
			class={classes.summaryTitle()}
		>
			{heading}
		</div>
	{/if}
	<dl class={classes.summaryList()}>
		{#each items as item (item.questionId)}
			<div data-slot="ai-ask-user-question-summary-item" class={classes.summaryItem()}>
				<dt class={classes.summaryQuestion()}>{item.question.title}</dt>
				<dd class={classes.summaryAnswer({ answered: item.answered })}>
					{item.answered ? item.labels.join(', ') : t.aiAskSkipped}
				</dd>
			</div>
		{/each}
	</dl>
</div>
