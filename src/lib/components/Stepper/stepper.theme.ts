import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

// At rest the track is one viewport wide with only the shown panel laid out, so nothing overflows
// and nothing is clipped: rings and elevation shadows of content flush with the edge render in
// full. The root clips only while a step transition runs, when the track is `steps × 100%` wide
// and the outgoing panel slides through it while the height tweens.
export const defaultStepper = cva({
	base: 'relative w-full max-w-full min-w-0 transition-[height] data-[animating=true]:overflow-hidden',
	variants: {
		mode: {
			classic: '',
			vertical: ''
		}
	}
});

export const defaultStepperContainer = cva({
	base: 'pointer-events-none absolute top-0 left-0 grid min-w-0',
	variants: {
		mode: {
			classic: '',
			vertical: ''
		}
	}
});

export const defaultStepperStep = cva({
	// `starting:` gives a panel entering from `display:none` a before-change opacity, so it fades in
	// instead of appearing at full strength; the outgoing panel fades out through the same transition.
	base: 'pointer-events-none h-fit w-full min-w-0 flex-1 opacity-0 transition-opacity focus:outline-none data-[step-active=true]:pointer-events-auto data-[step-active=true]:opacity-100 starting:data-[step-active=true]:opacity-0',
	variants: {
		mode: {
			classic: '',
			vertical: ''
		}
	}
});

// The step track is translated by the Web Animations API, and the root's height plus
// each panel's opacity follow the same timing as CSS transitions. Only the resolved
// `duration` / `easing` are read — the fly/scale params are not used — so a
// `<Theme motion>` retune and reduced motion still own the pacing.
export const defaultStepperMotion = motion({
	base: {
		in: {},
		out: {},
		duration: 'slow',
		easing: 'standard'
	}
});

export const stepperTheme = {
	motion: defaultStepperMotion,
	root: defaultStepper,
	container: defaultStepperContainer,
	step: defaultStepperStep
};

export type StepperTheme = typeof stepperTheme;
export type StepperThemeProps = InferComponentTheme<StepperTheme>;
export const setStepperTheme = setComponentTheme<StepperTheme>('stepper');
export const useStepperTheme = useComponentTheme<StepperTheme>('stepper', stepperTheme);
export const useStepperMotion = () => useComponentMotion('stepper', defaultStepperMotion);
