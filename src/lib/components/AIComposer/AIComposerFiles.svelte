<script lang="ts">
	import AIFilePreview from '../AIFilePreview/AIFilePreview.svelte';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import type { AIComposerAttachment } from './aiComposer.props.js';
	import { useAIComposerTheme, type AIComposerThemeProps } from './aiComposer.theme.js';
	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';
	import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		files,
		attachments,
		disabled = false,
		canRetry = false,
		onRemove,
		onRetry,
		theme
	}: {
		files: File[];
		attachments: AIComposerAttachment[];
		disabled?: boolean;
		canRetry?: boolean;
		onRemove: (file: File) => void;
		onRetry: (attachmentId: string) => void;
		theme?: AIComposerThemeProps;
	} = $props();
	const t = $derived(useI18n());

	const classes = $derived(useAIComposerTheme(theme));
	const flipDuration = $derived(prefersReducedMotion() ? 0 : 180);

	function getAttachment(file: File): AIComposerAttachment | undefined {
		const key = getFileKey(file);
		return attachments.find((attachment) => getFileKey(attachment.file) === key);
	}

	function getFileKey(file: Pick<File, 'name' | 'size' | 'type' | 'lastModified'>): string {
		return `${file.name}:${file.size}:${file.type}:${file.lastModified}`;
	}
</script>

{#if files.length > 0}
	<ScrollArea scrollFade class="max-w-full" label={t.aiComposerAttachedFiles}>
		<div data-slot="ai-composer-files" role="list" class={classes.files()}>
			{#each files as file (getFileKey(file))}
				{@const attachment = getAttachment(file)}
				<div role="listitem" animate:flip={{ duration: flipDuration, easing: quintOut }}>
					<AIFilePreview
						{file}
						class={classes.file()}
						name={attachment?.name}
						previewUrl={attachment?.previewUrl ?? attachment?.remoteUrl}
						status={attachment?.status}
						error={attachment?.error}
						onRemove={disabled ? undefined : () => onRemove(file)}
						onRetry={attachment?.status === 'failed' && canRetry && !disabled
							? () => onRetry(attachment.id)
							: undefined}
					/>
				</div>
			{/each}
		</div>
	</ScrollArea>
{/if}
