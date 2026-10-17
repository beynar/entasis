<script lang="ts" generics="TMessage extends AIThreadItem = AIThreadItem">
	import { aiThreadTocPreviewFileTheme } from './aiThreadTocPreview.file.theme.js';
	import AIFilePreview from '../AIFilePreview/AIFilePreview.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type {
		AIFileSource,
		AIThreadItem,
		AIThreadTocEntry,
		AIThreadTocProps
	} from './aiThreadToc.props.js';
	import { useAIThreadTocTheme } from './aiThreadToc.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type Props = Pick<
		AIThreadTocProps<TMessage>,
		'preview' | 'title' | 'excerpt' | 'metadata' | 'icon' | 'theme'
	> & {
		entry: AIThreadTocEntry<TMessage>;
		/** 1-based position of the entry among the thread's user turns; 0 hides it. */
		turn?: number;
		total?: number;
	};

	type PreviewFile = {
		file: AIFileSource;
	};

	let {
		entry,
		turn = 0,
		total = 0,
		preview,
		title,
		excerpt,
		metadata,
		icon,
		theme
	}: Props = $props();

	const t = $derived(useI18n());

	const classes = $derived(useAIThreadTocTheme(theme));
	const files = $derived(previewFiles(entry));

	function previewFiles(currentEntry: AIThreadTocEntry<TMessage>): PreviewFile[] {
		return [
			...currentEntry.attachments.map((attachment) => ({ file: attachment.file })),
			...currentEntry.files.map((file) => ({ file }))
		].slice(0, 3);
	}

	function fileKey(previewFile: PreviewFile, index: number): string | File {
		const { file } = previewFile;
		if (typeof File !== 'undefined' && file instanceof File) return file;
		const id = 'id' in file ? file.id : undefined;
		return `${String(id ?? '')}:${file.name}:${file.size ?? ''}:${index}`;
	}
</script>

<div data-slot="ai-thread-toc-preview" class={classes.preview()}>
	{#if preview}
		<Slot render={preview} payload={entry} />
	{:else}
		<div data-slot="ai-thread-toc-preview-header" class={classes.previewHeader()}>
			{#if icon}
				<span data-slot="ai-thread-toc-preview-icon" class={classes.previewIcon()}>
					<Slot render={icon} payload={entry} />
				</span>
			{/if}
			<div class="min-w-0 flex-1">
				<div data-slot="ai-thread-toc-preview-title" class={classes.previewTitle()}>
					<Slot render={title ?? entry.title} payload={entry} />
				</div>
				{#if turn > 0 && total > 0}
					<div data-slot="ai-thread-toc-preview-turn" class={classes.previewTurn()}>
						{t.aiThreadTocTurn(turn, total)}
					</div>
				{/if}
				{#if metadata}
					<div data-slot="ai-thread-toc-preview-metadata" class={classes.previewMetadata()}>
						<Slot render={metadata} payload={entry} />
					</div>
				{/if}
			</div>
		</div>
		{#if excerpt || entry.excerpt}
			<div data-slot="ai-thread-toc-preview-excerpt" class={classes.previewExcerpt()}>
				<Slot render={excerpt ?? entry.excerpt} payload={entry} />
			</div>
		{/if}
		{#if files.length > 0}
			<div role="list" class={classes.previewFiles()}>
				{#each files as previewFile, index (fileKey(previewFile, index))}
					<div role="listitem" class="min-w-0">
						<AIFilePreview
							file={previewFile.file}
							class="max-w-36 min-w-0 gap-1.5 border-0 bg-transparent p-0"
							theme={aiThreadTocPreviewFileTheme}
						/>
					</div>
				{/each}
				{#if entry.fileCount > files.length}
					<div class={classes.previewMetadata()}>
						{t.aiThreadTocMoreFiles(entry.fileCount - files.length)}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
