<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { MarqueeProps } from './marquee.props.js';
	import { useMarqueeTheme } from './marquee.theme.js';

	let {
		ref = $bindable(null),
		direction = 'left',
		children,
		innerClass = '',
		reverse = false,
		speed = 'fast',
		pauseOnHover = true,
		fade = true,
		numberOfCopies = 2,
		class: className = '',
		size = 'normal',
		theme,
		...attachments
	}: MarqueeProps = $props();

	type ElementSize = { width: number; height: number };
	const MAX_COPY_COUNT = 100;
	let rootSize = $state<ElementSize>({ width: 0, height: 0 });
	let copySize = $state<ElementSize>({ width: 0, height: 0 });

	const classes = $derived(useMarqueeTheme(theme));

	const animationDuration = $derived.by(() => {
		if (speed === 'fast') return '20s';
		if (speed === 'normal') return '40s';
		if (speed === 'slow') return '80s';
		return `${Math.max(0.1, speed)}s`;
	});

	const gap = $derived.by(() => {
		if (size === 'small') return '0.5rem';
		if (size === 'large') return '1.5rem';
		return '1rem';
	});
	const configuredCopyCount = $derived.by(() => {
		if (!Number.isFinite(numberOfCopies)) return 2;
		return Math.min(MAX_COPY_COUNT, Math.max(2, Math.floor(numberOfCopies)));
	});
	const requiredCopyCount = $derived.by(() => {
		const viewportExtent = direction === 'left' ? rootSize.width : rootSize.height;
		const copyExtent = direction === 'left' ? copySize.width : copySize.height;
		if (viewportExtent <= 0 || copyExtent <= 0) return 2;
		return Math.ceil(viewportExtent / copyExtent) + 1;
	});
	const copyIndexes = $derived(
		Array.from(
			{ length: Math.min(MAX_COPY_COUNT, Math.max(configuredCopyCount, requiredCopyCount)) },
			(_, index) => index
		)
	);

	function observeSize(update: (size: ElementSize) => void): Attachment<HTMLDivElement> {
		return (node) => {
			const measure = () => {
				const bounds = node.getBoundingClientRect();
				update({ width: bounds.width, height: bounds.height });
			};
			measure();
			const observer = new ResizeObserver(measure);
			observer.observe(node);
			return () => observer.disconnect();
		};
	}

	const observeRoot = observeSize((size) => (rootSize = size));
	const observeFirstCopy = observeSize((size) => (copySize = size));
</script>

<div
	bind:this={ref}
	role="presentation"
	data-slot="marquee"
	data-direction={direction}
	data-reverse={reverse ? 'true' : undefined}
	data-fade={fade ? 'true' : undefined}
	class={classes.root({ direction, size, fade, class: className })}
	style="--animation-duration: {animationDuration}; --gap: {gap};"
	{@attach observeRoot}
	{...attachments}
>
	{#each copyIndexes as index (index)}
		<div
			data-slot="marquee-copy"
			data-copy-index={index}
			aria-hidden={index === 0 ? undefined : 'true'}
			inert={index === 0 ? undefined : true}
			class={classes.inner({
				direction,
				size,
				pauseOnHover,
				reverse,
				class: innerClass
			})}
			{@attach index === 0 ? observeFirstCopy : null}
		>
			{#if typeof children === 'function'}
				{@render children()}
			{:else if children}
				{children}
			{/if}
		</div>
	{/each}
</div>

<style>
	@keyframes marquee-left {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(calc(-100% - var(--gap)));
		}
	}

	@keyframes marquee-up {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(calc(-100% - var(--gap)));
		}
	}

	:global(.animate-marquee-left) {
		animation: marquee-left var(--animation-duration, 20s) linear infinite;
		animation-direction: var(--marquee-animation-direction, normal);
		animation-play-state: var(--marquee-animation-play-state, running);
	}

	:global(.animate-marquee-up) {
		animation: marquee-up var(--animation-duration, 20s) linear infinite;
		animation-direction: var(--marquee-animation-direction, normal);
		animation-play-state: var(--marquee-animation-play-state, running);
	}

	/* Theme mirrors the reduced-motion preference (OS setting or `reduceMotion` prop) onto <html>. */
	:global(html[data-svelai-reduce-motion] .animate-marquee-left),
	:global(html[data-svelai-reduce-motion] .animate-marquee-up) {
		animation: none;
	}
</style>
