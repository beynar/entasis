<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { portal } from '$lib/attachments/portal.js';
	import { fso } from '$lib/transitions/transition.js';
	import { openStateAttributes, transitionStatusAttributes } from '$lib/utils/stateAttributes.js';
	import Popover from '../Popover/Popover.svelte';
	import Button from '../Button/Button.svelte';
	import { xIcon } from '../Icons/x.js';
	import { spotlightPath } from './tour.geometry.js';
	import type { TourProps } from './tour.props.js';
	import { TourState, type TourPopup } from './tour.state.svelte.js';
	import { useTourMotion, useTourTheme } from './tour.theme.js';

	let {
		id: customId,
		steps,
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		onAfterOpen,
		onAfterClose,
		step = $bindable(),
		defaultStep = 0,
		onStepChange,
		modal = false,
		overlay = true,
		size = 'normal',
		position = 'bottom',
		padding = 8,
		radius = 'auto',
		missingTarget = 'skip',
		targetTimeout = 3000,
		interactiveTarget = true,
		closeOnBackdropPress = false,
		closeOnEscape = true,
		keyboardNavigation = true,
		progress = 'count',
		skippable = true,
		closeButton = true,
		arrow = true,
		scrollIntoView = true,
		labels,
		children,
		class: className,
		theme,
		...attachments
	}: TourProps = $props();

	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);
	const stepState = createBindableValue(
		() => step,
		(next) => {
			step = next;
		},
		() => defaultStep
	);

	const uid = $props.id();
	const t = $derived(useI18n());
	const classes = $derived(useTourTheme(theme));
	const resolveMotion = useTourMotion();
	const motion = $derived({
		backdrop: resolveMotion({ part: 'backdrop' }, { motion: theme?.motion }),
		spotlight: resolveMotion({ part: 'spotlight' }, { motion: theme?.motion })
	});

	const tour = new TourState({
		get id() {
			return customId || uid;
		},
		get steps() {
			return steps;
		},
		get isOpen() {
			return openState.value;
		},
		set isOpen(value) {
			openState.value = value;
		},
		get step() {
			return stepState.value;
		},
		set step(value) {
			stepState.value = value;
		},
		get onOpenChange() {
			return onOpenChange;
		},
		get onAfterOpen() {
			return onAfterOpen;
		},
		get onAfterClose() {
			return onAfterClose;
		},
		get onStepChange() {
			return onStepChange;
		},
		get modal() {
			return modal;
		},
		get padding() {
			return padding;
		},
		get radius() {
			return radius;
		},
		get missingTarget() {
			return missingTarget;
		},
		get targetTimeout() {
			return targetTimeout;
		},
		get closeOnEscape() {
			return closeOnEscape;
		},
		get closeOnBackdropPress() {
			return closeOnBackdropPress;
		},
		get keyboardNavigation() {
			return keyboardNavigation;
		},
		get scrollIntoView() {
			return scrollIntoView;
		},
		motion: () => motion
	});
	tour.announcement = (current, total, title) => t.tourStepAnnouncement(current, total, title);

	const text = $derived({
		next: labels?.next ?? t.tourNext,
		previous: labels?.previous ?? t.tourPrevious,
		done: labels?.done ?? t.tourDone,
		skip: labels?.skip ?? t.tourSkip,
		close: labels?.close ?? t.tourClose,
		progress:
			labels?.progress ?? ((current: number, total: number) => t.tourProgress(current, total))
	});

	// The backdrop only exists in the browser: its targets, portal and measurements do.
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	const backdropTransition = tour.lifecycle.transition(fso());

	const rootAttachment: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			tour.root = node;
			const offLayer = tour.layer.node(node);
			const offLive = tour.live.host(node);
			return () => {
				offLayer();
				offLive?.();
				if (tour.root === node) tour.root = null;
			};
		});

	/** Describes the popup's dialog by the step description, and keeps it for `inert` and focus. */
	const popupAttachment =
		(popup: TourPopup): Attachment<HTMLElement> =>
		(node) =>
			untrack(() => {
				popup.root = node;
				if (tour.hasDescription(popup))
					node.setAttribute('aria-describedby', tour.descriptionId(popup));
				return () => {
					if (popup.root === node) popup.root = null;
				};
			});

	const autofocus: Attachment<HTMLElement> = (node) => node.setAttribute('data-autofocus', '');
	const skipAutofocus: Attachment<HTMLElement> = (node) =>
		node.setAttribute('data-autofocus-skip', '');

	const spotlight = $derived(tour.spotlight);
	const currentStep = $derived(tour.current);
	const blocksTarget = $derived(
		!!spotlight && !(currentStep?.interactiveTarget ?? interactiveTarget)
	);
	const px = (value: number | undefined) => `${Math.round((value ?? 0) * 100) / 100}px`;
	const buttonSize = $derived(size === 'large' ? 'normal' : 'small');
</script>

{#if mounted && tour.isOpen}
	<div
		{@attach portal()}
		{@attach rootAttachment}
		{...attachments}
		data-entasis-tour
		class={classes.root()}
		style:z-index={tour.layer.zIndex}
		style:--spotlight-x={px(spotlight?.x)}
		style:--spotlight-y={px(spotlight?.y)}
		style:--spotlight-width={px(spotlight?.width)}
		style:--spotlight-height={px(spotlight?.height)}
		style:--spotlight-radius={px(spotlight?.radius)}
		{...openStateAttributes(tour.isOpen)}
		{...transitionStatusAttributes(tour.lifecycle.status)}
		data-step={tour.step}
		data-resolving={tour.status === 'resolving' ? '' : undefined}
		data-instant={tour.instant ? '' : undefined}
		data-centered={spotlight ? undefined : ''}
		data-modal={modal ? '' : undefined}
		in:backdropTransition={motion.backdrop.in}
		out:backdropTransition={motion.backdrop.out}
		onintroend={tour.lifecycle.introEnd}
		onoutroend={tour.lifecycle.outroEnd}
	>
		{#if overlay}
			<svg
				aria-hidden="true"
				class={classes.svg()}
				width={tour.viewport.width}
				height={tour.viewport.height}
			>
				<!-- The page around the hole. The hole is not painted, so a press there reaches the
				     target beneath; the painted part takes presses for the backdrop. -->
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<path
					data-tour-backdrop
					class={classes.backdrop()}
					fill-rule="evenodd"
					d={spotlightPath(tour.viewport, spotlight)}
					onclick={tour.pressBackdrop}
				/>
				{#if blocksTarget && spotlight}
					<rect
						data-tour-blocker
						class={classes.blocker()}
						x={spotlight.x}
						y={spotlight.y}
						width={spotlight.width}
						height={spotlight.height}
						rx={spotlight.radius}
					/>
				{/if}
			</svg>
		{:else if blocksTarget && spotlight}
			<svg aria-hidden="true" class={classes.svg()}>
				<rect
					data-tour-blocker
					class={classes.blocker()}
					x={spotlight.x}
					y={spotlight.y}
					width={spotlight.width}
					height={spotlight.height}
					rx={spotlight.radius}
				/>
			</svg>
		{/if}
	</div>
{/if}

{#each tour.popups as popup (popup.key)}
	{@const item = steps[popup.index]}
	{@const isLast = popup.index >= steps.length - 1}
	{@const resolving = tour.status === 'resolving' && popup === tour.currentPopup}
	<Popover
		trigger={false}
		ref={popup.target ?? tour.centerReference}
		positionPanel={popup.target ? undefined : tour.centerPanel}
		bind:open={popup.open}
		position={item?.position ?? position}
		{size}
		arrow={arrow && !!popup.target}
		focusOnOpen="first"
		focusOnClose={false}
		closeOnClickOutside={false}
		closeOnFocusOut={false}
		{closeOnEscape}
		lockScroll={false}
		labelledBy={tour.titleId(popup)}
		class={className}
		onOpenChange={tour.popupOpenChange(popup)}
		onAfterClose={() => tour.removePopup(popup)}
		{@attach popupAttachment(popup)}
	>
		<div
			class={classes.panel({ size })}
			data-step={popup.index}
			data-resolving={resolving ? '' : undefined}
			aria-busy={resolving ? 'true' : undefined}
		>
			{#if children}
				{@render children(tour.api)}
			{:else if item}
				<div class={classes.header()}>
					<h2 id={tour.titleId(popup)} class={classes.title({ size })}>{item.title}</h2>
					{#if closeButton}
						<Button
							squared
							size="small"
							variant="ghost"
							color="neutral"
							label={text.close}
							{@attach skipAutofocus}
							onclick={tour.pressClose}
						>
							{@render xIcon({ size: 16 })}
						</Button>
					{/if}
				</div>
				{#if item.content}
					<div id={tour.descriptionId(popup)} class={classes.description({ size })}>
						{@render item.content(tour.api)}
					</div>
				{:else if item.description}
					<p id={tour.descriptionId(popup)} class={classes.description({ size })}>
						{item.description}
					</p>
				{/if}
				<div class={classes.footer()}>
					{#if progress === 'count'}
						<span class={classes.progress()}>{text.progress(popup.index + 1, steps.length)}</span>
					{:else if progress === 'dots'}
						<span
							class={classes.dots()}
							role="img"
							aria-label={text.progress(popup.index + 1, steps.length)}
						>
							{#each steps as dotStep, index (dotStep.id ?? index)}
								<span class={classes.dot()} data-active={index === popup.index ? '' : undefined}
								></span>
							{/each}
						</span>
					{/if}
					<div class={classes.actions()}>
						{#if skippable && !isLast}
							<Button
								size={buttonSize}
								variant="ghost"
								color="neutral"
								{@attach skipAutofocus}
								onclick={(event) => tour.pressSkip(event)}
							>
								{text.skip}
							</Button>
						{/if}
						{#if popup.index > 0}
							<Button
								size={buttonSize}
								variant="outline"
								color="neutral"
								onclick={(event) => {
									if (popup === tour.currentPopup && !resolving) tour.pressPrevious(event);
								}}
							>
								{text.previous}
							</Button>
						{/if}
						<Button
							size={buttonSize}
							{@attach autofocus}
							onclick={(event) => {
								if (popup === tour.currentPopup && !resolving) tour.pressNext(event);
							}}
						>
							{isLast ? text.done : text.next}
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</Popover>
{/each}
