<script lang="ts">
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import type { Attachment } from 'svelte/attachments';
	import type { SliderVariant } from './slider.props.js';
	import type { SliderOrientation, SliderValuePayload } from './slider.state.svelte.js';
	import type { useSliderTheme } from './slider.theme.js';

	type SliderClasses = ReturnType<typeof useSliderTheme>;

	let {
		id,
		payload,
		label,
		describedBy,
		orientation,
		disabled,
		readOnly,
		required,
		name,
		variant,
		color,
		size,
		classes,
		onRef,
		attachment,
		inputAttachment,
		hitboxAttachment
	}: {
		id: string;
		payload: SliderValuePayload;
		label?: string;
		describedBy?: string;
		orientation: SliderOrientation;
		disabled?: boolean;
		readOnly?: boolean;
		/** A value is required; a range input has no native `required`, so the thumb announces it. */
		required?: boolean;
		/** Submitted name of this thumb's range input. */
		name?: string;
		variant: SliderVariant;
		color: Colors;
		size?: Sizes;
		classes: SliderClasses;
		onRef?: (node: HTMLInputElement | null) => void;
		attachment: Attachment<HTMLElement>;
		inputAttachment: Attachment<HTMLInputElement>;
		hitboxAttachment: Attachment<HTMLElement>;
	} = $props();

	const getThumbHalfSize = () => {
		if (variant === 'thick') {
			if (size === 'small') return '10px';
			if (size === 'large') return '18px';
			return '14px';
		}
		if (variant === 'contained') {
			if (size === 'small') return '2px';
			if (size === 'large') return '4px';
			return '3px';
		}
		if (size === 'small') return '7px';
		if (size === 'large') return '10px';
		return '8px';
	};

	const getThickEdgeInset = () => '2px';
	const getThumbMinPosition = () => {
		const thumbHalfSize = getThumbHalfSize();
		if (variant === 'contained') return `calc(${thumbHalfSize} + 4px)`;
		if (variant !== 'thick') return thumbHalfSize;
		return `calc(${thumbHalfSize} + ${getThickEdgeInset()})`;
	};
	const getThumbMaxPosition = () => {
		const thumbHalfSize = getThumbHalfSize();
		if (variant === 'contained') return `calc(100% - ${thumbHalfSize} - 4px)`;
		if (variant !== 'thick') return `calc(100% - ${thumbHalfSize})`;
		return `calc(100% - ${thumbHalfSize} - ${getThickEdgeInset()})`;
	};

	const thumbPositionStyle = $derived.by(() => {
		const containedPosition = `clamp(${getThumbMinPosition()}, ${payload.percentage}%, ${getThumbMaxPosition()})`;
		// inset-inline-start mirrors a horizontal track in RTL, matching the mirrored arrow keys.
		return orientation === 'vertical'
			? `bottom: ${containedPosition};`
			: `inset-inline-start: ${containedPosition};`;
	});

	const registerRef = (node: HTMLInputElement) => {
		onRef?.(node);
		return () => onRef?.(null);
	};
</script>

<span
	{@attach hitboxAttachment}
	aria-hidden="true"
	data-slider-thumb-hitbox
	class={classes.thumbHitbox({
		orientation,
		disabled,
		readOnly,
		variant,
		size
	})}
	style={thumbPositionStyle}
></span>

<span
	{@attach attachment}
	data-slider-thumb-root
	data-disabled={disabled ? '' : undefined}
	data-readonly={readOnly ? '' : undefined}
	class={classes.thumb({
		orientation,
		disabled,
		readOnly,
		variant,
		color,
		size
	})}
	style={thumbPositionStyle}
>
	<!-- The one focus target. Pointer input goes through the thumb around it; assistive technology
	     adjusts the range input itself, which is what mobile screen-reader gestures need. -->
	<!-- aria-required on a slider is ARIA 1.3 (axe accepts it); a range input has no native `required`. -->
	<!-- svelte-ignore a11y_role_supports_aria_props_implicit -->
	<input
		{@attach registerRef}
		{@attach inputAttachment}
		{id}
		{name}
		type="range"
		data-slider-thumb
		class="pointer-events-none absolute inset-0 m-0 size-full opacity-0"
		aria-label={label}
		aria-describedby={describedBy}
		aria-orientation={orientation}
		aria-valuemin={payload.thumbMin}
		aria-valuemax={payload.thumbMax}
		aria-valuenow={payload.value}
		aria-valuetext={payload.formatted}
		aria-readonly={readOnly || undefined}
		aria-required={required || undefined}
		min={payload.thumbMin}
		max={payload.thumbMax}
		step={payload.step}
		value={payload.value}
		{disabled}
	/>
	<span
		aria-hidden="true"
		data-slider-thumb-visual
		class={classes.thumbVisual({
			orientation,
			variant,
			color,
			size
		})}
	></span>
</span>
