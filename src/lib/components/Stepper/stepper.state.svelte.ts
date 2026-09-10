import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import type { StepperProps } from './stepper.props.js';

type StepperKeyFramesOptions = NonNullable<StepperProps<unknown>['keyFramesOptions']>;

type StepperStateBindableProps = {
	value: number;
	items: unknown[];
	onValueChange?: (payload: { value: number; item: unknown }) => void;
	keyFramesOptions: StepperKeyFramesOptions;
};

type StepperStateProps<Item> = {
	value: number;
	items: Item[];
	onValueChange?: (payload: { value: number; item: Item }) => void;
	keyFramesOptions: StepperKeyFramesOptions;
};

export class StepperState<Item> extends createBindableStateClass<StepperStateBindableProps>() {
	destinationOffset = $state(0);
	stepAnimation = $state<Animation>();
	offsets = $state<number[]>([]);
	stepHeights = $state<number[]>([]);
	stepContainer: HTMLElement | null = null;
	declare value: number;
	declare keyFramesOptions: StepperKeyFramesOptions;
	visualStep = $state(0);
	isAnimating = $state(false);
	private targetStep: number | undefined;
	private animationRunId = 0;
	private rafId: number | null = null;

	constructor(props: StepperStateProps<Item>) {
		super(props as unknown as StepperStateBindableProps);
		this.visualStep = props.value;
	}

	get activeHeight() {
		return this.stepHeights[this.value];
	}

	measureStepHeights() {
		const steps = this.getSteps();
		if (steps.length === 0) return;
		this.stepHeights = steps.map((step) => step.clientHeight || 0);
	}

	setStepHeight(index: number, height: number) {
		if (this.stepHeights[index] === height) return;
		this.stepHeights[index] = height;
	}

	next = () => {
		this.goTo(this.value + 1);
	};

	previous = () => {
		this.goTo(this.value - 1);
	};

	goTo = (step: number) => {
		if (!this.canGoToStep(step)) return;
		if (step === this.value) {
			this.syncActiveStep(step);
			return;
		}
		this.value = step;
		this.translateToStep(step);
		this.notifyChange(step);
	};

	syncActiveStep(step: number) {
		if (!this.canGoToStep(step) || this.targetStep === step) return;
		this.translateToStep(step);
	}

	translate = () => {
		this.syncActiveStep(this.value);
	};

	scroller = (node: HTMLElement) => {
		const preventScroll = (event: Event) => {
			event.preventDefault();
			node.scrollTo(0, 0);
		};

		const setOffsets = () => {
			if (this.rafId) cancelAnimationFrame(this.rafId);
			this.rafId = requestAnimationFrame(() => {
				const steps = this.getSteps();
				this.offsets = steps.map((step) => step.offsetLeft);
				this.stepHeights = steps.map((step) => step.clientHeight || 0);
				if (!this.isAnimating) this.lockTransformToStep(this.value);
				this.rafId = null;
			});
		};

		node.addEventListener('scroll', preventScroll, { passive: false });
		node.scrollTo(0, 0);

		const resizeObserver = new ResizeObserver(setOffsets);
		resizeObserver.observe(node);
		const mutationObserver = new MutationObserver(setOffsets);
		mutationObserver.observe(node, { childList: true, subtree: true });
		setOffsets();

		return () => {
			node.removeEventListener('scroll', preventScroll);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			if (this.rafId) {
				cancelAnimationFrame(this.rafId);
				this.rafId = null;
			}
			this.cancelAnimations();
		};
	};

	canGoToStep = (targetStep: number): boolean => {
		return targetStep >= 0 && targetStep < this.items.length;
	};

	private translateToStep(step: number) {
		const offset = this.offsets[step];
		if (!this.stepContainer || offset == null || Number.isNaN(offset)) return;

		this.cancelStepAnimation();
		this.targetStep = step;
		if (this.shouldReduceMotion()) {
			this.lockTransformToStep(step);
			this.isAnimating = false;
			return;
		}

		const fromTransform = this.stepContainer.style.transform || 'translateX(0px)';
		const toTransform = `translateX(-${offset}px)`;
		this.destinationOffset = offset;
		this.stepAnimation = this.stepContainer.animate(
			[{ transform: fromTransform }, { transform: toTransform }],
			this.keyFramesOptions
		);
		this.isAnimating = true;
		const animationRunId = ++this.animationRunId;
		void Promise.allSettled([this.stepAnimation.finished]).then((results) => {
			if (this.animationRunId !== animationRunId) return;
			if (results[0]?.status === 'fulfilled') this.lockTransformToStep(step);
			this.stepAnimation = undefined;
			this.isAnimating = false;
		});
	}

	private lockTransformToStep(step: number) {
		const offset = this.offsets[step];
		if (!this.stepContainer || offset == null || Number.isNaN(offset)) return;
		this.destinationOffset = offset;
		this.stepContainer.style.transform = `translateX(-${offset}px)`;
		this.targetStep = step;
		this.visualStep = step;
	}

	private cancelAnimations() {
		this.animationRunId += 1;
		this.cancelStepAnimation();
		this.isAnimating = false;
	}

	private cancelStepAnimation() {
		this.freezeCurrentTransform();
		this.stepAnimation?.cancel();
		this.stepAnimation = undefined;
	}

	private freezeCurrentTransform() {
		if (!this.stepContainer) return;
		const currentTransform = getComputedStyle(this.stepContainer).transform;
		if (currentTransform && currentTransform !== 'none') {
			this.stepContainer.style.transform = currentTransform;
		}
	}

	private notifyChange(step: number) {
		if (!(step in this.items)) return;
		const onValueChange = this.onValueChange as
			((payload: { value: number; item: Item }) => void) | undefined;
		onValueChange?.({ value: step, item: (this.items as Item[])[step] });
	}

	private getSteps() {
		return this.stepContainer ? (Array.from(this.stepContainer.children) as HTMLElement[]) : [];
	}

	private shouldReduceMotion() {
		return (
			this.keyFramesOptions.duration <= 0 ||
			(typeof window !== 'undefined' &&
				window.matchMedia('(prefers-reduced-motion: reduce)').matches)
		);
	}
}
