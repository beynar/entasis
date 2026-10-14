<script lang="ts">
	import type { AvatarProps, AvatarStatus } from './avatar.props.js';
	import { useAvatarTheme } from './avatar.theme.js';
	import Slot from '../Slot/Slot.svelte';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	let {
		src,
		alt,
		name,
		size = 'normal',
		loading = $bindable(false),
		suffix,
		prefix,
		image,
		fallbackDelay = 0,
		revealDelay,
		delay,
		class: className,
		theme,
		...attachments
	}: AvatarProps = $props();

	// Load success and failure are internal: a broken or pending image simply falls back to
	// the initials, so neither is part of the public prop surface the way `loading` is.
	let loaded = $state(false);
	let errored = $state(false);
	// Set once `fallbackDelay` has run out while the image is still loading.
	let fallbackReady = $state(false);

	// `delay` is the old name of `revealDelay`; the new prop wins when both are given.
	const effectiveRevealDelay = $derived(Math.max(0, revealDelay ?? delay ?? 0));
	const effectiveFallbackDelay = $derived(Math.max(0, fallbackDelay));

	const imageLoading = $derived.by<Attachment<HTMLImageElement>>(() => {
		const revealMs = effectiveRevealDelay;
		const fallbackMs = effectiveFallbackDelay;
		// Reading `src` here re-creates the attachment for every new image, which is what resets
		// the per-image state below: a failed URL must not decide the outcome of the next one.
		void src;

		return (image) => {
			let revealTimer: ReturnType<typeof setTimeout> | undefined;
			let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
			const setLoading = (next: boolean) => {
				if (untrack(() => loading) !== next) loading = next;
			};
			loaded = false;
			errored = false;
			fallbackReady = fallbackMs === 0;

			const clearFallbackTimer = () => {
				if (fallbackTimer === undefined) return;
				clearTimeout(fallbackTimer);
				fallbackTimer = undefined;
			};

			const clearRevealTimer = () => {
				if (revealTimer === undefined) return;
				clearTimeout(revealTimer);
				revealTimer = undefined;
			};

			const settle = (failed: boolean) => {
				clearFallbackTimer();
				errored = failed;
				loaded = !failed;
				setLoading(false);
			};

			const handleLoad = () => {
				clearRevealTimer();
				revealTimer = setTimeout(() => {
					settle(false);
					revealTimer = undefined;
				}, revealMs);
			};

			const handleError = () => {
				clearRevealTimer();
				settle(true);
			};

			image.addEventListener('load', handleLoad);
			image.addEventListener('error', handleError);

			if (image.complete) {
				settle(image.naturalWidth === 0 || image.naturalHeight === 0);
			} else {
				setLoading(true);
				if (fallbackMs > 0) {
					fallbackTimer = setTimeout(() => {
						fallbackTimer = undefined;
						fallbackReady = true;
					}, fallbackMs);
				}
			}

			return () => {
				clearRevealTimer();
				clearFallbackTimer();
				setLoading(false);
				image.removeEventListener('load', handleLoad);
				image.removeEventListener('error', handleError);
			};
		};
	});

	const classes = $derived(useAvatarTheme(theme));

	const initials = $derived(
		name
			?.split(' ')
			.map((word: string) => word[0])
			.join('') || ''
	);
	const status = $derived<AvatarStatus>(
		!src ? 'idle' : errored ? 'error' : loaded ? 'loaded' : 'loading'
	);
	// The initials wait for `fallbackDelay` while the image loads and are never rendered for an
	// image that arrives inside it. A failed image or a missing `src` shows them at once, and a
	// loaded image keeps already-visible initials mounted underneath for the crossfade.
	const showsInitials = $derived(
		status === 'idle' || status === 'error' || fallbackReady || effectiveFallbackDelay === 0
	);
	const decorative = $derived(alt === '');
</script>

<!-- The avatar is one image with one name: the `<img>` is empty-alt and the initials are
     hidden from assistive technology, so a loading, loaded or failed image reads the same. -->
<div
	data-avatar
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : (alt ?? name)}
	aria-hidden={decorative ? 'true' : undefined}
	class={classes.root({ size, className })}
	data-size={size}
	data-status={status}
	{...attachments}
>
	<Slot render={prefix} class={classes.avatarPrefix({ size })} />
	{#if src}
		<!-- The image stays mounted for as long as `src` is set: unmounting it on failure would
		     tear down the listeners that a later `src` needs. The initials cover it instead. -->
		<img {...image} {@attach imageLoading} {src} alt="" class={classes.avatarImage({ size })} />
	{/if}
	{#if showsInitials}
		<div aria-hidden="true" class={classes.avatarInitials({ size })}>
			{initials}
		</div>
	{/if}
	<Slot render={suffix} class={classes.avatarSuffix({ size })} />
</div>
