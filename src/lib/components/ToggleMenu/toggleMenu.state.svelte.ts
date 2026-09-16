import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';

export const useToggleMenuOverflow = () => {
	let rootElement: HTMLElement | null = null;
	let railElement: HTMLElement | null = null;
	let moreElement: HTMLElement | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let frame: number | null = null;
	/** Unit elements by their index in the rail; holes appear as elements unmount. */
	const unitElements: Array<HTMLElement | undefined> = [];

	let visibleCount = $state(Number.POSITIVE_INFINITY);
	let hasOverflow = $state(false);

	function readPixels(value: string): number {
		const pixels = Number.parseFloat(value);
		return Number.isFinite(pixels) ? pixels : 0;
	}

	function measure(): void {
		frame = null;
		if (!rootElement || !railElement || !moreElement) return;

		const units = unitElements.filter((element): element is HTMLElement => element !== undefined);
		const rootStyle = getComputedStyle(rootElement);
		const railStyle = getComputedStyle(railElement);
		const contentWidth =
			rootElement.clientWidth -
			readPixels(rootStyle.paddingLeft) -
			readPixels(rootStyle.paddingRight);
		const unitGap = readPixels(railStyle.columnGap);
		const totalUnitsWidth = units.reduce(
			(width, element, index) => width + element.offsetWidth + (index > 0 ? unitGap : 0),
			0
		);

		if (totalUnitsWidth <= contentWidth + 1) {
			hasOverflow = false;
			visibleCount = units.length;
			return;
		}

		const toolbarGap = readPixels(rootStyle.columnGap);
		const availableUnitsWidth = Math.max(0, contentWidth - moreElement.offsetWidth - toolbarGap);
		let usedWidth = 0;
		let nextVisibleCount = 0;

		for (const unit of units) {
			const nextWidth = usedWidth + unit.offsetWidth + (nextVisibleCount > 0 ? unitGap : 0);
			if (nextWidth > availableUnitsWidth + 1) break;
			usedWidth = nextWidth;
			nextVisibleCount += 1;
		}

		hasOverflow = true;
		visibleCount = nextVisibleCount;
	}

	function scheduleMeasure(): void {
		if (frame !== null) cancelAnimationFrame(frame);
		frame = requestAnimationFrame(measure);
	}

	function observe(element: HTMLElement): void {
		resizeObserver?.observe(element);
	}

	function unobserve(element: HTMLElement): void {
		resizeObserver?.unobserve(element);
	}

	const rootReference: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			rootElement = node;
			resizeObserver = new ResizeObserver(scheduleMeasure);
			observe(node);
			if (railElement) observe(railElement);
			if (moreElement) observe(moreElement);
			for (const element of unitElements) if (element) observe(element);
			scheduleMeasure();

			return () => {
				if (frame !== null) cancelAnimationFrame(frame);
				resizeObserver?.disconnect();
				resizeObserver = null;
				rootElement = null;
			};
		});

	const railReference: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			railElement = node;
			observe(node);
			scheduleMeasure();

			return () => {
				unobserve(node);
				if (railElement === node) railElement = null;
			};
		});

	const moreReference: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			moreElement = node;
			observe(node);
			scheduleMeasure();

			return () => {
				unobserve(node);
				if (moreElement === node) moreElement = null;
			};
		});

	function unitReference(index: number): Attachment<HTMLElement> {
		return (node) =>
			untrack(() => {
				unitElements[index] = node;
				observe(node);
				scheduleMeasure();

				return () => {
					unobserve(node);
					if (unitElements[index] === node) unitElements[index] = undefined;
					scheduleMeasure();
				};
			});
	}

	return {
		rootReference,
		railReference,
		moreReference,
		unitReference,
		scheduleMeasure,
		get visibleCount() {
			return visibleCount;
		},
		get hasOverflow() {
			return hasOverflow;
		},
		isOverflowed: (index: number) => index >= visibleCount
	};
};
