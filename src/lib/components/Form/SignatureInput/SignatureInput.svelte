<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '../../Button/Button.svelte';
	import { arrowCounterClockwiseIcon } from '../../Icons/arrowCounterClockwise.js';
	import { eraserIcon } from '../../Icons/eraser.js';
	import { tooltip } from '../../Tooltip/tooltip.attachment.svelte.js';
	import Field from '../Field/Field.svelte';
	import FieldHiddenInputs from '../Field/FieldHiddenInputs.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { SignatureInputProps } from './signatureInput.props.js';
	import {
		exportStrokes,
		strokeShapes,
		type SignaturePoint,
		type SignatureStroke
	} from './signatureInput.strokes.js';
	import { useSignatureInputTheme } from './signatureInput.theme.js';

	let {
		defaultValue = null,
		value = $bindable(),
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		disabled,
		readOnly,
		messages,
		name,
		onValidate,
		onValueChange,
		visible,
		size = 'normal',
		format = 'png',
		inkColor = '#000000',
		strokeWidth = 2.5,
		placeholder,
		clearLabel,
		undoLabel,
		i18n,
		label,
		theme,
		...rest
	}: SignatureInputProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	const statusId = `${id}-status`;

	const field = createFieldState({
		id,
		get value() {
			return value;
		},
		set value(nextValue) {
			value = nextValue;
		},
		get errors() {
			return errors;
		},
		set errors(nextErrors: string[] | boolean) {
			errors = nextErrors;
		},
		get focused() {
			return focused;
		},
		set focused(nextFocused: boolean) {
			focused = nextFocused;
		},
		onValueChange: (nextValue) => onValueChange?.(nextValue),
		get disabled() {
			return disabled;
		},
		set disabled(nextDisabled: boolean | undefined) {
			disabled = nextDisabled;
		},
		get readOnly() {
			return readOnly;
		},
		get messages() {
			return messages;
		},
		get required() {
			return required;
		},
		get name() {
			return name;
		},
		set name(nextName: string | undefined) {
			name = nextName;
		},
		get onValidate() {
			return onValidate;
		},
		get visible() {
			return visible;
		},
		type: 'signature'
	});

	const t = $derived(useI18n(i18n));
	const classes = $derived(useSignatureInputTheme(theme));
	const interactive = $derived(!field.disabled && !field.readOnly);
	const resolvedClearLabel = $derived(clearLabel ?? t.signatureInputClear);
	const resolvedUndoLabel = $derived(undoLabel ?? t.signatureInputUndo);

	/** Finished strokes, drawn since the pad was last cleared. */
	let strokes = $state<SignatureStroke[]>([]);
	/** The stroke under the pointer, until the pointer is lifted. */
	let current = $state<SignaturePoint[] | null>(null);
	/** The value these strokes exported. Any other value came from outside. */
	let exported = $state<string | null>(null);

	// A value from outside (a saved signature, a reset) replaces the strokes: they no longer
	// describe it, so it shows as an image until someone draws again.
	$effect(() => {
		const nextValue = field.value ?? null;
		untrack(() => {
			if (nextValue === exported) return;
			strokes = [];
			current = null;
			exported = null;
		});
	});

	const hasInk = $derived(strokes.length > 0 || current !== null);
	const image = $derived(hasInk ? null : (field.value ?? null));
	const shapes = $derived(
		[...strokes, ...(current ? [current] : [])].flatMap((stroke) =>
			strokeShapes(stroke, strokeWidth)
		)
	);

	let pad = $state<HTMLDivElement | null>(null);
	let pointerId: number | null = null;

	const pointFrom = (event: PointerEvent): SignaturePoint => {
		const box = pad!.getBoundingClientRect();
		return {
			x: event.clientX - box.left,
			y: event.clientY - box.top,
			pressure: event.pointerType === 'pen' && event.pressure > 0 ? event.pressure : 0.5
		};
	};

	const commit = () => {
		const next = exportStrokes(strokes, {
			format,
			color: inkColor,
			width: strokeWidth,
			padding: strokeWidth * 2,
			scale: 2
		});
		exported = next;
		field.setValue(next);
	};

	const finishStroke = () => {
		if (!current) return;
		strokes = [...strokes, current];
		current = null;
		pointerId = null;
		commit();
	};

	const undo = () => {
		if (!interactive || strokes.length === 0) return;
		strokes = strokes.slice(0, -1);
		commit();
	};

	const clear = () => {
		if (!interactive || (!hasInk && !field.value)) return;
		strokes = [];
		current = null;
		exported = null;
		field.setValue(null);
		pad?.focus();
	};

	const onpointerdown = (event: PointerEvent) => {
		if (!interactive || !pad || current) return;
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		// The pad's `touch-action: none` and `user-select: none` keep the page from scrolling or
		// selecting under the stroke. The default is not prevented, so the browser focuses the pad
		// as for any click, without a keyboard focus ring.
		pointerId = event.pointerId;
		pad.setPointerCapture?.(event.pointerId);
		current = [pointFrom(event)];
	};

	const onpointermove = (event: PointerEvent) => {
		if (!current || event.pointerId !== pointerId) return;
		// Coalesced events carry the samples between frames, so a fast stroke stays round.
		const samples = event.getCoalescedEvents?.() ?? [];
		const next = [...current];
		for (const sample of samples.length ? samples : [event]) {
			const point = pointFrom(sample);
			const last = next[next.length - 1]!;
			if (Math.hypot(point.x - last.x, point.y - last.y) >= 1) next.push(point);
		}
		current = next;
	};

	const onpointerup = (event: PointerEvent) => {
		if (event.pointerId === pointerId) finishStroke();
	};

	// Delete or Backspace clears the pad, Ctrl/Cmd+Z undoes the last stroke.
	const onkeydown = (event: KeyboardEvent) => {
		if (!interactive) return;
		if (event.key === 'Delete' || event.key === 'Backspace') {
			if (!hasInk && !field.value) return;
			event.preventDefault();
			clear();
		} else if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
			if (strokes.length === 0) return;
			event.preventDefault();
			undo();
		}
	};

	// A pad disabled or made read-only mid-stroke drops the stroke it was drawing.
	$effect(() => {
		if (interactive) return;
		untrack(() => {
			current = null;
			pointerId = null;
		});
	});
</script>

<Field {field} {size} {theme} {label} labelFor={false} {...rest}>
	<div data-slot="signature-frame" class={classes.frame()}>
		<!-- The pad is the field's control: it takes focus and carries the label, the state and the
	     errors. Drawing is a pointer gesture; the buttons and the keys clear or undo it. -->
		<div
			bind:this={pad}
			{@attach (node) => {
				field.node = node;
				return () => {
					if (field.node === node) field.node = null;
				};
			}}
			{id}
			data-slot="signature-pad"
			data-filled={field.value ? 'true' : undefined}
			data-drawing={current ? 'true' : undefined}
			role="img"
			tabindex={field.disabled ? -1 : 0}
			aria-label={label ? undefined : t.signatureInput}
			aria-describedby={statusId}
			aria-disabled={field.disabled || undefined}
			class={classes.pad({
				size,
				interactive,
				disabled: !!field.disabled,
				hasError: field.hasError
			})}
			{onpointerdown}
			{onpointermove}
			{onpointerup}
			onpointercancel={onpointerup}
			onlostpointercapture={onpointerup}
			{onkeydown}
			onfocus={() => (field.focused = true)}
			onblur={() => (field.focused = false)}
		>
			{#if !hasInk && !image}
				<div
					data-slot="signature-placeholder"
					class={classes.placeholder({ size })}
					aria-hidden="true"
				>
					<span>×</span>
					<span>{placeholder ?? t.signatureInputPlaceholder}</span>
				</div>
			{/if}
			{#if image}
				<img data-slot="signature-image" src={image} alt="" class={classes.image()} />
			{/if}
			<svg data-slot="signature-ink" class={classes.ink()} aria-hidden="true" focusable="false">
				<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
					{#each shapes as shape, index (index)}
						{#if shape.kind === 'dot'}
							<circle cx={shape.x} cy={shape.y} r={shape.r} fill="currentColor" stroke="none" />
						{:else}
							<path d={shape.d} stroke-width={shape.width} />
						{/if}
					{/each}
				</g>
			</svg>
			<span id={statusId} class="sr-only">
				{field.value ? t.signatureInputSigned : t.signatureInputEmpty}
			</span>
		</div>
		{#if interactive && (hasInk || image)}
			<div data-slot="signature-actions" class={classes.actions()}>
				{#if strokes.length > 0}
					<Button
						variant="ghost"
						color="neutral"
						size="small"
						squared
						label={resolvedUndoLabel}
						onclick={undo}
						{@attach tooltip({ content: resolvedUndoLabel, position: 'top', size: 'small' })}
					>
						{@render arrowCounterClockwiseIcon({ size: 14 })}
					</Button>
				{/if}
				<Button
					variant="ghost"
					color="neutral"
					size="small"
					squared
					label={resolvedClearLabel}
					onclick={clear}
					{@attach tooltip({ content: resolvedClearLabel, position: 'top', size: 'small' })}
				>
					{@render eraserIcon({ size: 14 })}
				</Button>
			</div>
		{/if}
	</div>
	<FieldHiddenInputs {field} value={field.value} />
</Field>
