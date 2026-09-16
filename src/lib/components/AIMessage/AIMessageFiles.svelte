<script lang="ts">
	import AIFilePreview from '../AIFilePreview/AIFilePreview.svelte';
	import type { AIFilePreviewThemeProps } from '../AIFilePreview/aiFilePreview.theme.js';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import type { AIFileSource } from '../AIThread/aiThread.props.js';
	import type { AIMessageSize } from './aiMessage.props.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	const MESSAGE_FILE_THEMES = {
		small: {
			root: {
				base: 'min-h-7 min-w-0 max-w-52 gap-1 rounded-md bg-surface/90 px-1 py-0.5 text-neutral shadow-xs'
			},
			preview: { base: 'size-5 rounded-sm' },
			fallback: {
				base: 'size-5 rounded-sm bg-surface text-neutral/55 [&_svg]:size-3'
			},
			content: { base: 'flex min-w-0 items-center gap-1' },
			name: { base: 'text-[0.6875rem] font-normal' },
			meta: { base: 'shrink-0 gap-0 text-[0.625rem] text-neutral/55' },
			error: { base: 'hidden' }
		},
		normal: {
			root: {
				base: 'min-h-8 min-w-0 max-w-60 gap-1.5 rounded-md bg-surface/90 px-1.5 py-1 text-neutral shadow-xs'
			},
			preview: { base: 'size-6 rounded-sm' },
			fallback: {
				base: 'size-6 rounded-sm bg-surface text-neutral/55 [&_svg]:size-3.5'
			},
			content: { base: 'flex min-w-0 items-center gap-1.5' },
			name: { base: 'text-xs font-normal' },
			meta: { base: 'shrink-0 gap-0 text-[0.68rem] text-neutral/55' },
			error: { base: 'hidden' }
		},
		large: {
			root: {
				base: 'min-h-10 min-w-0 max-w-72 gap-2 rounded-md bg-surface/90 px-2 py-1.5 text-neutral shadow-xs'
			},
			preview: { base: 'size-8 rounded-sm' },
			fallback: {
				base: 'size-8 rounded-sm bg-surface text-neutral/55 [&_svg]:size-4'
			},
			content: { base: 'flex min-w-0 items-center gap-2' },
			name: { base: 'text-sm font-normal' },
			meta: { base: 'shrink-0 gap-0.5 text-xs text-neutral/55' },
			error: { base: 'hidden' }
		}
	} satisfies Record<AIMessageSize, AIFilePreviewThemeProps>;

	let {
		files = [],
		align = 'start',
		size = 'normal',
		class: className
	}: {
		files?: readonly AIFileSource[];
		align?: 'start' | 'center' | 'end';
		size?: AIMessageSize;
		class?: string;
	} = $props();
	const t = $derived(useI18n());

	function isNativeFile(file: AIFileSource): file is File {
		return typeof File !== 'undefined' && file instanceof File;
	}

	function fileKey(file: AIFileSource, index: number): File | string | number | bigint {
		if (isNativeFile(file)) return file;
		return file.id ?? `${file.name}:${file.size ?? 'unknown'}:${index}`;
	}

	function resolveAlignmentClass(value: 'start' | 'center' | 'end'): string {
		if (value === 'center') return 'self-center';
		if (value === 'end') return 'self-end';
		return '';
	}

	function resolveGapClass(value: AIMessageSize): string {
		if (value === 'small') return 'gap-1';
		if (value === 'large') return 'gap-2';
		return 'gap-1.5';
	}

	const alignmentClass = $derived(resolveAlignmentClass(align));
	const gapClass = $derived(resolveGapClass(size));
</script>

{#if files.length > 0}
	<div
		data-slot="ai-message-files"
		data-align={align}
		data-size={size}
		class="max-w-full min-w-0 {alignmentClass} {className ?? ''}"
	>
		<ScrollArea scrollFade label={t.messageFiles} class="w-full max-w-full">
			<div
				data-slot="ai-message-file-list"
				role="list"
				class="flex w-max max-w-full flex-nowrap {gapClass} {align === 'end' ? 'ml-auto' : ''}"
			>
				{#each files as file, index (fileKey(file, index))}
					<div data-slot="ai-message-file" role="listitem" class="shrink-0">
						<AIFilePreview {file} theme={MESSAGE_FILE_THEMES[size]} />
					</div>
				{/each}
			</div>
		</ScrollArea>
	</div>
{/if}
