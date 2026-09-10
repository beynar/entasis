<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { tick, untrack } from 'svelte';
	import Button from '../Button/Button.svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { OverlayProps } from './overlay.props.js';
	import { useOverlayTheme } from './overlay.theme.js';

	let {
		ref = $bindable(null),
		class: className,
		position = 'fill',
		align = 'center',
		showOn = 'always',
		defaultOpen = true,
		open = $bindable(),
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- The reserved state callback must not leak into DOM attributes; Overlay has no internal state action.
		onOpenChange: _onOpenChange,
		onAfterOpen,
		onAfterClose,
		scrim = true,
		size = 'normal',
		title,
		description,
		content,
		actions,
		children,
		theme,
		...attachments
	}: OverlayProps = $props();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);
	const isOpen = $derived(openState.value);

	const classes = $derived(useOverlayTheme(theme));
	let observedOpen = untrack(() => isOpen);
	let transitionSequence = 0;

	$effect(() => {
		const nextOpen = isOpen;
		if (nextOpen === observedOpen) return;
		observedOpen = nextOpen;
		const sequence = ++transitionSequence;
		void settleTransition(nextOpen, sequence);
	});

	async function settleTransition(nextOpen: boolean, sequence: number) {
		await tick();
		const animations = ref?.getAnimations?.({ subtree: true }) ?? [];
		await Promise.allSettled(animations.map((animation) => animation.finished));
		if (sequence !== transitionSequence || isOpen !== nextOpen) return;
		if (nextOpen) onAfterOpen?.();
		else onAfterClose?.();
	}
</script>

<div
	bind:this={ref}
	data-svelai-overlay
	data-open={isOpen}
	data-show-on={showOn}
	data-position={position}
	aria-hidden={!isOpen}
	inert={!isOpen ? true : undefined}
	class={classes.root({ position, open: isOpen, showOn, className })}
	{...attachments}
>
	{#if scrim && position === 'fill'}
		<div aria-hidden="true" class={classes.scrim({ position })}></div>
	{/if}

	<div
		data-overlay-content
		class={classes.content({ size, align, position, open: isOpen, showOn })}
	>
		{#if scrim && position !== 'fill'}
			<div aria-hidden="true" class={classes.scrim({ position })}></div>
		{/if}

		{#if children}
			{@render children()}
		{:else}
			{#if title != null || description != null}
				<div class={classes.header({ size })}>
					<Slot render={title} class={classes.title({ size })} />
					<Slot render={description} class={classes.description({ size })} />
				</div>
			{/if}

			<Slot render={content} class={classes.body({ size })} />

			{#if actions?.length}
				<div class={classes.actions({ size, align })}>
					{#each actions as action, index (index)}
						{@const { content: label, ...buttonProps } = action}
						<Button {...buttonProps}>{label}</Button>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	:global(:where(*:has(> [data-svelai-overlay]:first-child))) {
		position: relative;
		isolation: isolate;
	}

	:global(:where(*:has(> [data-svelai-overlay]:first-child)):hover)
		> [data-svelai-overlay][data-open='true'][data-show-on='hover'],
	:global(:where(*:has(> [data-svelai-overlay]:first-child)):focus-within)
		> [data-svelai-overlay][data-open='true'][data-show-on='hover'],
	:global(:where(*:has(> [data-svelai-overlay]:first-child)):focus-within)
		> [data-svelai-overlay][data-open='true'][data-show-on='focus'] {
		opacity: 1;
	}

	:global(:where(*:has(> [data-svelai-overlay]:first-child)):hover)
		> [data-svelai-overlay][data-open='true'][data-show-on='hover']
		> [data-overlay-content],
	:global(:where(*:has(> [data-svelai-overlay]:first-child)):focus-within)
		> [data-svelai-overlay][data-open='true'][data-show-on='hover']
		> [data-overlay-content],
	:global(:where(*:has(> [data-svelai-overlay]:first-child)):focus-within)
		> [data-svelai-overlay][data-open='true'][data-show-on='focus']
		> [data-overlay-content] {
		pointer-events: auto;
		translate: 0;
	}

	@media (hover: none) {
		:global([data-svelai-overlay][data-open='true'][data-show-on='hover']) {
			opacity: 1;
		}

		:global(
			[data-svelai-overlay][data-open='true'][data-show-on='hover'] > [data-overlay-content]
		) {
			pointer-events: auto;
			translate: 0;
		}
	}
</style>
