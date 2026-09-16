import { easingBezierStrings, type Easing } from '$lib/transitions/easingFunctions.js';

export type NetworkIndicatorAnimationMode = 'bar-loop' | 'bar-finish' | 'trail' | 'trail-bounce';

export type NetworkIndicatorAnimationState = {
	animation?: Animation;
	mode?: NetworkIndicatorAnimationMode;
	node: HTMLDivElement | null;
	signature?: string;
	stop?: () => void;
};

export function stopNetworkIndicatorAnimation(state: NetworkIndicatorAnimationState) {
	state.stop?.();
	state.stop = undefined;
	state.mode = undefined;
	state.node = null;
	state.signature = undefined;
}

export function startTrailAnimation(
	state: NetworkIndicatorAnimationState,
	node: HTMLDivElement,
	{
		trailDuration,
		trailGap,
		shouldBounce
	}: { trailDuration: number; trailGap: number; shouldBounce: boolean }
) {
	const segment = node.querySelector<HTMLElement>('[data-slot="network-indicator-segment"]');
	if (!segment) return () => {};

	// A reduced-motion preference resolves the duration to 0; hold the trail at rest
	// instead of looping a zero-length animation.
	if (trailDuration <= 0) {
		node.style.opacity = '1';
		node.style.transform = 'none';
		segment.style.left = '0';
		segment.style.opacity = '1';
		return () => {
			segment.style.opacity = '0';
		};
	}
	const travelDuration = Math.max(trailDuration, 1);
	const gapDuration = Math.max(trailGap, 0);
	const totalDuration = travelDuration + gapDuration;
	const travelOffset = travelDuration / totalDuration;
	const fadeInOffset = Math.min(0.03, travelOffset / 3);
	const fadeOutOffset = Math.max(fadeInOffset, travelOffset - Math.min(0.01, travelOffset / 3));
	let isCancelled = false;
	let direction: 'forward' | 'backward' = 'forward';

	state.animation?.cancel();
	node.style.opacity = '1';
	node.style.transform = 'none';

	const animateTrail = () => {
		const width = 24 + Math.random() * 22;
		let startLeft = '0%';
		let finishLeft = '100%';

		if (shouldBounce) {
			const outsideLeft = `-${width}%`;
			startLeft = direction === 'backward' ? '100%' : outsideLeft;
			finishLeft = direction === 'backward' ? outsideLeft : '100%';
		}

		segment.style.width = `${width}%`;
		state.animation = segment.animate(
			[
				{ left: startLeft, opacity: 0, offset: 0 },
				{ left: startLeft, opacity: 0.95, offset: fadeInOffset },
				{ left: finishLeft, opacity: 0.95, offset: fadeOutOffset },
				{ left: finishLeft, opacity: 0, offset: travelOffset },
				{ left: finishLeft, opacity: 0, offset: 1 }
			],
			{
				duration: totalDuration,
				easing: 'linear',
				fill: 'both'
			}
		);
		state.animation.onfinish = () => {
			if (isCancelled) return;
			if (shouldBounce) direction = direction === 'forward' ? 'backward' : 'forward';
			animateTrail();
		};
	};

	animateTrail();

	return () => {
		isCancelled = true;
		state.animation?.cancel();
		state.animation = undefined;
		segment.style.left = '0';
		segment.style.opacity = '0';
	};
}

export function startBarLoopAnimation(
	state: NetworkIndicatorAnimationState,
	node: HTMLDivElement,
	{ duration, easing }: { duration: number; easing: Easing }
) {
	let transform = Math.random() * 0.35;

	state.animation?.cancel();
	node.style.opacity = '1';
	node.style.transform = 'scaleX(0)';

	// Same reduced-motion guard as the trail: show a static half-filled bar.
	if (duration <= 0) {
		node.style.transform = 'scaleX(0.6)';
		return () => {};
	}

	const animateBar = () => {
		const barAnimation = node.animate(
			{
				opacity: 1,
				transform: `scaleX(${transform})`
			},
			{
				duration,
				easing: easingBezierStrings[easing],
				fill: 'both'
			}
		);
		state.animation = barAnimation;
		barAnimation.onfinish = () => {
			if (state.mode !== 'bar-loop' || state.animation !== barAnimation) return;
			transform = transform > 1 ? 0.02 : transform + Math.random() * 0.15;
			animateBar();
		};
	};

	animateBar();

	return () => {
		state.animation?.cancel();
		state.animation = undefined;
	};
}

export function finishBarAnimation(
	state: NetworkIndicatorAnimationState,
	node: HTMLDivElement,
	{ duration, easing, onFinish }: { duration: number; easing: Easing; onFinish: () => void }
) {
	const currentTransform = getComputedStyle(node).transform;
	const startTransform = currentTransform === 'none' ? 'scaleX(0)' : currentTransform;
	const previousAnimation = state.animation;
	const finishAnimation = node.animate(
		[
			{ opacity: 1, transform: startTransform, offset: 0 },
			{ opacity: 1, transform: 'scaleX(1)', offset: 0.72 },
			{ opacity: 0, transform: 'scaleX(1)', offset: 1 }
		],
		{
			duration: duration <= 0 ? 0 : Math.max(duration, 180),
			easing: easingBezierStrings[easing],
			fill: 'both'
		}
	);

	state.animation = finishAnimation;
	previousAnimation?.cancel();
	finishAnimation.onfinish = () => {
		if (state.animation !== finishAnimation) return;
		state.animation = undefined;
		state.mode = undefined;
		state.node = null;
		state.signature = undefined;
		state.stop = undefined;
		node.style.opacity = '0';
		node.style.transform = 'scaleX(0)';
		onFinish();
	};

	return () => {
		if (state.animation === finishAnimation) {
			state.animation.cancel();
			state.animation = undefined;
		}
	};
}
