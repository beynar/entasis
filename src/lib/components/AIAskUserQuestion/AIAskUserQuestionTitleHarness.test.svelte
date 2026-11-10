<script lang="ts">
	// Test-only: question titles drawn as one line of Markdown, with a link, the way an app shows a
	// question that names the record it is about.
	import Markdown from '../Markdown/Markdown.svelte';
	import Theme from '../Theme/Theme.svelte';
	import AIAskUserQuestion from './AIAskUserQuestion.svelte';
	import type {
		AIAskQuestion,
		AIAskUserQuestionSubmitPayload,
		AIAskUserQuestionTitleState
	} from './aiAskUserQuestion.props.js';

	let {
		questions,
		onSubmit,
		seen = []
	}: {
		questions: AIAskQuestion[];
		onSubmit?: (payload: AIAskUserQuestionSubmitPayload) => void;
		seen?: AIAskUserQuestionTitleState[];
	} = $props();
</script>

<Theme>
	<button type="button" data-testid="before">Before</button>
	<AIAskUserQuestion {questions} {onSubmit} autoAdvance={false}>
		{#snippet questionTitle(state)}
			{(seen.push(state), '')}<Markdown inline content={state.question.title} />
		{/snippet}
	</AIAskUserQuestion>
</Theme>
