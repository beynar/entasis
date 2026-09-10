<script lang="ts">
	import { untrack } from 'svelte';
	import Rating from '../../Rating/Rating.svelte';
	import Field from '../Field/Field.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { RatingInputProps } from './ratingInput.props.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		theme,
		disabled,
		name,
		onValidate,
		onValueChange,
		visible,
		max = 5,
		allowHalf = false,
		readonly = false,
		clearable = true,
		dir,
		color = 'warning',
		star,
		i18n,
		label,
		...rest
	}: RatingInputProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();

	const field = createFieldState({
		id,
		get value() {
			return value;
		},
		set value(v) {
			value = v;
		},
		get errors() {
			return errors;
		},
		set errors(v: string[] | boolean) {
			errors = v;
		},
		get focused() {
			return focused;
		},
		set focused(v: boolean) {
			focused = v;
		},
		onValueChange: (v) => onValueChange?.(v),
		get disabled() {
			return disabled;
		},
		set disabled(v: boolean | undefined) {
			disabled = v;
		},
		get required() {
			return required;
		},
		get name() {
			return name;
		},
		set name(v: string | undefined) {
			name = v;
		},
		get onValidate() {
			return onValidate;
		},
		get visible() {
			return visible;
		},
		type: 'rating'
	});

	const t = $derived(useI18n(i18n));

	// onfocus/onblur only react to future events (unlike bind:focused, which syncs immediately on
	// mount). If the slider was focused before hydration (e.g. a keyboard user tabbed onto the SSR
	// markup), catch up once the node is bound.
	$effect(() => {
		const node = field.node;
		untrack(() => {
			if (node && document.activeElement === node && !field.focused) {
				field.focused = true;
			}
		});
	});

	// Field connects a visible label through aria-labelledby because this role="slider" element is
	// not labelable. Use a translated fallback when no visible label is present.
	const ariaLabel = $derived(typeof label === 'string' ? label : t.rating);

	// While hovering, preview the hovered value; otherwise show the committed value.
	let previewValue = $state<number | null>(null);
	const displayValue = $derived(previewValue ?? field.value ?? 0);
	const step = $derived(allowHalf ? 0.5 : 1);
	const interactive = $derived(!readonly && !field.disabled);

	// Resolve the effective reading direction: explicit prop, else the ambient direction.
	const isRtl = () => {
		if (dir) return dir === 'rtl';
		if (typeof window === 'undefined' || !field.node) return false;
		return getComputedStyle(field.node).direction === 'rtl';
	};

	// Compute the value a pointer event over `starIndex` (1-based) points at, honouring
	// half steps and the effective reading direction.
	const valueFromPointer = (event: MouseEvent, starIndex: number, element: HTMLElement) => {
		if (!allowHalf) return starIndex;
		const rect = element.getBoundingClientRect();
		const ratio = (event.clientX - rect.left) / rect.width;
		const leadingHalf = isRtl() ? ratio > 0.5 : ratio < 0.5;
		return leadingHalf ? starIndex - 0.5 : starIndex;
	};

	const commit = (next: number | null) => {
		if (!interactive) return;
		field.value = next;
	};

	const clamp = (next: number) => Math.min(Math.max(next, 0), max);

	const handlePointerMove = (event: PointerEvent & { currentTarget: HTMLSpanElement }) => {
		if (!interactive) return;
		const starIndex = Number(event.currentTarget.dataset.starIndex);
		previewValue = valueFromPointer(event, starIndex, event.currentTarget);
	};

	const handlePointerLeave = () => {
		previewValue = null;
	};

	const handleClick = (event: MouseEvent & { currentTarget: HTMLSpanElement }) => {
		if (!interactive) return;
		const starIndex = Number(event.currentTarget.dataset.starIndex);
		const next = valueFromPointer(event, starIndex, event.currentTarget);
		// Clicking the exact current value clears it when clearable.
		if (clearable && field.value === next) {
			commit(null);
		} else {
			commit(next);
		}
	};

	// Value semantics never flip in RTL: ArrowRight/Up always increase the number.
	const handleKeydown = (event: KeyboardEvent) => {
		if (!interactive) return;
		const current = field.value ?? 0;
		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowUp':
				event.preventDefault();
				commit(clamp(current + step));
				break;
			case 'ArrowLeft':
			case 'ArrowDown':
				event.preventDefault();
				commit(clamp(current - step));
				break;
			case 'Home':
				event.preventDefault();
				commit(null);
				break;
			case 'End':
				event.preventDefault();
				commit(max);
				break;
		}
	};
</script>

<Field {field} size={rest.size} {theme} {label} labelFor={false} {...rest}>
	<!-- The Rating display renders the stars; the slider role/aria/keyboard spread here overrides
	     its read-only defaults, turning it into the form control. -->
	<Rating
		bind:ref={field.node}
		value={displayValue}
		{max}
		{color}
		size={rest.size}
		{dir}
		{star}
		{theme}
		{interactive}
		disabled={field.disabled}
		onpointermove={handlePointerMove}
		onclick={handleClick}
		{id}
		role="slider"
		tabindex={readonly || field.disabled ? -1 : 0}
		aria-label={label ? undefined : ariaLabel}
		aria-valuemin={0}
		aria-valuemax={max}
		aria-valuenow={field.value ?? 0}
		aria-valuetext={`${field.value ?? 0} ${t.of} ${max}`}
		aria-orientation="horizontal"
		aria-readonly={readonly || undefined}
		aria-disabled={field.disabled || undefined}
		onkeydown={handleKeydown}
		onpointerleave={handlePointerLeave}
		onfocus={() => (field.focused = true)}
		onblur={() => (field.focused = false)}
	/>
</Field>
