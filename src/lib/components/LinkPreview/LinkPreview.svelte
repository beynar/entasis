<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import HoverCard from '../HoverCard/HoverCard.svelte';
	import Skeleton from '../Skeleton/Skeleton.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { LinkPreviewPayload, LinkPreviewProps } from './linkPreview.props.js';
	import {
		createLinkPreviewState,
		DEFAULT_LINK_PREVIEW_METADATA_ENDPOINT
	} from './linkPreview.state.svelte.js';
	import { useLinkPreviewTheme } from './linkPreview.theme.js';

	let {
		id: customId,
		href,
		defaultOpen = false,
		open = $bindable(),
		children,
		metadata,
		fetchMetadata,
		metadataEndpoint = DEFAULT_LINK_PREVIEW_METADATA_ENDPOINT,
		prefetch = false,
		target,
		rel,
		fallbackTitle,
		imageAlt,
		showUrl = true,
		loadingLabel = 'Loading link preview',
		errorLabel = 'Preview unavailable',
		position = 'top',
		offset = 8,
		delay = 150,
		closeDelay = 100,
		openOnFocus = true,
		openOnClick = false,
		closeOnEscape = true,
		closeOnClickOutside = true,
		directedTransition = true,
		transition,
		size = 'normal',
		disabled = false,
		class: className,
		cardClass,
		popoverClass,
		cardColor = 'neutral',
		cardVariant = 'solid',
		showBorders = false,
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		onLoad,
		onError,
		theme,
		hoverCardTheme,
		cardTheme,
		popoverTheme,
		...attachments
	}: LinkPreviewProps = $props();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);

	const generatedId = $props.id();
	const id = $derived(customId || generatedId);
	const classes = $derived(useLinkPreviewTheme(theme));
	const resolvedRel = $derived(rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined));
	const previewState = createLinkPreviewState({
		getHref: () => href,
		getMetadata: () => metadata,
		getFetchMetadata: () => fetchMetadata,
		getMetadataEndpoint: () => metadataEndpoint,
		getShouldLoad: () => prefetch || openState.value,
		getDisabled: () => disabled,
		onLoad: (nextMetadata) => onLoad?.(nextMetadata),
		onError: (nextError) => onError?.(nextError)
	});

	let hoverCardPayload = $state<LinkPreviewPayload['hoverCard']>(null);
	let failedImageUrl = $state<string | null>(null);
	let failedFaviconUrl = $state<string | null>(null);

	const previewUrl = $derived(previewState.previewUrl);
	const previewHost = $derived(getHostLabel(previewUrl));
	const previewUrlLabel = $derived(getUrlLabel(previewUrl));
	const previewSite = $derived(previewState.metadata?.siteName ?? previewHost);
	const previewTitle = $derived(previewState.metadata?.title ?? fallbackTitle ?? previewHost);
	const previewDescription = $derived(previewState.metadata?.description);
	const previewImage = $derived(
		previewState.metadata?.image && previewState.metadata.image !== failedImageUrl
			? previewState.metadata.image
			: undefined
	);
	const previewFavicon = $derived(
		previewState.metadata?.favicon && previewState.metadata.favicon !== failedFaviconUrl
			? previewState.metadata.favicon
			: undefined
	);
	const payload = $derived<LinkPreviewPayload>({
		href,
		metadata: previewState.metadata,
		status: previewState.status,
		error: previewState.error,
		isOpen: openState.value,
		reload: previewState.reload,
		hoverCard: hoverCardPayload
	});

	function getParsedUrl(value: string) {
		try {
			return new URL(value);
		} catch {
			return null;
		}
	}

	function getHostLabel(value: string) {
		const url = getParsedUrl(value);
		return url ? url.host.replace(/^www\./, '') : value;
	}

	function getUrlLabel(value: string) {
		const url = getParsedUrl(value);
		if (!url) return value;
		const path = url.pathname === '/' ? '' : url.pathname;
		return `${url.host.replace(/^www\./, '')}${path}`;
	}

	function handleAfterOpen(nextPayload: LinkPreviewPayload['hoverCard']) {
		hoverCardPayload = nextPayload;
		onAfterOpen?.({ ...payload, hoverCard: nextPayload, isOpen: true });
	}

	function handleAfterClose(nextPayload: LinkPreviewPayload['hoverCard']) {
		hoverCardPayload = nextPayload;
		onAfterClose?.({ ...payload, hoverCard: nextPayload, isOpen: false });
	}

	function handleOpenChange(nextOpen: boolean) {
		if (openState.value === nextOpen) return;
		openState.value = nextOpen;
		onOpenChange?.(nextOpen);
	}

	function blockDisabledActivation(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
	}

	$effect(() => {
		const metadataImage = previewState.metadata?.image;
		const metadataFavicon = previewState.metadata?.favicon;
		failedImageUrl = null;
		failedFaviconUrl = null;
		void metadataImage;
		void metadataFavicon;
	});
</script>

<HoverCard
	{id}
	open={openState.value}
	{position}
	{offset}
	{delay}
	{closeDelay}
	{openOnFocus}
	{openOnClick}
	{closeOnEscape}
	{closeOnClickOutside}
	{directedTransition}
	{transition}
	{size}
	{disabled}
	{popoverClass}
	{cardColor}
	{cardVariant}
	{showBorders}
	class={classes.card({ size, className: cardClass })}
	theme={hoverCardTheme}
	{cardTheme}
	{popoverTheme}
	onOpenChange={handleOpenChange}
	onAfterOpen={handleAfterOpen}
	onAfterClose={handleAfterClose}
>
	{#snippet trigger()}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- Package consumers supply URLs; library links cannot depend on SvelteKit routing. -->
		<a
			href={disabled ? undefined : href}
			{target}
			rel={resolvedRel}
			class={classes.trigger({ disabled, className })}
			data-status={previewState.status}
			aria-describedby={id}
			aria-disabled={disabled || undefined}
			tabindex={disabled ? -1 : undefined}
			onclick={disabled ? blockDisabledActivation : undefined}
			{...attachments}
		>
			<Slot render={children ?? previewHost} {payload} />
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/snippet}

	{#snippet content()}
		<div class={classes.content({ size })} data-status={previewState.status}>
			{#if previewState.status === 'loaded' && previewState.metadata}
				{#if previewImage}
					<div class={classes.media({ size })}>
						<img
							src={previewImage}
							alt={imageAlt ?? `${previewTitle} preview`}
							class={classes.image()}
							loading="lazy"
							onerror={() => (failedImageUrl = previewImage)}
						/>
					</div>
				{/if}

				<div class={classes.body({ size })}>
					<div class={classes.header()}>
						{#if previewFavicon}
							<img
								src={previewFavicon}
								alt=""
								class={classes.favicon()}
								loading="lazy"
								onerror={() => (failedFaviconUrl = previewFavicon)}
							/>
						{/if}
						<span class={classes.site()}>{previewSite}</span>
					</div>

					<p class={classes.title({ size })}>{previewTitle}</p>

					{#if previewDescription}
						<p class={classes.description({ size })}>{previewDescription}</p>
					{/if}

					{#if showUrl}
						<p class={classes.url()}>{previewUrlLabel}</p>
					{/if}
				</div>
			{:else if previewState.status === 'error'}
				<div class={classes.error()} role="status">
					<p class={classes.title({ size })}>{errorLabel}</p>
					{#if previewState.error}
						<p class={classes.description({ size })}>{previewState.error}</p>
					{/if}
					<p class={classes.url()}>{previewHost}</p>
				</div>
			{:else}
				<div class={classes.loading()} role="status" aria-label={loadingLabel}>
					<Skeleton class={classes.media({ size })} />
					<div class={classes.body({ size })}>
						<Skeleton class="h-3 w-24 rounded-full" />
						<Skeleton class="h-4 w-11/12 rounded-full" />
						<Skeleton class="h-4 w-8/12 rounded-full" />
						<Skeleton class="h-3 w-6/12 rounded-full" />
					</div>
				</div>
			{/if}
		</div>
	{/snippet}
</HoverCard>
