<script lang="ts">
	import { tick, untrack } from 'svelte';
	import Slot from '../Slot/Slot.svelte';
	import type { CollapsibleProps } from './collapsible.props.js';
	import { useCollapsibleMotion, useCollapsibleTheme } from './collapsible.theme.js';
	import { disclosurePanel } from '$lib/attachments/disclosurePanel.svelte.js';
	import { easingBezierStrings } from '$lib/transitions/easingFunctions.js';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import { plusIcon } from '../Icons/plus.js';
	import { minusIcon } from '../Icons/minus.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import {
		createOpenChangeDetails,
		requestOpenChange,
		type OpenChangeInit
	} from '$lib/utils/openChange.js';
	import {
		openStateAttributes,
		transitionStatusAttributes,
		type OpenTransitionStatus
	} from '$lib/utils/stateAttributes.js';

	let {
		ref = $bindable(),
		class: className,
		defaultOpen = false,
		open = $bindable(),
		disabled = false,
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		hiddenUntilFound = false,
		keepMounted = false,
		size = 'normal',
		icon = 'chevron',
		theme,
		trigger,
		children,
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
	let clipElement = $state<HTMLElement | null>(null);
	let contentElement = $state<HTMLElement | null>(null);
	const peekHeightCss = $derived(typeof peekHeight === 'number' ? `${peekHeight}px` : peekHeight);
	const maskGradient = 'linear-gradient(to bottom, rgb(0 0 0) 35%, transparent 100%)';

	// The one path to a state change: `onOpenChange` runs first and may cancel.
	function requestChange(next: boolean, init: OpenChangeInit) {
		if (next === isOpen) return;
		const details = createOpenChangeDetails(init);
		if (!requestOpenChange(onOpenChange ?? undefined, next, details)) return;
		openState.value = next;
	}

	const handleToggle = (event: MouseEvent) => {
		if (disabled) return;
		requestChange(!isOpen, {
			reason: 'trigger-press',
			event,
			trigger: event.currentTarget as HTMLElement
		});
	};

	const classes = $derived(useCollapsibleTheme(theme));

	const collapsibleState = $derived(isOpen ? 'open' : 'closed');

	// Motion preset from `collapsibleTheme.motion`, through the override ladder
	// (registry → `setCollapsibleTheme` → instance `theme.motion` → `transition` prop).
	const resolveMotion = useCollapsibleMotion();
	const contentMotion = $derived(resolveMotion({ variant }, { motion: theme?.motion, transition }));

	// Default variant: the panel's `hidden` state, height animation, find-in-page reveal and the
	// completion callbacks come from the shared disclosure panel.
	const panel = disclosurePanel({
		open: () => isOpen,
		// A disabled collapsible cannot be toggled, so it is not findable: its closed content stays
		// under plain `hidden`.
		hiddenUntilFound: () => hiddenUntilFound && !disabled,
		keepMounted: () => keepMounted || (hiddenUntilFound && disabled),
		motion: () => contentMotion,
		onBeforeMatch: (event) => {
			if (!disabled) requestChange(true, { reason: 'find-in-page', event });
		},
		// The peek variant renders no panel: it reports its own completion below.
		onAfterOpen: () => variant !== 'peek' && onAfterOpen?.(),
		onAfterClose: () => variant !== 'peek' && onAfterClose?.()
	});

	// Peek variant: the clip animates its max-height with a CSS transition, so completion is
	// the end of whatever animations that left running (none under reduced motion).
	let peekStatus = $state<OpenTransitionStatus>(untrack(() => (isOpen ? 'open' : 'closed')));
	let peekDirection = untrack(() => isOpen);
	let peekPhase = 0;

	$effect(() => {
		const next = isOpen;
		untrack(() => {
			if (next === peekDirection) return;
			peekDirection = next;
			if (variant !== 'peek') return;
			const phase = ++peekPhase;
			peekStatus = next ? 'entering' : 'exiting';
			void settlePeek(phase, next);
		});
	});

	async function settlePeek(phase: number, next: boolean) {
		await tick();
		const animations = clipElement?.getAnimations?.() ?? [];
		if (animations.length > 0) await Promise.allSettled(animations.map((a) => a.finished));
		if (phase !== peekPhase) return;
		peekStatus = next ? 'open' : 'closed';
		if (next) onAfterOpen?.();
		else onAfterClose?.();
	}

	// Closed peek content is clipped, not removed: controls below the visible preview would stay
	// tabbable while invisible, so they are inert until the content opens.
	const FOCUSABLE =
		'a[href],area[href],button,input,select,textarea,summary,iframe,[tabindex],[contenteditable]:not([contenteditable="false"]),audio[controls],video[controls]';

	$effect(() => {
		if (variant !== 'peek' || peekStatus !== 'closed') return;
		// Re-run when the content or the preview height changes.
		void contentHeight;
		void peekHeightCss;
		const clip = clipElement;
		const content = contentElement;
		if (!clip || !content) return;
		const inerted: Element[] = [];
		const limit = clip.getBoundingClientRect().bottom;
		for (const element of content.querySelectorAll(FOCUSABLE)) {
			if (element.hasAttribute('inert')) continue;
			if (element.getBoundingClientRect().top < limit) continue;
			element.setAttribute('inert', '');
			inerted.push(element);
		}
		return () => {
			for (const element of inerted) element.removeAttribute('inert');
		};
	});
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
		{...openStateAttributes(isOpen)}
		{...transitionStatusAttributes(peekStatus)}
		class={classes.root({ size, className })}
		{...attachments}
	>
		<div class="relative">
			<div
				bind:this={clipElement}
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
				<div bind:this={contentElement} bind:clientHeight={contentHeight} class="pb-12">
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
					{...openStateAttributes(isOpen)}
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
		{...openStateAttributes(isOpen)}
		{...transitionStatusAttributes(panel.status)}
		class={classes.root({ size, className })}
		{...attachments}
	>
		<button
			type="button"
			aria-expanded={isOpen}
			aria-controls={panel.rendered ? contentId : undefined}
			data-state={collapsibleState}
			data-disabled={disabled ? '' : undefined}
			{...openStateAttributes(isOpen)}
			{disabled}
			class={classes.trigger({ size, disabled })}
			onclick={handleToggle}
		>
			<Slot render={trigger} payload={{ open: isOpen }} />
			{@render triggerIcon()}
		</button>

		{#if panel.rendered}
			<!-- The panel stays bare: while it hides until found, only its content is skipped, so
			     the padding, gap and margin of the content slot live on the element inside. -->
			<div
				id={contentId}
				data-state={collapsibleState}
				data-disabled={disabled ? '' : undefined}
				{...panel.attributes}
				{@attach panel.attach}
			>
				<div
					data-state={collapsibleState}
					data-disabled={disabled ? '' : undefined}
					{...openStateAttributes(isOpen)}
					class={classes.content({ size })}
				>
					<Slot payload={{ open: isOpen }} render={children} />
				</div>
			</div>
		{/if}
	</div>
{/if}
