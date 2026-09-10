<script lang="ts">
	import FileInput from '../Form/File/FileInput.svelte';
	import type { FileRejection } from '../Form/File/fileAcceptance.js';
	import type { AIFileQuestion } from './aiAskUserQuestion.props.js';
	import {
		useAIAskUserQuestionTheme,
		type AIAskUserQuestionThemeProps
	} from './aiAskUserQuestion.theme.js';

	let {
		question,
		files,
		disabled = false,
		required = false,
		onValueChange,
		onError,
		theme
	}: {
		question: AIFileQuestion;
		files: File[];
		disabled?: boolean;
		required?: boolean;
		onValueChange: (files: File[]) => void;
		onError: (message: string) => void;
		theme?: AIAskUserQuestionThemeProps;
	} = $props();

	const types = $derived(normalizeAccept(question.accept));
	const classes = $derived(useAIAskUserQuestionTheme(theme));

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
		if (reasons.has('type')) return 'Some files do not match the accepted type.';
		if (reasons.has('size')) return 'Some files are larger than the allowed size.';
		if (reasons.has('limit')) return 'Too many files selected for this question.';
		if (reasons.has('duplicate')) return 'Some files were already selected.';
		return 'Some files could not be added.';
	}
</script>

<div data-slot="ai-ask-user-question-file" class={classes.file()}>
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
