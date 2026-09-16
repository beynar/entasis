import { createBindableStateClass } from '$lib/utils/state.svelte.js';
import { easingBezierStrings } from '$lib/transitions/easingFunctions.js';
import type { StepperProps } from './stepper.props.js';
import { useStepperMotion, type StepperThemeProps } from './stepper.theme.js';

type StepperStateBindableProps = {
	value: number;
	items: unknown[];
	onValueChange?: (payload: { value: number; item: unknown; index: number }) => void;
	/** The instance `theme.motion` slot. */
	motion?: StepperThemeProps['motion'];
	/** The instance `transition` prop; wins over every motion override. */
	transition?: StepperProps<unknown>['transition'];
};

type StepperStateProps<Item> = {
	value: number;
	items: Item[];
	onValueChange?: (payload: { value: number; item: Item; index: number }) => void;
	motion?: StepperThemeProps['motion'];
	transition?: StepperProps<unknown>['transition'];
};

export class StepperState<Item> extends createBindableStateClass<StepperStateBindableProps>() {
	destinationOffset = $state(0);
	stepAnimation = $state<Animation>();
	offsets = $state<number[]>([]);
	stepHeights = $state<number[]>([]);
	stepContainer: HTMLElement | null = null;
	declare value: number;
	visualStep = $state(0);
	isAnimating = $state(false);
	// The track is one viewport wide at rest (only the active panel is laid out, in column one) and
	// widens to `steps × 100%` only for a slide, so nothing overflows the root and nothing needs a
	// resting clip. Expanding happens one flush before the slide starts.
	expanded = $state(false);
	private targetStep: number | undefined;
	private animationRunId = 0;
	private rafId: number | null = null;

	// Preset from `stepperTheme.motion`, through the override ladder (registry →
	// `setStepperTheme` → instance `theme.motion` → `transition` prop, which is how
	// Tabs forwards its own preset). Only duration/easing are used.
	private resolveMotion = useStepperMotion();
	/** WAAPI timing for the step track, shared with the CSS height/opacity transitions. */
	timing: KeyframeAnimationOptions = $derived.by(() => {
		const resolved = this.resolveMotion(undefined, {
			motion: this.motion,
			transition: this.transition
		});
		return {
			duration: resolved.in.duration ?? 0,
			easing: easingBezierStrings[resolved.in.easing ?? 'cubicInOut'],
			fill: 'both'
		};
	});

	constructor(props: StepperStateProps<Item>) {
		super(props as unknown as StepperStateBindableProps);
		this.visualStep = props.value;
	}

	// Inactive panels are `hidden`, so they measure 0 and the active one only reports its real
	// height a frame after it is revealed. The last non-zero measurement is kept so the root
	// animates from the previous height to the new one instead of collapsing in between.
	private lastActiveHeight = $state<number | undefined>(undefined);

	get activeHeight() {
		return this.stepHeights[this.value] || this.lastActiveHeight;
	}

	measureStepHeights() {
		const steps = this.getSteps();
		if (steps.length === 0) return;
		this.stepHeights = steps.map((step) => step.clientHeight || 0);
		this.rememberActiveHeight();
	}

	setStepHeight(index: number, height: number) {
		if (this.stepHeights[index] === height) return;
		this.stepHeights[index] = height;
		this.rememberActiveHeight();
	}

	private rememberActiveHeight() {
		const height = this.stepHeights[this.value];
		if (height) this.lastActiveHeight = height;
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
				// Every panel owns one column of a track that is `steps.length × 100%` wide, so a
				// step starts exactly one viewport further along. Reading `offsetLeft` instead
				// would collapse to 0 for the panels that are `hidden` while inactive.
				this.offsets = steps.map((_, index) => index * node.clientWidth);
				this.stepHeights = steps.map((step) => step.clientHeight || 0);
				this.rememberActiveHeight();
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
		if (!this.stepContainer || offset == null || Number.isNaN(offset)) {
			// Nothing can slide before the track is measured, so no panel is leaving: the shown
			// step is the requested one, and `setOffsets` locks the transform once it can.
			this.targetStep = step;
			this.visualStep = step;
			return;
		}

		this.cancelStepAnimation();
		this.targetStep = step;
		if (this.shouldReduceMotion()) {
			this.lockTransformToStep(step);
			this.isAnimating = false;
			return;
		}

		// Widen the track, put every panel in its own column and jump the track to the column the
		// user is looking at — written to the DOM synchronously, before the browser can paint, so
		// the slide starts from the resting picture without a frame of the collapsed layout. The
		// reactive `expanded` flag makes the template render the same values on its next flush.
		const from = this.offsets[this.visualStep] ?? 0;
		if (!this.expanded) {
			this.expanded = true;
			const steps = this.getSteps();
			this.stepContainer.style.width = `${Math.max(steps.length, 1) * 100}%`;
			this.stepContainer.style.gridTemplateColumns = `repeat(${Math.max(steps.length, 1)}, minmax(0, 1fr))`;
			steps.forEach((node, index) => {
				node.style.gridColumn = String(index + 1);
			});
			this.stepContainer.style.transform = `translateX(-${from}px)`;
		}
		const fromTransform = this.stepContainer.style.transform || `translateX(-${from}px)`;
		const toTransform = `translateX(-${offset}px)`;
		this.destinationOffset = offset;
		this.stepAnimation = this.stepContainer.animate(
			[{ transform: fromTransform }, { transform: toTransform }],
			this.timing
		);
		this.isAnimating = true;
		const animationRunId = ++this.animationRunId;
		void Promise.allSettled([this.stepAnimation.finished]).then((results) => {
			if (this.animationRunId !== animationRunId) return;
			// `fill: 'both'` keeps the animation's end transform in force over the inline style, so
			// drop the animation first: the collapsed rest layout written by `lockTransformToStep`
			// puts the shown panel at translate zero, not at the slide's end offset.
			const fulfilled = results[0]?.status === 'fulfilled';
			this.stepAnimation?.cancel();
			this.stepAnimation = undefined;
			if (fulfilled) this.lockTransformToStep(step);
			this.isAnimating = false;
		});
	}

	private lockTransformToStep(step: number) {
		const offset = this.offsets[step];
		if (!this.stepContainer || offset == null || Number.isNaN(offset)) return;
		this.destinationOffset = offset;
		// At rest the track collapses to one viewport with the shown panel in column one, written
		// to the DOM in the same frame the slide settles so the panel never moves twice.
		this.stepContainer.style.transform = 'translateX(0px)';
		this.stepContainer.style.width = '100%';
		this.stepContainer.style.gridTemplateColumns = 'repeat(1, minmax(0, 1fr))';
		this.getSteps().forEach((node) => {
			node.style.gridColumn = '1';
		});
		this.targetStep = step;
		this.visualStep = step;
		this.expanded = false;
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
			((payload: { value: number; item: Item; index: number }) => void) | undefined;
		onValueChange?.({ value: step, item: (this.items as Item[])[step], index: step });
	}

	private getSteps() {
		return this.stepContainer ? (Array.from(this.stepContainer.children) as HTMLElement[]) : [];
	}

	// The resolved duration is already 0 when the Theme reports a reduced-motion
	// preference, so this one check covers both.
	private shouldReduceMotion() {
		return Number(this.timing.duration ?? 0) <= 0;
	}
}
