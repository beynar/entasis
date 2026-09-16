<script lang="ts">
	import type { AvatarProps } from './avatar.props.js';
	import { useAvatarTheme } from './avatar.theme.js';
	import Slot from '../Slot/Slot.svelte';
	import type { Attachment } from 'svelte/attachments';

	let {
		src,
		alt,
		name,
		size = 'normal',
		loading = $bindable(false),
		suffix,
		prefix,
		delay = 0,
		class: className,
		theme,
		...attachments
	}: AvatarProps = $props();

	// Load success and failure are internal: a broken or pending image simply falls back to
	// the initials, so neither is part of the public prop surface the way `loading` is.
	let loaded = $state(false);
	let errored = $state(false);

	const imageLoading = $derived.by<Attachment<HTMLImageElement>>(() => {
		const revealDelay = delay;
		// Reading `src` here re-creates the attachment for every new image, which is what resets
		// the per-image state below: a failed URL must not decide the outcome of the next one.
		void src;

		return (image) => {
			let revealTimer: ReturnType<typeof setTimeout> | undefined;
			const setLoading = (next: boolean) => {
				if (loading !== next) loading = next;
			};
			loaded = false;
			errored = false;

			const clearRevealTimer = () => {
				if (revealTimer === undefined) return;
				clearTimeout(revealTimer);
				revealTimer = undefined;
			};

			const settle = (failed: boolean) => {
				errored = failed;
				loaded = !failed;
				setLoading(false);
			};

			const handleLoad = () => {
				clearRevealTimer();
				revealTimer = setTimeout(() => {
					settle(false);
					revealTimer = undefined;
				}, revealDelay);
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
			}

			return () => {
				clearRevealTimer();
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
	const showsImage = $derived(!!src && loaded && !errored);
</script>

<div data-avatar class={classes.root({ size, className })} data-size={size} {...attachments}>
	<Slot render={prefix} class={classes.avatarPrefix({ size })} />
	{#if src}
		<!-- The image stays mounted for as long as `src` is set: unmounting it on failure would
		     tear down the listeners that a later `src` needs. The initials cover it instead. -->
		<img {@attach imageLoading} {src} alt={alt ?? name} class={classes.avatarImage({ size })} />
	{/if}
	{#if !showsImage}
		<div class={classes.avatarInitials({ size })}>
			{initials}
		</div>
	{/if}
	<Slot render={suffix} class={classes.avatarSuffix({ size })} />
</div>
