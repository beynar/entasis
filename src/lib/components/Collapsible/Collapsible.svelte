<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import type { CollapsibleProps } from './collapsible.props.js';
	import { useCollapsibleMotion, useCollapsibleTheme } from './collapsible.theme.js';
	import { slide } from '$lib/transitions/transition.js';
	import { easingBezierStrings } from '$lib/transitions/easingFunctions.js';
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
		icon = 'chevron',
		theme,
		trigger,
		children,
		accessible,
		srOnlyContent,
		variant = 'default',
		peekHeight = 80,
		transition,
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

	// Motion preset from `collapsibleTheme.motion`, through the override ladder
	// (registry → `setCollapsibleTheme` → instance `theme.motion` → `transition` prop).
	// `slide` is a factory: it captures the theme context at init because Svelte runs
	// transition functions outside component initialisation.
	const resolveMotion = useCollapsibleMotion();
	const slideTransition = slide();
	const contentMotion = $derived(resolveMotion({ variant }, { motion: theme?.motion, transition }));
</script>

{#snippet triggerIcon()}
	{#if icon === 'chevron'}
		<div style:transform="rotate({isOpen ? '180' : '0'}deg)" class={classes.icon({ size })}>
			{@render caretDownIcon({ size: 16 })}
		</div>
	{:else if icon === 'plus-minus'}
		<div style:transform="rotate({isOpen ? '180' : '0'}deg)" class={classes.icon({ size })}>
			{@render (collapsibleState === 'open' ? plusIcon : minusIcon)({ size: 16 })}
		</div>
	{:else if icon !== 'none'}
		<Slot render={icon} class={classes.icon({ size })} payload={{ open: isOpen }} />
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
				class="overflow-hidden transition-[max-height]"
				style:transition-duration={`${contentMotion.in.duration ?? 0}ms`}
				style:transition-timing-function={easingBezierStrings[
					contentMotion.in.easing ?? 'cubicOut'
				]}
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
					class="state-layer bg-surface text-neutral/80 raised-1 pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
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
				in:slideTransition={contentMotion.in}
				out:slideTransition={contentMotion.out}
			>
				<Slot payload={{ open: isOpen }} render={children} />
			</div>
		{:else if accessible || srOnlyContent}
			<Slot render={srOnlyContent || children} payload={{ open: isOpen }} />
		{/if}
	</div>
{/if}
