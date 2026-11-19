<script lang="ts">
	// Two contents laid one over the other and a divider between them. The divider is a slider:
	// its value, steps, keys, drags and screen-reader adjustments are the Slider's own state,
	// driven here by a range input kept inside the divider. What this component adds is the
	// picture: the before side cut at the divider, and presses on the picture itself.
	import Chip from '../Chip/Chip.svelte';
	import { SliderState } from '../Form/Slider/slider.state.svelte.js';
	import { caretLeftIconFill } from '../Icons/caretLeft.js';
	import { caretRightIconFill } from '../Icons/caretRight.js';
	import { caretUpDownIcon } from '../Icons/caretUpDown.js';
	import { dotsSixVerticalIcon } from '../Icons/dotsSixVertical.js';
	import Slot from '../Slot/Slot.svelte';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { createPointerDrag, type PointerDragPayload } from '$lib/utils/pointerDrag.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { presence } from '$lib/utils/stateAttributes.js';
	import { useDirection } from '$lib/utils/useDirection.svelte.js';
	import type { BeforeAfterContent, BeforeAfterProps } from './beforeAfter.props.js';
	import { useBeforeAfterTheme } from './beforeAfter.theme.js';

	let {
		before,
		after,
		value = $bindable(),
		defaultValue = 50,
		onValueChange,
		onValueCommit,
		orientation = 'horizontal',
		ratio,
		labels = false,
		step = 1,
		largeStep = 10,
		variant = 'surface',
		color,
		handleVariant = 'grip',
		lineVariant = 'solid',
		labelVariant = 'solid',
		labelPosition = 'start',
		size = 'normal',
		disabled = false,
		readOnly = false,
		label,
		handle,
		id: idProp,
		ref = $bindable(null),
		class: className,
		theme,
		...attachments
	}: BeforeAfterProps = $props();

	// How long the divider takes to reach a press: the `fast` duration its transitions use.
	const GLIDE_MS = 150;

	const generatedId = $props.id();
	const t = $derived(useI18n());
	const classes = $derived(useBeforeAfterTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));
	const vertical = $derived(orientation === 'vertical');
	const locked = $derived(disabled || readOnly);

	const shown = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	// A slider counts from the bottom when vertical; the share shown counts from the top.
	const flip = (position: number) => (vertical ? 100 - position : position);

	const slider = new SliderState({
		get value() {
			return flip(shown.value);
		},
		set value(next) {
			if (typeof next !== 'number') return;
			const share = flip(next);
			if (share === shown.value) return;
			shown.value = share;
			onValueChange?.(share);
		},
		min: 0,
		max: 100,
		get step() {
			return step;
		},
		get largeStep() {
			return largeStep;
		},
		get orientation() {
			return orientation;
		},
		get disabled() {
			return disabled;
		},
		get readOnly() {
			return readOnly;
		},
		onValueCommit: (settled) => {
			if (typeof settled === 'number') onValueCommit?.(flip(settled));
		}
	});

	// The accepted value: within 0 to 100 and on a step, whatever was passed.
	const sliderValue = $derived(slider.values[0] ?? 0);
	const share = $derived(flip(sliderValue));
	const dragging = $derived(slider.dragState !== null && !readOnly);

	const getDirection = useDirection(() => ref);
	const rtl = $derived(!vertical && getDirection() === 'rtl');

	// The before side keeps what is before the divider; the divider's rail moves by the same share.
	const cut = $derived.by(() => {
		const rest = `${100 - share}%`;
		if (vertical) return `inset(0 0 ${rest} 0)`;
		return rtl ? `inset(0 0 0 ${rest})` : `inset(0 ${rest} 0 0)`;
	});
	const travel = $derived.by(() => {
		const offset = share - 50;
		if (vertical) return `0 ${offset}%`;
		return `${rtl ? -offset : offset}% 0`;
	});

	const names = $derived({
		before: (typeof labels === 'object' && labels.before) || t.beforeAfterBefore,
		after: (typeof labels === 'object' && labels.after) || t.beforeAfterAfter
	});
	const valueText = $derived(
		t.beforeAfterValueText(names.before, Math.round(share), names.after, Math.round(100 - share))
	);
	const aspectRatio = $derived(ratio?.replace('x', ' / '));

	/** The slider value under a pointer: along the comparison, from where the slider starts. */
	const sliderValueAt = (event: PointerEvent) => {
		if (!ref) return null;
		const box = ref.getBoundingClientRect();
		const length = vertical ? box.height : box.width;
		if (length <= 0) return null;
		const offset = vertical
			? box.bottom - event.clientY
			: getDirection() === 'rtl'
				? box.right - event.clientX
				: event.clientX - box.left;
		return slider.getValueFromPercentage((offset / length) * 100);
	};

	// A press away from the divider brings it there: it glides, then follows the pointer directly.
	let gliding = $state(false);
	let glideTimer: ReturnType<typeof setTimeout> | undefined;
	const bringTo = (event: PointerEvent) => {
		const target = sliderValueAt(event);
		if (target === null) return false;
		gliding = true;
		clearTimeout(glideTimer);
		glideTimer = setTimeout(() => (gliding = false), GLIDE_MS);
		return slider.startTrackDrag(target) !== null;
	};
	const follow = ({ event }: PointerDragPayload) => {
		const target = sliderValueAt(event);
		if (target !== null) slider.updateDrag(target);
	};
	$effect(() => () => clearTimeout(glideTimer));

	let input = $state<HTMLInputElement | null>(null);

	// Mouse and pen: a press anywhere on the picture moves the divider there and drags it.
	const press = createPointerDrag<HTMLElement>({
		disabled: () => locked,
		canStart: (event) => event.pointerType !== 'touch',
		onStart: ({ event }) => {
			if (!bringTo(event)) return false;
			input?.focus({ preventScroll: true });
		},
		onMove: follow,
		onEnd: () => slider.endDrag()
	});

	// Touch: a swipe along the axis drags the divider and a tap moves it there, while a swipe
	// across the axis stays the page's scroll. Nothing moves on the press itself.
	const swipe = createPointerDrag<HTMLElement>({
		disabled: () => locked,
		canStart: (event) => event.pointerType === 'touch',
		capture: 'on-activate',
		axis: () => (vertical ? 'y' : 'x'),
		shouldActivate: () => true,
		preventTouchMove: false,
		onStart: ({ event }) => bringTo(event),
		onMove: follow,
		onEnd: () => slider.endDrag(),
		onCancel: ({ event, hasMoved }) => {
			if (slider.dragState) return slider.endDrag();
			if (event.type === 'pointerup' && !hasMoved && bringTo(event)) slider.endDrag();
		}
	});

	// While a key moves the divider it glides too; a drag of the divider itself never does.
	const glides = $derived(gliding || slider.dragState === null);
</script>

{#snippet side(content: BeforeAfterContent)}
	{#if typeof content === 'function'}
		{@render content()}
	{:else}
		<img
			src={content.src}
			alt={content.alt}
			srcset={content.srcset}
			sizes={content.sizes}
			loading={content.loading ?? 'lazy'}
			draggable="false"
			class={classes.image()}
		/>
	{/if}
{/snippet}

{#snippet name(which: 'before' | 'after')}
	{#if labels}
		<span
			data-slot="before-after-label"
			class={classes.label({ side: which, orientation, position: labelPosition })}
		>
			<Chip size="small" variant={labelVariant}>{names[which]}</Chip>
		</span>
	{/if}
{/snippet}

<!-- A drag started on an image or a link inside would take the pointer away from the divider. -->
<div
	bind:this={ref}
	data-slot="before-after"
	data-orientation={orientation}
	data-color={resolvedColor}
	data-dragging={presence(dragging)}
	data-disabled={presence(disabled)}
	data-readonly={presence(readOnly)}
	class={classes.root({ orientation, interactive: !locked, className })}
	style:aspect-ratio={aspectRatio}
	ondragstart={(event) => event.preventDefault()}
	{@attach press}
	{@attach swipe}
	{...attachments}
>
	<!-- What the slider measures pointers and reads the writing direction on: the whole picture. -->
	<span {@attach slider.track} aria-hidden="true" class="pointer-events-none absolute inset-0"
	></span>
	<div data-slot="before-after-after" class={classes.side({ fill: !!ratio })}>
		{@render side(after)}
		{@render name('after')}
	</div>
	<div
		data-slot="before-after-before"
		class={classes.side({ fill: true, gliding: glides })}
		style:clip-path={cut}
	>
		{@render side(before)}
		{@render name('before')}
	</div>
	<div class={classes.rail({ orientation, gliding: glides })} style:translate={travel}>
		<div
			{@attach slider.thumb(0)}
			data-slot="before-after-handle"
			class={classes.handle({ orientation, interactive: !locked })}
		>
			<!-- The one focus target. Assistive technology adjusts the range input itself. -->
			<input
				bind:this={input}
				{@attach slider.thumbInput(0)}
				id={idProp ?? generatedId}
				type="range"
				class="pointer-events-none absolute inset-0 m-0 size-full opacity-0"
				aria-label={label ?? t.beforeAfterLabel}
				aria-orientation={orientation}
				aria-valuetext={valueText}
				aria-readonly={readOnly || undefined}
				min="0"
				max="100"
				{step}
				value={sliderValue}
				{disabled}
			/>
			<span
				aria-hidden="true"
				data-slot="before-after-line"
				class={classes.line({
					orientation,
					lineVariant,
					variant,
					size,
					bare: !handle && handleVariant === 'none'
				})}
			></span>
			{#if handle}
				<Slot render={handle} payload={{ value: share, dragging, orientation }} />
			{:else if handleVariant !== 'none'}
				<span
					aria-hidden="true"
					data-slot="before-after-grip"
					data-variant={handleVariant}
					class={classes.grip({ handleVariant, variant, size, orientation })}
				>
					{#if handleVariant === 'pill'}
						{@render dotsSixVerticalIcon()}
					{:else if handleVariant === 'arrows'}
						{@render caretLeftIconFill()}
						{@render caretRightIconFill()}
					{:else}
						{@render caretUpDownIcon()}
					{/if}
				</span>
			{/if}
		</div>
	</div>
</div>
