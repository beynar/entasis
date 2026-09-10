<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import type { CollapsibleProps } from './collapsible.props.js';
	import { useCollapsibleTheme } from './collapsible.theme.js';
	import { slide, type SlideParams } from 'svelte/transition';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import { plusIcon } from '../Icons/plus.js';
	import { minusIcon } from '../Icons/minus.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

	let {
		ref = $bindable(),
		class: className,
		defaultOpen = false,
		open = $bindable(),
		disabled = false,
		onOpenChange,
		size = 'normal',
		icon = 'caret',
		theme,
		trigger,
		children,
		accessible,
		srOnlyContent,
		variant = 'default',
		peekHeight = 80,
		...attachments
	}: CollapsibleProps = $props();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);

	const id = $props.id();
	const isOpen = $derived(openState.value);

	const contentId = $derived(`${id}-content`);

	// Peek variant: content is always mounted, clipped to `peekHeight` and faded
	// when closed. `contentHeight` (measured) drives a smooth max-height animation.
	let contentHeight = $state(0);
	const peekHeightCss = $derived(typeof peekHeight === 'number' ? `${peekHeight}px` : peekHeight);
	const maskGradient = 'linear-gradient(to bottom, rgb(0 0 0) 35%, transparent 100%)';

	const handleToggle = () => {
		if (disabled) return;
		const newOpen = !isOpen;
		openState.value = newOpen;
		onOpenChange?.(newOpen);
	};

	const classes = $derived(useCollapsibleTheme(theme));

	const collapsibleState = $derived(isOpen ? 'open' : 'closed');

	function reducedMotionSlide(node: Element, params?: SlideParams) {
		const shouldReduceMotion = node.ownerDocument.defaultView?.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;
		return slide(node, { ...params, duration: shouldReduceMotion ? 0 : params?.duration });
	}
</script>

{#snippet triggerIcon()}
	{#if typeof icon === 'function'}
		<Slot render={icon} class={classes.icon({ size })} payload={{ open: isOpen }} />
	{:else if icon === 'math'}
		<div style:transform="rotate({isOpen ? '180' : '0'}deg)" class={classes.icon({ size })}>
			{@render (collapsibleState === 'open' ? plusIcon : minusIcon)({ size: 16 })}
		</div>
	{:else if icon === 'caret' || icon === 'chevron'}
		<div style:transform="rotate({isOpen ? '180' : '0'}deg)" class={classes.icon({ size })}>
			{@render caretDownIcon({ size: 16 })}
		</div>
	{/if}
{/snippet}

{#if variant === 'peek'}
	<div
		bind:this={ref}
		data-state={collapsibleState}
		data-disabled={disabled ? '' : undefined}
		data-size={size}
		data-variant="peek"
		class={classes.root({ size, className })}
		{...attachments}
	>
		<div class="relative">
			<div
				id={contentId}
				class="overflow-hidden transition-[max-height] duration-300 ease-out"
				style:max-height={isOpen ? `${contentHeight}px` : peekHeightCss}
				style:-webkit-mask-image={isOpen ? undefined : maskGradient}
				style:mask-image={isOpen ? undefined : maskGradient}
			>
				<div bind:clientHeight={contentHeight} class="pb-12">
					<Slot payload={{ open: isOpen }} render={children} />
				</div>
			</div>
			<div class="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
				<button
					type="button"
					aria-expanded={isOpen}
					aria-controls={contentId}
					data-state={collapsibleState}
					data-disabled={disabled ? '' : undefined}
					{disabled}
					class="state-layer border-neutral-muted bg-surface text-neutral/80 pointer-events-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-55"
					onclick={handleToggle}
				>
					<Slot render={trigger} payload={{ open: isOpen }} />
					{@render triggerIcon()}
				</button>
			</div>
		</div>
	</div>
{:else}
	<div
		bind:this={ref}
		data-state={collapsibleState}
		data-disabled={disabled ? '' : undefined}
		data-size={size}
		class={classes.root({ size, className })}
		{...attachments}
	>
		<button
			type="button"
			aria-expanded={isOpen}
			aria-controls={contentId}
			data-state={collapsibleState}
			data-disabled={disabled ? '' : undefined}
			{disabled}
			class={classes.trigger({ size, disabled })}
			onclick={handleToggle}
		>
			<Slot render={trigger} payload={{ open: isOpen }} />
			{@render triggerIcon()}
		</button>

		{#if isOpen}
			<div
				id={contentId}
				data-state={collapsibleState}
				data-disabled={disabled ? '' : undefined}
				class={classes.content({ size })}
				transition:reducedMotionSlide={{ duration: 200 }}
			>
				<Slot payload={{ open: isOpen }} render={children} />
			</div>
		{:else if accessible || srOnlyContent}
			<Slot render={srOnlyContent || children} payload={{ open: isOpen }} />
		{/if}
	</div>
{/if}
