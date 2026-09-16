import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { SvelteMap } from 'svelte/reactivity';
import { useDirection } from '$lib/utils/useDirection.svelte.js';
import { createPointerDrag, type PointerDragPayload } from '$lib/utils/pointerDrag.js';
import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import type { FieldValue } from '../Field/field.js';

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
	min?: number;
	max?: number;
	step?: number;
	thumbs?: number;
	minStepsBetweenThumbs?: number;
	orientation?: SliderOrientation;
	formatValue?: SliderFormatValue;
	disabled?: boolean;
	dragRange?: boolean;
	focused?: boolean;
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
	private thumbNodes = new SvelteMap<number, HTMLButtonElement>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Render-time attachment caches must not update reactive state.
	private thumbAttachments = new Map<number, Attachment<HTMLButtonElement>>();
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Render-time attachment caches must not update reactive state.
	private thumbHitboxAttachments = new Map<number, Attachment<HTMLElement>>();
	private documentHitboxDragCleanup: (() => void) | null = null;
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
	orientationValue = $derived<SliderOrientation>(
		this.orientation === 'vertical' ? 'vertical' : 'horizontal'
	);
	values = $derived.by(() => this.getNormalizedValues());
	isRange = $derived(this.values.length > 1);
	fieldType = $derived<'slider' | 'slider-range'>(this.isRange ? 'slider-range' : 'slider');
	fieldValue: SliderValue = $derived(
		this.isRange ? this.values : (this.values[0] ?? this.minValue)
	);
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
			this.endDrag();
		};
	};

	range: Attachment<HTMLElement> = (node) => {
		return this.rangeDrag(node);
	};

	thumb(index: number) {
		const cachedAttachment = this.thumbAttachments.get(index);
		if (cachedAttachment) return cachedAttachment;

		const attachment: Attachment<HTMLButtonElement> = (node) => {
			const drag = createPointerDrag<HTMLButtonElement>({
				disabled: () => this.isDisabled(),
				stopPropagation: true,
				onStart: () => this.startThumbPointerDrag(index, node),
				onMove: (payload) => this.updatePointerDrag(payload),
				onEnd: () => this.endDrag()
			});
			const offFocus = on(node, 'focus', () => this.focusThumb(index));
			const offBlur = on(node, 'blur', this.onThumbBlur);
			const offDrag = drag(node);
			const offKeyDown = on(node, 'keydown', (event) => this.onThumbKeyDown(event, index));
			this.thumbNodes.set(index, node);

			return () => {
				offFocus();
				offBlur();
				offDrag?.();
				offKeyDown();
				this.thumbNodes.delete(index);
			};
		};

		this.thumbAttachments.set(index, attachment);
		return attachment;
	}

	thumbHitbox(index: number) {
		const cachedAttachment = this.thumbHitboxAttachments.get(index);
		if (cachedAttachment) return cachedAttachment;

		const attachment: Attachment<HTMLElement> = (node) => {
			const drag = createPointerDrag<HTMLElement>({
				disabled: () => this.isDisabled(),
				stopPropagation: true,
				onStart: () => this.startThumbHitboxPointerDrag(index),
				onMove: (payload) => this.updatePointerDrag(payload),
				onEnd: () => this.endDrag()
			});

			return drag(node);
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

	getThumbBounds(index: number) {
		const previousValue = this.values[index - 1];
		const nextValue = this.values[index + 1];

		return {
			min:
				typeof previousValue === 'number'
					? this.normalize(previousValue + this.minDistance)
					: this.minValue,
			max:
				typeof nextValue === 'number' ? this.normalize(nextValue - this.minDistance) : this.maxValue
		};
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

	getClosestThumbIndex(value: number) {
		let closestIndex = 0;
		let closestDistance = Number.POSITIVE_INFINITY;
		this.values.forEach((thumbValue, index) => {
			const distance = Math.abs(thumbValue - value);
			if (distance < closestDistance) {
				closestIndex = index;
				closestDistance = distance;
			}
		});
		return closestIndex;
	}

	setThumbValue(index: number, nextValue: number) {
		const nextValues = [...this.values];
		const previousValue = nextValues[index - 1] ?? this.minValue - this.minDistance;
		const nextThumbValue = nextValues[index + 1] ?? this.maxValue + this.minDistance;
		const constrainedValue = Math.min(
			nextThumbValue - this.minDistance,
			Math.max(previousValue + this.minDistance, nextValue)
		);

		nextValues[index] = this.normalize(constrainedValue);
		this.setValues(nextValues);
	}

	setValues(nextValues: number[]) {
		const constrainedValues = this.constrainValues(nextValues);
		if (
			constrainedValues.length === this.values.length &&
			constrainedValues.every((value, index) => value === this.values[index])
		)
			return;
		if (this.thumbCount === 1) {
			this.value = constrainedValues[0] ?? this.minValue;
			return;
		}
		this.value = constrainedValues;
	}

	startTrackDrag(pointerValue: number) {
		const index = this.getClosestThumbIndex(pointerValue);
		this.setThumbValue(index, pointerValue);
		this.startThumbDrag(index);
		return index;
	}

	startThumbDrag(index: number) {
		this.activeThumb = index;
		this.dragState = { type: 'thumb', index };
	}

	startRangeDrag(pointerValue: number) {
		if (this.values.length <= 1) return false;
		this.dragState = {
			type: 'range',
			pointerValue,
			values: [...this.values]
		};
		return true;
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
		this.setThumbValue(this.dragState.index, pointerValue);
		return true;
	}

	endDrag() {
		this.dragState = null;
	}

	private getDirection = useDirection(() => this.trackNode);

	applyThumbKey(index: number, key: string, shiftKey: boolean) {
		const currentValue = this.values[index] ?? this.minValue;
		const stepSize = shiftKey ? this.stepValue * 10 : this.stepValue;
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
			nextValue = currentValue + this.stepValue * 10;
		} else if (key === 'PageDown') {
			nextValue = currentValue - this.stepValue * 10;
		} else if (key === 'Home') {
			nextValue = this.minValue;
		} else if (key === 'End') {
			nextValue = this.maxValue;
		} else {
			return false;
		}

		this.activeThumb = index;
		this.setThumbValue(index, nextValue);
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

	private getPointerValue(event: PointerEvent) {
		if (!this.trackNode) return null;

		const rect = this.trackNode.getBoundingClientRect();
		const size = this.orientationValue === 'vertical' ? rect.height : rect.width;
		if (size <= 0) return null;

		if (this.orientationValue === 'vertical') {
			const offset = rect.bottom - event.clientY;
			return this.getValueFromPercentage((offset / size) * 100);
		}

		const offset = event.clientX - rect.left;
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

		this.focusThumbNode(this.startTrackDrag(pointerValue));
	}

	private startThumbPointerDrag(index: number, node: HTMLButtonElement) {
		node.focus();
		this.startThumbDrag(index);
	}

	private startThumbHitboxPointerDrag(index: number) {
		this.focusThumbNode(index);
		this.startThumbDrag(index);
	}

	private startRangePointerDrag(payload: PointerDragPayload) {
		if (!this.dragRange || !this.isRange) return false;

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
		if (this.isDisabled()) return;

		if (this.applyThumbKey(index, event.key, event.shiftKey)) {
			event.preventDefault();
		}
	}

	private onThumbBlur = (event: FocusEvent) => {
		const relatedTarget = event.relatedTarget;
		if (relatedTarget instanceof Node && this.trackNode?.contains(relatedTarget)) return;
		this.focused = false;
		this.activeThumb = null;
	};

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
			if (rect.width <= 0 || rect.height <= 0) continue;
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
