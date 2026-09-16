<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import AIAskUserQuestion from '../AIAskUserQuestion/AIAskUserQuestion.svelte';
	import type {
		AIAskAnswers,
		AIAskUserQuestionSubmitPayload
	} from '../AIAskUserQuestion/aiAskUserQuestion.props.js';
	import type {
		AIThreadAskUserQuestion as AIThreadAskUserQuestionRequest,
		AIThreadItem,
		AIThreadProps
	} from './aiThread.props.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type Props<TMessage extends AIThreadItem> = Pick<
		AIThreadProps<TMessage>,
		'askUserQuestionDisabled'
	> & {
		request: AIThreadAskUserQuestionRequest<TMessage>;
		value?: AIAskAnswers;
		class?: string;
		onValuesChange: (payload: {
			request: AIThreadAskUserQuestionRequest<TMessage>;
			values: AIAskAnswers;
		}) => void;
		onResolve: (payload: {
			request: AIThreadAskUserQuestionRequest<TMessage>;
			state: 'completed' | 'discarded';
			detail?: AIAskUserQuestionSubmitPayload;
		}) => void | Promise<void>;
	};

	let {
		request,
		value,
		askUserQuestionDisabled = false,
		class: className,
		onValuesChange,
		onResolve
	}: Props<TMessage> = $props();
	const t = $derived(useI18n());

	const values = $derived(value ?? request.value ?? {});
</script>

<div data-slot="ai-thread-ask-user-question" class={className}>
	<AIAskUserQuestion
		questions={request.questions}
		value={values}
		disabled={askUserQuestionDisabled}
		title={request.title ?? t.aiAskClarify}
		requester={request.requester}
		context={request.context}
		submitLabel={request.submitLabel}
		submittingLabel={request.submittingLabel}
		nextLabel={request.nextLabel}
		previousLabel={request.previousLabel}
		discardLabel={request.discardLabel}
		onValueChange={(values) => onValuesChange({ request, values })}
		onSubmit={(detail: AIAskUserQuestionSubmitPayload) =>
			onResolve({ request, state: 'completed', detail })}
		onDiscard={() => onResolve({ request, state: 'discarded' })}
	/>
</div>
