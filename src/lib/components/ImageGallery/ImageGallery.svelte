<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import 'lightgallery/css/lightgallery.css';
	import 'lightgallery/css/lg-thumbnail.css';
	import 'lightgallery/css/lg-zoom.css';
	import Slot from '../Slot/Slot.svelte';
	import { ImageGalleryState } from './imageGallery.state.svelte.js';
	import type { ImageGalleryProps } from './imageGallery.props.js';
	import { easingBezierStrings } from '$lib/transitions/easingFunctions.js';
	import { useImageGalleryMotion, useImageGalleryTheme } from './imageGallery.theme.js';

	let {
		id: customId,
		defaultOpen = false,
		open = $bindable(),
		activeIndex = $bindable(0),
		imageSelector = 'img',
		disabled = false,
		zoomMargin = 32,
		closeOnClickOutside = true,
		closeOnEscape = true,
		lockScroll = true,
		buttonLabel,
		closeLabel,
		previousLabel,
		nextLabel,
		licenseKey = '0000-0000-000-0000',
		class: className,
		onOpenChange,
		onIndexChange,
		onAfterOpen,
		onAfterClose,
		theme,
		children,
		caption,
		...attachments
	}: ImageGalleryProps = $props();
	const openState = createBindableValue(
		() => open,
		(nextOpen) => (open = nextOpen),
		() => defaultOpen
	);

	const generatedId = $props.id();
	const id = $derived(customId || generatedId);
	const classes = $derived(useImageGalleryTheme(theme));
	const t = $derived(useI18n());
	// Lightbox timing from `imageGalleryTheme.motion`, through the override ladder
	// (registry → `setImageGalleryTheme` → instance `theme.motion`).
	const resolveMotion = useImageGalleryMotion();
	const galleryMotion = $derived(resolveMotion(undefined, { motion: theme?.motion }).in);
	const transitionDuration = $derived(galleryMotion.duration ?? 0);
	const transitionEasing = $derived(easingBezierStrings[galleryMotion.easing ?? 'cubicOut']);
	const state = new ImageGalleryState({
		get imageSelector() {
			return imageSelector;
		},
		get isOpen() {
			return openState.value;
		},
		set isOpen(value) {
			openState.value = value;
		},
		get activeIndex() {
			return activeIndex;
		},
		set activeIndex(value) {
			activeIndex = value;
		},
		get disabled() {
			return disabled;
		},
		get zoomMargin() {
			return zoomMargin;
		},
		get transitionDuration() {
			return transitionDuration;
		},
		get transitionEasing() {
			return transitionEasing;
		},
		get closeOnClickOutside() {
			return closeOnClickOutside;
		},
		get closeOnEscape() {
			return closeOnEscape;
		},
		get lockScroll() {
			return lockScroll;
		},
		get buttonLabel() {
			return buttonLabel ?? t.openImageGallery;
		},
		get closeLabel() {
			return closeLabel ?? t.closeImageGallery;
		},
		get previousLabel() {
			return previousLabel ?? t.previousImage;
		},
		get nextLabel() {
			return nextLabel ?? t.nextImage;
		},
		get messages() {
			return t;
		},
		get licenseKey() {
			return licenseKey;
		},
		get hasCustomCaption() {
			return caption !== undefined;
		},
		get onOpenChange() {
			return onOpenChange;
		},
		get onIndexChange() {
			return onIndexChange;
		},
		get onAfterOpen() {
			return onAfterOpen;
		},
		get onAfterClose() {
			return onAfterClose;
		}
	});
</script>

<div
	{@attach state.attachRoot({
		imageSelector,
		disabled,
		zoomMargin,
		transitionDuration,
		transitionEasing,
		closeOnClickOutside,
		closeOnEscape,
		lockScroll,
		buttonLabel: buttonLabel ?? t.openImageGallery,
		closeLabel: closeLabel ?? t.closeImageGallery,
		previousLabel: previousLabel ?? t.previousImage,
		nextLabel: nextLabel ?? t.nextImage,
		licenseKey,
		hasCustomCaption: caption !== undefined
	})}
	{id}
	class={classes.root({ className })}
	data-image-gallery-root
	{...attachments}
>
	<Slot render={children} payload={state.payload} />
</div>

{#if openState.value && caption}
	<Slot render={caption} payload={state.payload} class={classes.caption()} />
{/if}

<style>
	:global(.svelai-image-gallery .lg-outer) {
		box-sizing: border-box;
		padding-inline: var(--image-gallery-margin, 32px);
	}

	:global(.svelai-image-gallery .lg-content) {
		margin-inline: var(--image-gallery-margin, 32px);
	}
</style>
