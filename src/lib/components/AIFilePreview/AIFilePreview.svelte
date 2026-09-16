<script lang="ts">
	import Button from '../Button/Button.svelte';
	import { arrowClockwiseIcon } from '../Icons/arrowClockwise.js';
	import { fileIcon } from '../Icons/file.js';
	import { xIcon } from '../Icons/x.js';
	import Spinner from '../Spinner/Spinner.svelte';
	import type { AIFilePreviewProps, AIFilePreviewSource } from './aiFilePreview.props.js';
	import { useAIFilePreviewTheme } from './aiFilePreview.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		ref = $bindable<HTMLDivElement | null>(null),
		file,
		name,
		previewUrl,
		status,
		error,
		onRemove,
		onRetry,
		class: className,
		theme,
		...attachments
	}: AIFilePreviewProps = $props();
	const t = $derived(useI18n());

	let generatedPreviewUrl = $state<string>();
	const fileName = $derived(name ?? file.name);
	const fileType = $derived(file.type ?? '');
	const fileSize = $derived(file.size);
	const formattedSize = $derived(formatFileSize(fileSize));
	const configuredPreviewUrl = $derived(
		previewUrl ?? (isNativeFile(file) ? undefined : file.previewUrl)
	);
	const isImage = $derived(fileType.startsWith('image/'));
	const imageUrl = $derived(configuredPreviewUrl ?? generatedPreviewUrl);
	const classes = $derived(useAIFilePreviewTheme(theme));

	$effect(() => {
		generatedPreviewUrl = undefined;
		if (
			configuredPreviewUrl ||
			!isImage ||
			!isNativeFile(file) ||
			typeof URL === 'undefined' ||
			typeof URL.createObjectURL !== 'function'
		) {
			return;
		}
		const objectUrl = URL.createObjectURL(file);
		generatedPreviewUrl = objectUrl;
		return () => URL.revokeObjectURL(objectUrl);
	});

	function isNativeFile(source: AIFilePreviewSource): source is File {
		return typeof File !== 'undefined' && source instanceof File;
	}

	function formatFileSize(value: number | undefined): string | undefined {
		if (value === undefined) return undefined;
		if (value >= 1_000_000) {
			return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)} MB`;
		}
		if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)} KB`;
		return `${value} B`;
	}
</script>

<div
	bind:this={ref}
	data-slot="ai-file-preview"
	data-status={status}
	class={classes.root({ className, status })}
	{...attachments}
>
	{#if imageUrl && isImage}
		<img src={imageUrl} alt="" class={classes.preview()} />
	{:else}
		<div class={classes.fallback()}>{@render fileIcon({ size: 16 })}</div>
	{/if}
	<div class={classes.content()}>
		<div class={classes.name()} title={fileName}>{fileName}</div>
		{#if status || formattedSize}
			<div class={classes.meta()}>
				{#if status}<span class="capitalize">{status}</span>{/if}
				{#if status && formattedSize}<span aria-hidden="true">·</span>{/if}
				{#if formattedSize}<span class="tabular-nums">{formattedSize}</span>{/if}
			</div>
		{/if}
		{#if error}<div class={classes.error()} title={error}>{error}</div>{/if}
	</div>
	{#if status === 'uploading'}<Spinner size="small" decorative />{/if}
	{#if status === 'failed' && onRetry}
		<Button
			type="button"
			squared
			size="small"
			variant="ghost"
			label={t.retry(fileName)}
			onclick={onRetry}
		>
			{@render arrowClockwiseIcon({ size: 14 })}
		</Button>
	{/if}
	{#if onRemove}
		<Button
			type="button"
			squared
			size="small"
			variant="ghost"
			label={t.remove(fileName)}
			onclick={onRemove}
		>
			{@render xIcon({ size: 14 })}
		</Button>
	{/if}
</div>
