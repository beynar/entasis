<script lang="ts" module>
	interface CustomEventMap {
		'network:indicator': CustomEvent<boolean>;
	}
	declare global {
		interface Document {
			addEventListener<K extends keyof CustomEventMap>(
				type: K,
				listener: (this: Document, ev: CustomEventMap[K]) => void
			): void;
			dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void;
			removeEventListener<K extends keyof CustomEventMap>(
				type: K,
				listener: (this: Document, ev: CustomEventMap[K]) => void
			): void;
		}
	}

	const dispatchNetworkIndicator = (loading: boolean) => {
		if (typeof document === 'undefined') return;

		document.dispatchEvent(
			new CustomEvent('network:indicator', {
				detail: loading
			})
		);
	};

	export const showNetworkIndicator = () => {
		dispatchNetworkIndicator(true);
	};

	export const hideNetworkIndicator = () => {
		dispatchNetworkIndicator(false);
	};

	export const toggleNetworkIndicator = () => {
		if (typeof document === 'undefined') return;

		const isLoading =
			document.querySelector('.ui-network-indicator')?.getAttribute?.('data-loading') === 'true';

		dispatchNetworkIndicator(!isLoading);
	};
</script>

<script lang="ts">
	import { navigating } from '$app/state';
	import { onMount } from 'svelte';
	import {
		finishBarAnimation,
		startBarLoopAnimation,
		startTrailAnimation,
		stopNetworkIndicatorAnimation,
		type NetworkIndicatorAnimationState
	} from './networkIndicator.animation.js';
	import type { NetworkIndicatorProps } from './networkIndicator.props.js';
	import { useNetworkIndicatorMotion, useNetworkIndicatorTheme } from './networkIndicator.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		class: className = '',
		color = 'neutral',
		height = 3,
		loading = false,
		variant = 'bar',
		trailGap = 0,
		label,
		ref = $bindable(),
		theme,
		...attachments
	}: NetworkIndicatorProps = $props();
	const t = $derived(useI18n());

	const animationState: NetworkIndicatorAnimationState = {
		node: null
	};
	let show = $state<boolean>(false);
	let shouldRender = $state(false);

	const classes = $derived(useNetworkIndicatorTheme(theme));
	// Pacing from `networkIndicatorTheme.motion`, keyed by `variant`, through the
	// override ladder (registry → `setNetworkIndicatorTheme` → instance `theme.motion`).
	const resolveMotion = useNetworkIndicatorMotion();
	const indicatorMotion = $derived(resolveMotion({ variant }, { motion: theme?.motion }).in);
	const duration = $derived(indicatorMotion.duration ?? 0);
	const easing = $derived(indicatorMotion.easing ?? 'cubicInOut');
	const isActive = $derived(!!(navigating.from || show || loading));
	const isTrailVariant = $derived(variant === 'trail' || variant === 'trail-bounce');

	$effect(() => {
		if (isActive) {
			shouldRender = true;
		}
	});

	$effect(() => {
		const node = ref;
		if (!node || !shouldRender) return;
		const signature = isTrailVariant
			? `${variant}:${duration}:${trailGap}`
			: `bar:${duration}:${easing}`;

		if (isTrailVariant) {
			const trailMode = variant === 'trail-bounce' ? 'trail-bounce' : 'trail';

			if (!isActive) {
				stopNetworkIndicatorAnimation(animationState);
				shouldRender = false;
				return;
			}
			if (
				animationState.mode !== trailMode ||
				animationState.node !== node ||
				animationState.signature !== signature
			) {
				stopNetworkIndicatorAnimation(animationState);
				animationState.stop = startTrailAnimation(animationState, node, {
					trailDuration: duration,
					trailGap,
					shouldBounce: trailMode === 'trail-bounce'
				});
				animationState.mode = trailMode;
				animationState.node = node;
				animationState.signature = signature;
			}
			return;
		}
		if (isActive) {
			if (
				animationState.mode !== 'bar-loop' ||
				animationState.node !== node ||
				animationState.signature !== signature
			) {
				stopNetworkIndicatorAnimation(animationState);
				animationState.stop = startBarLoopAnimation(animationState, node, { duration, easing });
				animationState.mode = 'bar-loop';
				animationState.node = node;
				animationState.signature = signature;
			}
			return;
		}
		if (animationState.mode !== 'bar-finish') {
			animationState.stop = finishBarAnimation(animationState, node, {
				duration,
				easing,
				onFinish: () => {
					shouldRender = false;
				}
			});
			animationState.mode = 'bar-finish';
			animationState.node = node;
			animationState.signature = undefined;
		}
	});

	const onNetworkIndicator = ({ detail }: CustomEvent<boolean>) => {
		if (detail) {
			show = true;
		} else {
			show = false;
		}
	};

	onMount(() => {
		document.addEventListener('network:indicator', onNetworkIndicator);
		return () => {
			document.removeEventListener('network:indicator', onNetworkIndicator);
			stopNetworkIndicatorAnimation(animationState);
		};
	});
</script>

{#if shouldRender}
	<div
		bind:this={ref}
		data-slot="network-indicator"
		data-color={color}
		data-loading={isActive}
		role="progressbar"
		aria-label={label ?? t.loading}
		class={classes.root({ color, variant, className })}
		style:height="{height}px"
		style:opacity={!isTrailVariant ? '0' : undefined}
		style:transform={!isTrailVariant ? 'scaleX(0)' : undefined}
		{...attachments}
	>
		{#if isTrailVariant}
			<span
				data-slot="network-indicator-segment"
				aria-hidden="true"
				class={classes.segment({ color })}
			></span>
		{/if}
	</div>
{/if}

<style>
	[data-slot='network-indicator-segment'] {
		left: 0;
		width: 36%;
		opacity: 0;
		will-change: left, opacity;
	}
</style>
