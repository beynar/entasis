<script lang="ts">
	import FileInput from '../Form/File/FileInput.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { FileRejection } from '../Form/File/fileAcceptance.js';
	import type { AIFileQuestion } from './aiAskUserQuestion.props.js';
	import {
		useAIAskUserQuestionTheme,
		type AIAskUserQuestionThemeProps
	} from './aiAskUserQuestion.theme.js';

	let {
		question,
		files,
		labelledby,
		invalid = false,
		describedby,
		disabled = false,
		required = false,
		onValueChange,
		onError,
		theme
	}: {
		question: AIFileQuestion;
		files: File[];
		/** Id of the question title that names the file group. */
		labelledby?: string;
		/** Marks the group `data-invalid` while the question shows an error. */
		invalid?: boolean;
		/** Id of the question's error message. */
		describedby?: string;
		disabled?: boolean;
		required?: boolean;
		onValueChange: (files: File[]) => void;
		onError: (message: string) => void;
		theme?: AIAskUserQuestionThemeProps;
	} = $props();

	const types = $derived(normalizeAccept(question.accept));
	const classes = $derived(useAIAskUserQuestionTheme(theme));
	const t = $derived(useI18n());

	function normalizeAccept(accept: string | readonly string[] | undefined): string[] {
		if (!accept) return [];
		if (typeof accept !== 'string') return Array.from(accept);
		return accept
			.split(',')
			.map((type) => type.trim())
			.filter(Boolean);
	}

	function formatRejections(rejections: FileRejection[]): string {
		const reasons = new Set(rejections.map((rejection) => rejection.reason));
		if (reasons.has('type')) return t.aiAskFileType;
		if (reasons.has('size')) return t.aiAskFileSize;
		if (reasons.has('limit')) return t.aiAskFileLimit;
		if (reasons.has('duplicate')) return t.aiAskFileDuplicate;
		return t.aiAskFileRejected;
	}
</script>

<!-- The group carries the question's name and error message, as the choice and text controls do
     (a group has no aria-invalid, so the invalid state is a data attribute). -->
<div
	data-slot="ai-ask-user-question-file"
	data-invalid={invalid || undefined}
	role="group"
	aria-labelledby={labelledby}
	aria-describedby={describedby}
	class={classes.file()}
>
	{#if question.multiple ?? true}
		<FileInput
			mode="multiple"
			value={files}
			name={question.id}
			{types}
			maxFiles={question.maxFiles ?? Number.POSITIVE_INFINITY}
			maxSize={question.maxSize}
			{required}
			{disabled}
			onReject={(rejections) => onError(formatRejections(rejections))}
			onValueChange={(answer) => onValueChange(answer ?? [])}
		/>
	{:else}
		<FileInput
			mode="single"
			value={files[0] ?? null}
			name={question.id}
			{types}
			maxSize={question.maxSize}
			{required}
			{disabled}
			onReject={(rejections) => onError(formatRejections(rejections))}
			onValueChange={(answer) => onValueChange(answer ? [answer] : [])}
		/>
	{/if}
</div>
