import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { SvelteMap } from 'svelte/reactivity';
import { useDirection } from '$lib/utils/useDirection.svelte.js';
import { createPointerDrag, type PointerDragPayload } from '$lib/utils/pointerDrag.js';
import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import type { FieldValue } from '../Field/field.js';
import type { SliderThumbCollisionBehavior } from './slider.props.js';

export type SliderValue = number | number[];
export type SliderOrientation = 'horizontal' | 'vertical';
export type SliderFormatValue = (value: number, index: number, values: number[]) => string;

export type SliderValuePayload = {
	value: number;
	values: number[];
	index: number;
	min: number;
	max: number;
	step: number;
	percentage: number;
	formatted: string;
	isRange: boolean;
	thumbMin: number;
	thumbMax: number;
};

export type SliderRangePayload = {
	values: number[];
	startValue: number;
	endValue: number;
	startPercentage: number;
	endPercentage: number;
	formatted: string;
};

type SliderDragState =
	| {
			type: 'thumb';
			index: number;
	  }
	| {
			type: 'range';
			pointerValue: number;
			values: number[];
	  };

type SliderStateOptions = {
	value?: SliderValue | null;
	mode?: 'single' | 'range';
	min?: number;
	max?: number;
	step?: number;
	largeStep?: number;
	thumbs?: number;
	minStepsBetweenThumbs?: number;
	thumbCollisionBehavior?: SliderThumbCollisionBehavior;
	thumbDisabled?: boolean[];
	orientation?: SliderOrientation;
	formatValue?: SliderFormatValue;
	disabled?: boolean;
	readOnly?: boolean;
	dragRange?: boolean;
	focused?: boolean;
	/** Receives the settled value (scalar or array, like the field value) when an interaction ends. */
	onValueCommit?: (value: SliderValue) => void;
};

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;
const DEFAULT_STEP = 1;

const getFiniteNumber = (value: number | null | undefined, fallback: number) =>
	typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const getDecimalPlaces = (value: number) => {
	const normalizedValue = value.toString().toLowerCase();
	if (normalizedValue.includes('e-')) {
		return Number(normalizedValue.split('e-')[1]);
	}
	return normalizedValue.split('.')[1]?.length ?? 0;
};

export class SliderState extends createBindableStateClass<SliderStateOptions>() {
	declare disabled?: boolean;
	declare dragRange?: boolean;
	declare focused?: boolean;
	activeThumb = $state<number | null>(null);
	dragState = $state<SliderDragState | null>(null);
	private trackNode: HTMLElement | null = null;
	private thumbNodes = new SvelteMap<number, HTMLInputElement>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Render-time attachment caches must not update reactive state.
	private thumbAttachments = new Map<number, Attachment<HTMLElement>>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Render-time attachment caches must not update reactive state.
	private thumbInputAttachments = new Map<number, Attachment<HTMLInputElement>>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Render-time attachment caches must not update reactive state.
	private thumbHitboxAttachments = new Map<number, Attachment<HTMLElement>>();
	private documentHitboxDragCleanup: (() => void) | null = null;
	// What the value was when the interaction in progress began. The commit compares against it,
	// so an interaction that ends where it started commits nothing.
	private dragFrom: number[] | null = null;
	private inputFrom: number[] | null = null;
	// Not reactive: `fieldValue` memoizes its array output here (see fieldValue).
	private arrayFieldValue: number[] | null = null;
	private trackDrag = createPointerDrag({
		disabled: () => this.isDisabled(),
		onStart: (payload) => this.startTrackPointerDrag(payload),
		onMove: (payload) => this.updatePointerDrag(payload),
		onEnd: () => this.endDrag()
	});
	private rangeDrag = createPointerDrag({
		disabled: () => this.isDisabled(),
		stopPropagation: true,
		onStart: (payload) => this.startRangePointerDrag(payload),
		onMove: (payload) => this.updatePointerDrag(payload),
		onEnd: () => this.endDrag()
	});

	minValue = $derived(getFiniteNumber(this.min, DEFAULT_MIN));
	maxValue = $derived(Math.max(this.minValue, getFiniteNumber(this.max, DEFAULT_MAX)));
	stepValue = $derived.by(() => {
		const step = getFiniteNumber(this.step, DEFAULT_STEP);
		return step > 0 ? step : DEFAULT_STEP;
	});
	valuePrecision = $derived(
		Math.max(getDecimalPlaces(this.minValue), getDecimalPlaces(this.stepValue))
	);
	thumbCount = $derived.by(() => {
		if (Array.isArray(this.value) && this.value.length > 0) return this.value.length;
		const thumbs = getFiniteNumber(this.thumbs, 1);
		return Math.max(1, Math.floor(thumbs));
	});
	minDistance = $derived.by(() => {
		const requestedDistance =
			Math.max(0, getFiniteNumber(this.minStepsBetweenThumbs, 0)) * this.stepValue;
		const availableDistance = this.maxValue - this.minValue;
		const maxDistance =
			this.thumbCount <= 1 ? requestedDistance : availableDistance / (this.thumbCount - 1);
		return Math.min(requestedDistance, maxDistance);
	});
	/** Amount PageUp, PageDown and Shift+Arrow move a thumb by. */
	largeStepSize = $derived.by(() => {
		const largeStep = getFiniteNumber(this.largeStep, 0);
		return largeStep > 0 ? largeStep : this.stepValue * 10;
	});
	collisionBehavior = $derived<SliderThumbCollisionBehavior>(
		this.thumbCollisionBehavior === 'push' || this.thumbCollisionBehavior === 'swap'
			? this.thumbCollisionBehavior
			: 'none'
	);
	orientationValue = $derived<SliderOrientation>(
		this.orientation === 'vertical' ? 'vertical' : 'horizontal'
	);
	values = $derived.by(() => this.getNormalizedValues());
	isRange = $derived(this.values.length > 1);
	/** Whether any single thumb is disabled on its own. */
	hasLockedThumb = $derived(this.values.some((_, index) => this.isThumbLocked(index)));
	/** The selected range moves as a unit only when every thumb is free to move. */
	canDragRange = $derived(!!this.dragRange && this.isRange && !this.hasLockedThumb);
	/** The value keeps an array shape (even with one thumb) when it arrived as one or is a range. */
	isArrayValue = $derived(
		Array.isArray(this.value) || this.mode === 'range' || this.thumbCount > 1
	);
	fieldType = $derived<'slider' | 'slider-range'>(this.isArrayValue ? 'slider-range' : 'slider');
	fieldValue: SliderValue = $derived.by(() => {
		if (!this.isArrayValue) return this.values[0] ?? this.minValue;
		// Reuse the last array handed out while it holds the same values: a Form bound to $state
		// writes the value back as a new deep proxy, and a new array per pass would never settle.
		// It stays plain data, never the proxied `value` prop, so callers can clone, post or keep it.
		const values = this.values;
		const previous = this.arrayFieldValue;
		if (
			previous?.length === values.length &&
			previous.every((item, index) => item === values[index])
		) {
			return previous;
		}
		this.arrayFieldValue = [...values];
		return this.arrayFieldValue;
	});
	startPercentage = $derived(this.getPercentage(this.values[0] ?? this.minValue));
	endPercentage = $derived(
		this.getPercentage(this.values[this.values.length - 1] ?? this.minValue)
	);
	valuePayloads: SliderValuePayload[] = $derived.by(() =>
		this.values.map((value, index) => this.getValuePayload(index, value))
	);
	valuePayload: SliderValuePayload = $derived(
		this.valuePayloads[0] ?? this.getValuePayload(0, this.minValue)
	);
	rangePayload: SliderRangePayload = $derived({
		values: this.values,
		startValue: this.values[0] ?? this.minValue,
		endValue: this.values[this.values.length - 1] ?? this.minValue,
		startPercentage: this.startPercentage,
		endPercentage: this.endPercentage,
		formatted: this.values
			.map((value, index) => this.getFormattedValue(value, index, this.values))
			.join(' - ')
	});

	constructor(options: SliderStateOptions) {
		super(options);
	}

	track: Attachment<HTMLElement> = (node) => {
		this.trackNode = node;
		const offDrag = this.trackDrag(node);
		const offPointerDown = on(node.ownerDocument, 'pointerdown', (event) =>
			this.onDocumentPointerDown(event)
		);

		return () => {
			offDrag?.();
			offPointerDown();
			this.cleanupDocumentHitboxDrag();
			this.trackNode = null;
			this.cancelDrag();
		};
	};

	range: Attachment<HTMLElement> = (node) => {
		return this.rangeDrag(node);
	};

	/** The pointer surface of a thumb: its visual wrapper, which holds the focusable range input. */
	thumb(index: number) {
		const cachedAttachment = this.thumbAttachments.get(index);
		if (cachedAttachment) return cachedAttachment;

		const attachment: Attachment<HTMLElement> = (node) => {
			const drag = createPointerDrag<HTMLElement>({
				disabled: () => this.isThumbDisabled(index),
				stopPropagation: true,
				onStart: () => this.startThumbHitboxPointerDrag(index),
				onMove: (payload) => this.updatePointerDrag(payload),
				onEnd: () => this.endDrag()
			});
			const offLocked = this.swallowLockedPress(node, index);
			const offDrag = drag(node);

			return () => {
				offLocked();
				offDrag?.();
			};
		};

		this.thumbAttachments.set(index, attachment);
		return attachment;
	}

	/** The focus target of a thumb: its visually hidden `<input type="range">`. */
	thumbInput(index: number) {
		const cachedAttachment = this.thumbInputAttachments.get(index);
		if (cachedAttachment) return cachedAttachment;

		const attachment: Attachment<HTMLInputElement> = (node) => {
			const offFocus = on(node, 'focus', () => this.focusThumb(index));
			const offBlur = on(node, 'blur', this.onThumbBlur);
			const offKeyDown = on(node, 'keydown', (event) => this.onThumbKeyDown(event, index));
			// Assistive technology adjusts a range input without key events, through `input`
			// while it moves and `change` once the adjustment is done.
			const offInput = on(node, 'input', () => this.onThumbInput(index));
			const offChange = on(node, 'change', () => this.flushInputCommit());
			this.thumbNodes.set(index, node);

			return () => {
				offFocus();
				offBlur();
				offKeyDown();
				offInput();
				offChange();
				if (this.thumbNodes.get(index) === node) this.thumbNodes.delete(index);
			};
		};

		this.thumbInputAttachments.set(index, attachment);
		return attachment;
	}

	thumbHitbox(index: number) {
		const cachedAttachment = this.thumbHitboxAttachments.get(index);
		if (cachedAttachment) return cachedAttachment;

		const attachment: Attachment<HTMLElement> = (node) => {
			const drag = createPointerDrag<HTMLElement>({
				disabled: () => this.isThumbDisabled(index),
				stopPropagation: true,
				onStart: () => this.startThumbHitboxPointerDrag(index),
				onMove: (payload) => this.updatePointerDrag(payload),
				onEnd: () => this.endDrag()
			});
			const offLocked = this.swallowLockedPress(node, index);
			const offDrag = drag(node);

			return () => {
				offLocked();
				offDrag?.();
			};
		};

		this.thumbHitboxAttachments.set(index, attachment);
		return attachment;
	}

	getNormalizedValues() {
		const rawValues = this.getRawValues();
		const normalizedValues = rawValues.map((value) => this.normalize(value)).sort((a, b) => a - b);
		return this.constrainValues(normalizedValues);
	}

	getRawValues() {
		if (Array.isArray(this.value) && this.value.length > 0) {
			return this.getAdjustedValueCount(this.value);
		}
		if (typeof this.value === 'number') {
			return this.getAdjustedValueCount([this.value]);
		}
		return this.getDefaultValues(this.thumbCount);
	}

	getAdjustedValueCount(values: number[]) {
		const sanitizedValues = values.filter((value) => Number.isFinite(value));
		if (sanitizedValues.length === this.thumbCount) return sanitizedValues;
		if (sanitizedValues.length > this.thumbCount) return sanitizedValues.slice(0, this.thumbCount);

		const defaults = this.getDefaultValues(this.thumbCount);
		return [...sanitizedValues, ...defaults.slice(sanitizedValues.length)];
	}

	getDefaultValues(count: number) {
		if (count <= 1) return [this.minValue];
		const range = this.maxValue - this.minValue;
		return Array.from({ length: count }, (_, index) =>
			this.normalize(this.minValue + (range * index) / (count - 1))
		);
	}

	constrainValues(values: number[]) {
		const nextValues = [...values];
		for (let index = 1; index < nextValues.length; index += 1) {
			nextValues[index] = Math.max(nextValues[index], nextValues[index - 1] + this.minDistance);
		}
		for (let index = nextValues.length - 2; index >= 0; index -= 1) {
			nextValues[index] = Math.min(nextValues[index], nextValues[index + 1] - this.minDistance);
		}
		return nextValues.map((value) => this.normalize(value));
	}

	normalize(value: number) {
		const clamped = this.clamp(value);
		const stepped =
			this.minValue + Math.round((clamped - this.minValue) / this.stepValue) * this.stepValue;
		return this.clamp(Number(stepped.toFixed(this.valuePrecision)));
	}

	normalizeDelta(delta: number) {
		const stepped = Math.round(delta / this.stepValue) * this.stepValue;
		return Number(stepped.toFixed(this.valuePrecision));
	}

	clamp(value: number) {
		return Math.min(this.maxValue, Math.max(this.minValue, value));
	}

	getPercentage(value: number) {
		const range = this.maxValue - this.minValue;
		if (range === 0) return 0;
		return ((this.clamp(value) - this.minValue) / range) * 100;
	}

	getValueFromPercentage(percentage: number) {
		const clampedPercentage = Math.min(100, Math.max(0, percentage));
		return this.normalize(
			this.minValue + ((this.maxValue - this.minValue) * clampedPercentage) / 100
		);
	}

	getFormattedValue(value: number, index: number, values: number[]) {
		return this.formatValue?.(value, index, values) ?? `${value}`;
	}

	getValuePayload(index: number, value = this.values[index] ?? this.minValue): SliderValuePayload {
		const thumbBounds = this.getThumbBounds(index);
		return {
			value,
			values: this.values,
			index,
			min: this.minValue,
			max: this.maxValue,
			step: this.stepValue,
			percentage: this.getPercentage(value),
			formatted: this.getFormattedValue(value, index, this.values),
			isRange: this.isRange,
			thumbMin: thumbBounds.min,
			thumbMax: thumbBounds.max
		};
	}

	/**
	 * The range a thumb can move within. A thumb is stopped by the thumbs that block it: its
	 * neighbours when thumbs stop at each other, and a disabled thumb in every mode. Pushing needs
	 * room for each thumb it moves along, so its bounds leave that room.
	 */
	getThumbBounds(index: number) {
		const values = this.values;
		const gap = this.minDistance;
		const behavior = this.collisionBehavior;
		const pushes = behavior === 'push';
		const blocks = (other: number) => behavior === 'none' || this.isThumbLocked(other);

		let below = index - 1;
		while (below >= 0 && !blocks(below)) below -= 1;
		let above = index + 1;
		while (above < values.length && !blocks(above)) above += 1;

		const lower =
			below < 0
				? pushes
					? this.minValue + index * gap
					: this.minValue
				: values[below] + (pushes ? index - below : 1) * gap;
		const upper =
			above >= values.length
				? pushes
					? this.maxValue - (values.length - 1 - index) * gap
					: this.maxValue
				: values[above] - (pushes ? above - index : 1) * gap;

		return { min: this.normalize(lower), max: this.normalize(upper) };
	}

	markPayload(mark: { value: number }) {
		const value = this.clamp(mark.value);
		return {
			...this.valuePayload,
			value,
			percentage: this.getPercentage(value),
			formatted: this.getFormattedValue(value, 0, this.values)
		};
	}

	/** The enabled thumb nearest to `value`, or null when none can move. */
	getClosestThumbIndex(value: number) {
		let closestIndex: number | null = null;
		let closestDistance = Number.POSITIVE_INFINITY;
		this.values.forEach((thumbValue, index) => {
			if (this.isThumbLocked(index)) return;
			const distance = Math.abs(thumbValue - value);
			if (distance < closestDistance) {
				closestIndex = index;
				closestDistance = distance;
			}
		});
		return closestIndex;
	}

	/**
	 * Moves a thumb toward `nextValue`, the way the collision behavior allows, and returns the
	 * index the thumb ends at. The index changes only when thumbs swap places.
	 */
	setThumbValue(index: number, nextValue: number): number {
		if (this.readOnly || this.isThumbDisabled(index)) return index;
		const bounds = this.getThumbBounds(index);
		if (bounds.min > bounds.max) return index;
		const gap = this.minDistance;
		const target = Math.min(bounds.max, Math.max(bounds.min, nextValue));
		const nextValues = [...this.values];

		if (this.collisionBehavior === 'swap') {
			// The thumb is re-inserted among the others where its new value falls, keeping the
			// minimum distance on both sides. A tie stays where the thumb is.
			const others = nextValues.filter((_, other) => other !== index);
			const before = others.filter((other) => other < target).length;
			const upTo = others.filter((other) => other <= target).length;
			const position = Math.min(upTo, Math.max(before, index));
			const lower = position > 0 ? others[position - 1] + gap : this.minValue;
			const upper = position < others.length ? others[position] - gap : this.maxValue;
			if (lower > upper) return index;
			others.splice(position, 0, this.normalize(Math.min(upper, Math.max(lower, target))));
			if (others.every((value, other) => value === this.values[other])) return index;
			this.setValues(others);
			return position;
		}

		nextValues[index] = this.normalize(target);
		if (this.collisionBehavior === 'push') {
			for (let other = index + 1; other < nextValues.length; other += 1) {
				nextValues[other] = Math.max(nextValues[other], nextValues[other - 1] + gap);
			}
			for (let other = index - 1; other >= 0; other -= 1) {
				nextValues[other] = Math.min(nextValues[other], nextValues[other + 1] - gap);
			}
		}
		this.setValues(nextValues.map((value) => this.normalize(value)));
		return index;
	}

	setValues(nextValues: number[]) {
		const constrainedValues = this.constrainValues(nextValues);
		if (
			constrainedValues.length === this.values.length &&
			constrainedValues.every((value, index) => value === this.values[index])
		)
			return;
		if (!this.isArrayValue) {
			this.value = constrainedValues[0] ?? this.minValue;
			return;
		}
		this.value = constrainedValues;
	}

	startTrackDrag(pointerValue: number) {
		const index = this.getClosestThumbIndex(pointerValue);
		if (index === null) return null;
		this.beginDrag();
		const thumb = this.setThumbValue(index, pointerValue);
		this.enterThumbDrag(thumb);
		return thumb;
	}

	startThumbDrag(index: number) {
		this.beginDrag();
		this.enterThumbDrag(index);
	}

	startRangeDrag(pointerValue: number) {
		if (this.values.length <= 1) return false;
		this.beginDrag();
		this.dragState = {
			type: 'range',
			pointerValue,
			values: [...this.values]
		};
		return true;
	}

	private beginDrag() {
		this.dragFrom = [...this.values];
	}

	private enterThumbDrag(index: number) {
		this.activeThumb = index;
		this.dragState = { type: 'thumb', index };
	}

	moveRange(delta: number) {
		if (this.values.length <= 1) return;
		const firstValue = this.dragState?.type === 'range' ? this.dragState.values[0] : this.values[0];
		const lastValue =
			this.dragState?.type === 'range'
				? this.dragState.values[this.dragState.values.length - 1]
				: this.values[this.values.length - 1];

		const minDelta = this.minValue - firstValue;
		const maxDelta = this.maxValue - lastValue;
		const clampedDelta = this.normalizeDelta(Math.min(maxDelta, Math.max(minDelta, delta)));
		const startValues = this.dragState?.type === 'range' ? this.dragState.values : this.values;
		this.setValues(startValues.map((value) => this.normalize(value + clampedDelta)));
	}

	updateDrag(pointerValue: number) {
		if (!this.dragState) return false;
		if (this.dragState.type === 'range') {
			this.moveRange(pointerValue - this.dragState.pointerValue);
			return true;
		}
		const index = this.dragState.index;
		const thumb = this.setThumbValue(index, pointerValue);
		if (thumb !== index) {
			// The thumbs swapped places: the drag, the focus and the highlight follow the one moving.
			this.enterThumbDrag(thumb);
			this.focusThumbNode(thumb);
		}
		return true;
	}

	/** Ends the drag, release or cancel alike, and commits the value if the drag changed it. */
	endDrag() {
		this.dragState = null;
		const from = this.dragFrom;
		this.dragFrom = null;
		if (from) this.commit(from);
	}

	/** Drops the drag without a commit: the slider went away mid-drag. */
	private cancelDrag() {
		this.dragState = null;
		this.dragFrom = null;
	}

	/** Reports the settled value, unless the interaction ended where it began. */
	private commit(from: number[]) {
		const values = this.values;
		if (from.length === values.length && from.every((value, index) => value === values[index])) {
			return;
		}
		this.onValueCommit?.(this.isArrayValue ? [...values] : (values[0] ?? this.minValue));
	}

	private flushInputCommit() {
		const from = this.inputFrom;
		this.inputFrom = null;
		if (from) this.commit(from);
	}

	private getDirection = useDirection(() => this.trackNode);

	applyThumbKey(index: number, key: string, shiftKey: boolean) {
		const currentValue = this.values[index] ?? this.minValue;
		const stepSize = shiftKey ? this.largeStepSize : this.stepValue;
		let nextValue: number;
		// Horizontal arrows follow the writing direction: in RTL, ArrowRight decreases.
		const rtl = this.orientationValue !== 'vertical' && this.getDirection() === 'rtl';
		const increase = rtl ? 'ArrowLeft' : 'ArrowRight';
		const decrease = rtl ? 'ArrowRight' : 'ArrowLeft';

		if (key === increase || key === 'ArrowUp') {
			nextValue = currentValue + stepSize;
		} else if (key === decrease || key === 'ArrowDown') {
			nextValue = currentValue - stepSize;
		} else if (key === 'PageUp') {
			nextValue = currentValue + this.largeStepSize;
		} else if (key === 'PageDown') {
			nextValue = currentValue - this.largeStepSize;
		} else if (key === 'Home') {
			nextValue = this.minValue;
		} else if (key === 'End') {
			nextValue = this.maxValue;
		} else {
			return false;
		}

		const thumb = this.setThumbValue(index, nextValue);
		this.activeThumb = thumb;
		if (thumb !== index) this.focusThumbNode(thumb);
		return true;
	}

	validate(
		value: FieldValue<'slider' | 'slider-range'>,
		onValidate?: (value: FieldValue<'slider' | 'slider-range'>) => string[] | boolean
	) {
		const values = Array.isArray(value) ? value : [value];
		if (
			values.some(
				(value) => typeof value !== 'number' || value < this.minValue || value > this.maxValue
			)
		) {
			return true;
		}
		return onValidate?.(value) || false;
	}

	private isDisabled() {
		return !!this.disabled;
	}

	/** Whether this thumb alone is disabled (not the whole slider). */
	isThumbLocked(index: number) {
		return !!this.thumbDisabled?.[index];
	}

	/** Whether this thumb cannot be moved: the slider or the thumb itself is disabled. */
	isThumbDisabled(index: number) {
		return this.isDisabled() || this.isThumbLocked(index);
	}

	/** A press on a disabled thumb does nothing, instead of falling through to the track. */
	private swallowLockedPress(node: HTMLElement, index: number) {
		return on(node, 'pointerdown', (event) => {
			if (this.isThumbLocked(index)) event.stopPropagation();
		});
	}

	private getPointerValue(event: PointerEvent) {
		if (!this.trackNode) return null;

		const rect = this.trackNode.getBoundingClientRect();
		const size = this.orientationValue === 'vertical' ? rect.height : rect.width;
		if (size <= 0) return null;

		if (this.orientationValue === 'vertical') {
			const offset = rect.bottom - event.clientY;
			return this.getValueFromPercentage((offset / size) * 100);
		}

		// The track mirrors in RTL (thumbs sit at inset-inline-start), so the minimum is the right edge.
		const offset =
			this.getDirection() === 'rtl' ? rect.right - event.clientX : event.clientX - rect.left;
		return this.getValueFromPercentage((offset / size) * 100);
	}

	private focusThumbNode(index: number) {
		const thumb =
			this.thumbNodes.get(index) ??
			this.trackNode?.querySelectorAll<HTMLElement>('[data-slider-thumb]')[index];
		thumb?.focus();
	}

	private focusThumb(index: number) {
		this.focused = true;
		this.activeThumb = index;
	}

	private startTrackPointerDrag(payload: PointerDragPayload) {
		const pointerValue = this.getPointerValue(payload.event);
		if (pointerValue === null) return false;

		const index = this.startTrackDrag(pointerValue);
		if (index === null) return false;
		this.focusThumbNode(index);
	}

	private startThumbHitboxPointerDrag(index: number) {
		this.focusThumbNode(index);
		this.startThumbDrag(index);
	}

	private startRangePointerDrag(payload: PointerDragPayload) {
		if (!this.canDragRange) return false;

		const pointerValue = this.getPointerValue(payload.event);
		if (pointerValue === null) return false;

		return this.startRangeDrag(pointerValue);
	}

	private updatePointerDrag(payload: PointerDragPayload) {
		if (this.isDisabled() || !this.dragState) return;

		const pointerValue = this.getPointerValue(payload.event);
		if (pointerValue === null) return;

		this.updateDrag(pointerValue);
	}

	private updatePointerEvent(event: PointerEvent) {
		if (this.isDisabled() || !this.dragState) return;

		const pointerValue = this.getPointerValue(event);
		if (pointerValue === null) return;

		this.updateDrag(pointerValue);
	}

	private onThumbKeyDown(event: KeyboardEvent, index: number) {
		if (this.isThumbDisabled(index)) return;

		const from = [...this.values];
		if (!this.applyThumbKey(index, event.key, event.shiftKey)) return;
		event.preventDefault();
		// Each accepted key is its own interaction; a key during a drag belongs to the drag.
		if (!this.dragState) this.commit(from);
	}

	/**
	 * Assistive technology adjusts the range input directly (a VoiceOver swipe, a TalkBack
	 * gesture) and sends no key events. The input's value is read as a request: the accepted
	 * value is written back, so a refused one (read-only, a blocked thumb) leaves the input
	 * showing what the slider holds.
	 */
	private onThumbInput(index: number) {
		const input = this.thumbNodes.get(index);
		if (!input) return;
		const requested = Number(input.value);
		let thumb = index;
		if (Number.isFinite(requested) && !this.isThumbDisabled(index)) {
			this.inputFrom ??= [...this.values];
			thumb = this.setThumbValue(index, requested);
		}
		for (const [other, node] of this.thumbNodes) {
			const accepted = `${this.values[other] ?? this.minValue}`;
			if (node.value !== accepted) node.value = accepted;
		}
		if (thumb !== index) this.focusThumbNode(thumb);
	}

	private onThumbBlur = (event: FocusEvent) => {
		// An adjustment whose `change` never came ends with the focus leaving.
		this.flushInputCommit();
		const relatedTarget = event.relatedTarget;
		if (relatedTarget instanceof Node && this.isInsideTrack(relatedTarget)) return;
		this.focused = false;
		this.activeThumb = null;
	};

	/** Containment that also holds when the slider sits in a shadow root. */
	private isInsideTrack(node: Node) {
		for (let current: Node | null = node; current;) {
			if (current === this.trackNode) return true;
			current = current.parentNode ?? (current instanceof ShadowRoot ? current.host : null);
		}
		return false;
	}

	private onDocumentPointerDown(event: PointerEvent) {
		if (event.button !== 0 || this.dragState || this.isDisabled() || !this.trackNode) return;
		if (event.target instanceof Node && this.trackNode.contains(event.target)) return;

		const hitboxIndex = this.getDocumentHitboxIndex(event);
		if (hitboxIndex === null) return;

		event.preventDefault();
		event.stopPropagation();
		this.focusThumbNode(hitboxIndex);
		this.startThumbDrag(hitboxIndex);
		this.startDocumentHitboxDrag(event);
	}

	private getDocumentHitboxIndex(event: PointerEvent) {
		if (!this.trackNode) return null;

		const hitboxes = this.trackNode.querySelectorAll<HTMLElement>('[data-slider-thumb-hitbox]');
		for (const [index, hitbox] of hitboxes.entries()) {
			const rect = hitbox.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0 || this.isThumbLocked(index)) continue;
			const isInside =
				event.clientX >= rect.left &&
				event.clientX <= rect.right &&
				event.clientY >= rect.top &&
				event.clientY <= rect.bottom;
			if (isInside) return index;
		}
		return null;
	}

	private startDocumentHitboxDrag(startEvent: PointerEvent) {
		const document = startEvent.view?.document ?? this.trackNode?.ownerDocument;
		if (!document) return;

		this.cleanupDocumentHitboxDrag();
		const pointerId = startEvent.pointerId;
		const onMove = (event: PointerEvent) => {
			if (event.pointerId !== pointerId) return;
			event.preventDefault();
			this.updatePointerEvent(event);
		};
		const onEnd = (event: PointerEvent) => {
			if (event.pointerId !== pointerId) return;
			event.preventDefault();
			this.cleanupDocumentHitboxDrag();
			this.endDrag();
		};

		const offPointerMove = on(document, 'pointermove', onMove);
		const offPointerUp = on(document, 'pointerup', onEnd);
		const offPointerCancel = on(document, 'pointercancel', onEnd);
		this.documentHitboxDragCleanup = () => {
			offPointerMove();
			offPointerUp();
			offPointerCancel();
			this.documentHitboxDragCleanup = null;
		};
	}

	private cleanupDocumentHitboxDrag() {
		this.documentHitboxDragCleanup?.();
	}
}
