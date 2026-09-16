import type { EasingFunction } from 'svelte/transition';

const pow = Math.pow;
const sqrt = Math.sqrt;
const sin = Math.sin;
const cos = Math.cos;
const PI = Math.PI;
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * PI) / 3;
const c5 = (2 * PI) / 4.5;
export type Easing =
	| 'linear'
	| 'quadIn'
	| 'quadOut'
	| 'quadInOut'
	| 'cubicIn'
	| 'cubicOut'
	| 'cubicInOut'
	| 'quartIn'
	| 'quartOut'
	| 'quartInOut'
	| 'quintIn'
	| 'quintOut'
	| 'quintInOut'
	| 'sineIn'
	| 'sineOut'
	| 'sineInOut'
	| 'expoIn'
	| 'expoOut'
	| 'expoInOut'
	| 'circIn'
	| 'circOut'
	| 'circInOut'
	| 'backIn'
	| 'backOut'
	| 'backInOut'
	| 'elasticIn'
	| 'elasticOut'
	| 'elasticInOut'
	| 'bounceIn'
	| 'bounceOut'
	| 'bounceInOut';

const bounceOut: EasingFunction = function (x) {
	const n1 = 7.5625;
	const d1 = 2.75;

	if (x < 1 / d1) {
		return n1 * x * x;
	} else if (x < 2 / d1) {
		return n1 * (x -= 1.5 / d1) * x + 0.75;
	} else if (x < 2.5 / d1) {
		return n1 * (x -= 2.25 / d1) * x + 0.9375;
	} else {
		return n1 * (x -= 2.625 / d1) * x + 0.984375;
	}
};

export const backInOutBezierString = 'cubic-bezier(0.68, -0.55, 0.27, 1.55)';
export const easingBezierStrings = (<const>{
	linear: 'linear',
	quadIn: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
	quadOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
	quadInOut: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
	cubicIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
	cubicOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
	cubicInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
	quartIn: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
	quartOut: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
	quartInOut: 'cubic-bezier(0.77, 0, 0.175, 1)',
	quintIn: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
	quintOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
	quintInOut: 'cubic-bezier(0.86, 0, 0.07, 1)',
	sineIn: 'cubic-bezier(0.47, 0, 0.745, 0.715)',
	sineOut: 'cubic-bezier(0.39, 0.575, 0.565, 1)',
	sineInOut: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)',
	expoIn: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
	expoOut: 'cubic-bezier(0.19, 1, 0.22, 1)',
	expoInOut: 'cubic-bezier(1, 0, 0, 1)',
	circIn: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
	circOut: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
	circInOut: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
	backIn: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
	backOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
	backInOut: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
	elasticIn: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
	elasticOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
	elasticInOut: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
	bounceIn: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
	bounceOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
	bounceInOut: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)'
}) satisfies Record<string, string>;

export const easingFunctions = (<const>{
	linear: (x) => x,
	quadIn: (x) => x * x,
	quadOut: (x) => 1 - (1 - x) * (1 - x),
	quadInOut: (x) => (x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2),
	cubicIn: (x) => x * x * x,
	cubicOut: (x) => 1 - pow(1 - x, 3),
	cubicInOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2),
	quartIn: (x) => x * x * x * x,
	quartOut: (x) => 1 - pow(1 - x, 4),
	quartInOut: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - pow(-2 * x + 2, 4) / 2),
	quintIn: (x) => x * x * x * x * x,
	quintOut: (x) => 1 - pow(1 - x, 5),
	quintInOut: (x) => (x < 0.5 ? 16 * x * x * x * x * x : 1 - pow(-2 * x + 2, 5) / 2),
	sineIn: (x) => 1 - cos((x * PI) / 2),
	sineOut: (x) => sin((x * PI) / 2),
	sineInOut: (x) => -(cos(PI * x) - 1) / 2,
	expoIn: (x) => (x === 0 ? 0 : pow(2, 10 * x - 10)),
	expoOut: (x) => (x === 1 ? 1 : 1 - pow(2, -10 * x)),
	expoInOut: (x) =>
		x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2,
	circIn: (x) => 1 - sqrt(1 - pow(x, 2)),
	circOut: (x) => sqrt(1 - pow(x - 1, 2)),
	circInOut: (x) =>
		x < 0.5 ? (1 - sqrt(1 - pow(2 * x, 2))) / 2 : (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2,
	backIn: (x) => c3 * x * x * x - c1 * x * x,
	backOut: (x) => 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2),
	backInOut: (x) =>
		x < 0.5
			? (pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
			: (pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2,
	elasticIn: (x) => (x === 0 ? 0 : x === 1 ? 1 : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4)),
	elasticOut: (x) => (x === 0 ? 0 : x === 1 ? 1 : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1),
	elasticInOut: (x) =>
		x === 0
			? 0
			: x === 1
				? 1
				: x < 0.5
					? -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2
					: (pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5)) / 2 + 1,
	bounceIn: (x) => 1 - bounceOut(1 - x),
	bounceOut,
	bounceInOut: (x) => (x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2)
}) satisfies Record<Easing, EasingFunction>;
