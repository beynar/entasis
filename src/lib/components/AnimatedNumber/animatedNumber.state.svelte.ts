/**
 * What AnimatedNumber renders and how it moves from one number to the next.
 *
 * The view is the number's characters, plus the ones that are still leaving. A change is played
 * in three steps: every character is measured where it shows, the view takes the new number and
 * the page is updated, then each character is animated from where it was to where it is.
 *
 * The method is NumberFlow's (github.com/barvian/number-flow, Copyright (c) 2024 Maxwell Barvian,
 * MIT): characters that leave are lifted out of the line and held beside the edge their run is
 * anchored to, moves are added to the ones still playing so an interrupted change keeps its
 * speed, and a digit wheel turns by a registered custom property.
 */
/* eslint-disable svelte/prefer-svelte-reactivity -- measures, plans and running animations are bookkeeping between two paints, not reactive state; `view` is what is rendered. */
import { tick, untrack } from 'svelte';
import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
import {
	ANIMATED_NUMBER_SECTIONS,
	continuousStart,
	digitDelta,
	resolveTrend,
	type AnimatedNumberDirection,
	type AnimatedNumberPart,
	type AnimatedNumberParts,
	type AnimatedNumberSectionName,
	type AnimatedNumberTrend
} from './animatedNumber.parts.js';

export type AnimatedNumberVariant = 'flow' | 'blur';

export type AnimatedNumberChar = AnimatedNumberPart & {
	/** What the character showed before, while that is still leaving. */
	outgoing: string | null;
	/** Gone from the number, and kept until the change has played. */
	exiting: boolean;
};

export type AnimatedNumberView = Record<AnimatedNumberSectionName, AnimatedNumberChar[]> & {
	glyphs: readonly string[];
	rtl: boolean;
	/**
	 * From a change to the moment it has played. Meanwhile a wheel carries its ten digits; at
	 * rest, only the one it shows.
	 */
	animating: boolean;
};

export type AnimatedNumberOptions = {
	variant: AnimatedNumberVariant;
	trend: AnimatedNumberTrend;
	continuous: boolean;
	/** In milliseconds. */
	duration: number;
	animated: boolean;
};

type Side = 'left' | 'right';

type Change = {
	kind: 'enter' | 'return' | 'exit' | 'change' | 'same';
	/** For a digit: the one it showed, and the one it shows now. */
	from: number;
	to: number;
};

type Plan = {
	variant: AnimatedNumberVariant;
	direction: AnimatedNumberDirection;
	/** With `continuous`: every digit at or under this position turns. */
	loopFrom: number | undefined;
	duration: number;
	changes: Map<string, Change>;
};

type Measure = { x: number; top: number; side: number };

export const animatedNumberDeltaProperty = '--_animated-number-d';
export const animatedNumberShiftProperty = '--_animated-number-dx';
export const animatedNumberWidthProperty = '--_animated-number-dw';

// A long ease out with no overshoot: NumberFlow's default curve for moves and wheels.
const GLIDE =
	'linear(0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,.9981,.9982,.9984,.9985,.9987,.9988,.9989,1)';
// A spring that settles a little past its mark: animated-blur-number's curve for what slides in.
const SETTLE =
	'linear(0,.028 2.5%,.0995 5%,.198 7.5%,.3106 10%,.4272 12.5%,.5405 15%,.6454 17.5%,.7387 20%,.819 22.5%,.8856 25%,.9391 27.5%,.9803 30%,1.0107 32.5%,1.0317 35%,1.045 37.5%,1.052 40%,1.0543 42.5%,1.053 45%,1.0493 47.5%,1.044 50%,1.0379 52.5%,1.0316 55%,1.0254 57.5%,1.0197 60%,1.0146 62.5%,1.0102 65%,1.0065 67.5%,1.0035 70%,1.0012 72.5%,.9995 75%,.9984 77.5%,.9976 80%,.9972 82.5%,.9971 85%,.9971 87.5%,.9973 90%,.9976 92.5%,.9979 95%,.9983 97.5%,1)';
const RESOLVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const DISSOLVE = 'cubic-bezier(0.4, 0, 1, 1)';

const BLUR = 'blur(var(--animated-number-blur, 0.45em))';
const travel = (direction: number) =>
	`translateY(calc(var(--animated-number-distance, 0.55em) * ${direction}))`;

let supported: boolean | undefined;
/** Wheels are placed with `mod()` and turned by a registered property; curves use `linear()`. */
const canAnimate = () => {
	if (supported !== undefined) return supported;
	supported = false;
	try {
		if (
			typeof CSS !== 'undefined' &&
			'registerProperty' in CSS &&
			CSS.supports('line-height', 'mod(1,1)')
		) {
			// `CSS.supports` can say yes to a curve that `animate` refuses.
			document.createElement('span').animate({ opacity: 0 }, { easing: 'linear(0, 1)' }).cancel();
			supported = true;
		}
	} catch {
		supported = false;
	}
	return supported;
};

const shown = (node: HTMLElement) =>
	node.offsetWidth > 0 && node.offsetHeight > 0 && node.ownerDocument.visibilityState === 'visible';

/** The edge a run is anchored to: the one on the side of the decimal point. */
const anchorOf = (name: AnimatedNumberSectionName, rtl: boolean): Side => {
	if (name === 'integer') return 'right';
	if (name === 'fraction') return 'left';
	// What stands before and after the number follows the reading direction; its digits never do.
	return (name === 'pre') !== rtl ? 'right' : 'left';
};

export const animatedNumberAnchor = anchorOf;

/** How far an element's edge is from the same edge of the box it is placed in. */
const layoutOffset = (node: HTMLElement, side: Side) => {
	if (side === 'left') return node.offsetLeft;
	const parent = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
	return (parent?.offsetWidth ?? 0) - node.offsetWidth - node.offsetLeft;
};

const lift = (node: HTMLElement, top: number, offset: number, side: Side) => {
	node.style.top = `${top}px`;
	node.style[side] = `${offset}px`;
	node.dataset.exiting = '';
};

const settle = (node: HTMLElement) => {
	if (node.dataset.exiting === undefined) return;
	delete node.dataset.exiting;
	node.style.top = '';
	node.style.left = '';
	node.style.right = '';
};

const toView = (parts: AnimatedNumberParts): AnimatedNumberView => {
	const chars = (list: AnimatedNumberPart[]): AnimatedNumberChar[] =>
		list.map((part) => ({ ...part, outgoing: null, exiting: false }));
	return {
		pre: chars(parts.pre),
		integer: chars(parts.integer),
		fraction: chars(parts.fraction),
		post: chars(parts.post),
		glyphs: parts.glyphs,
		rtl: parts.rtl,
		animating: false
	};
};

const glyphOf = (char: AnimatedNumberPart, glyphs: readonly string[]) =>
	char.kind === 'digit' ? glyphs[char.value] : char.value;

export class AnimatedNumberState {
	view = $state.raw<AnimatedNumberView>(null!);

	#parts: AnimatedNumberParts;
	#root: HTMLElement | null = null;
	#plan: Plan | null = null;
	#measures = new Map<string, Measure>();
	#box = { left: 0, width: 0 };
	#animations = new Set<Animation>();
	// What holds a leaving element at the end of its way out.
	#held = new WeakMap<Element, Animation[]>();
	#turn = 0;

	constructor(parts: () => AnimatedNumberParts, options: () => AnimatedNumberOptions) {
		this.#parts = untrack(parts);
		this.view = toView(this.#parts);

		// Before the page is updated: the characters are measured where they still show.
		$effect.pre(() => {
			const next = parts();
			const current = options();
			untrack(() => this.#update(next, current));
		});
		// After it: they are animated from there. The characters that stay are updated after this
		// effect has run, so the engine waits for the page to be whole. No frame is painted between.
		$effect(() => {
			void this.view;
			void tick().then(() => this.#play());
		});
	}

	/** Gives the engine the root element. */
	attach = (node: HTMLElement) => {
		this.#root = node;
		return () => {
			this.#root = null;
			this.#turn++;
			this.#animations.clear();
		};
	};

	#update(next: AnimatedNumberParts, options: AnimatedNumberOptions) {
		const previous = this.#parts;
		const root = this.#root;
		const animated =
			root !== null && options.animated && canAnimate() && !prefersReducedMotion() && shown(root);

		if (!animated) {
			this.#parts = next;
			this.#plan = null;
			// What is still playing ends where it was going, and nothing is left leaving.
			this.#turn++;
			for (const animation of this.#animations) animation.cancel();
			this.#animations.clear();
			const clean =
				next.signature === previous.signature &&
				!this.view.animating &&
				ANIMATED_NUMBER_SECTIONS.every((name) =>
					this.view[name].every((char) => !char.exiting && char.outgoing === null)
				);
			if (!clean) {
				if (root) for (const node of this.#chars(root)) settle(node);
				this.view = toView(next);
			}
			return;
		}

		if (next === previous || next.signature === previous.signature) {
			this.#parts = next;
			return;
		}
		this.#parts = next;

		const direction = resolveTrend(options.trend, previous.value, next.value);
		const plan: Plan = {
			variant: options.variant,
			direction,
			loopFrom:
				options.continuous && options.variant === 'flow' && direction !== 0
					? continuousStart(previous, next)
					: undefined,
			duration: Math.max(0, options.duration),
			changes: new Map()
		};

		this.#measure(root, this.view.rtl);
		this.#plan = plan;
		this.view = this.#merge(this.view, next, plan);
	}

	/** The new number, with what left it kept beside the edge its run is anchored to. */
	#merge(view: AnimatedNumberView, next: AnimatedNumberParts, plan: Plan): AnimatedNumberView {
		const flow = plan.variant === 'flow';
		const section = (name: AnimatedNumberSectionName): AnimatedNumberChar[] => {
			const before = new Map(view[name].map((char) => [char.key, char]));
			const kept = new Set<string>();
			const present = next[name].map((part): AnimatedNumberChar => {
				kept.add(part.key);
				const id = `${name}/${part.key}`;
				const old = before.get(part.key);
				const to = part.kind === 'digit' ? part.value : 0;
				if (!old) {
					plan.changes.set(id, { kind: 'enter', from: 0, to });
					return { ...part, outgoing: null, exiting: false };
				}
				const from = old.kind === 'digit' ? old.value : 0;
				if (old.exiting) {
					plan.changes.set(id, { kind: 'return', from, to });
					return { ...part, outgoing: null, exiting: false };
				}
				const was = glyphOf(old, view.glyphs);
				const changed = was !== glyphOf(part, next.glyphs);
				plan.changes.set(id, { kind: changed ? 'change' : 'same', from, to });
				// A wheel turns to its new digit. Anything else is swapped: the old one leaves.
				const swapped = changed && !(flow && part.kind === 'digit');
				return { ...part, outgoing: swapped ? was : old.outgoing, exiting: false };
			});
			const gone = view[name]
				.filter((char) => !kept.has(char.key))
				.map((char): AnimatedNumberChar => {
					if (char.exiting) return char;
					const from = char.kind === 'digit' ? char.value : 0;
					plan.changes.set(`${name}/${char.key}`, { kind: 'exit', from, to: 0 });
					// A wheel that leaves turns back to nought, as its place in the number does.
					return char.kind === 'digit' && flow
						? { ...char, value: 0, outgoing: null, exiting: true }
						: { ...char, outgoing: null, exiting: true };
				});
			return anchorOf(name, next.rtl) === 'right' ? [...gone, ...present] : [...present, ...gone];
		};
		return {
			pre: section('pre'),
			integer: section('integer'),
			fraction: section('fraction'),
			post: section('post'),
			glyphs: next.glyphs,
			rtl: next.rtl,
			animating: true
		};
	}

	#sections(root: HTMLElement) {
		const sections = new Map<
			AnimatedNumberSectionName,
			{ node: HTMLElement; chars: Map<string, HTMLElement> }
		>();
		for (const node of root.querySelectorAll<HTMLElement>('[data-section]')) {
			const chars = new Map<string, HTMLElement>();
			for (const child of node.children) {
				const key = (child as HTMLElement).dataset.key;
				if (key !== undefined) chars.set(key, child as HTMLElement);
			}
			sections.set(node.dataset.section as AnimatedNumberSectionName, { node, chars });
		}
		return sections;
	}

	#chars(root: HTMLElement) {
		return root.querySelectorAll<HTMLElement>('[data-section] > [data-key]');
	}

	#number(root: HTMLElement) {
		return root.querySelector<HTMLElement>('[data-slot="animated-number-number"]');
	}

	/**
	 * Where a character shows from the anchored edge of its run. A digit is taken by its middle,
	 * as it changes width with the digit it shows.
	 */
	#place(box: DOMRect, run: DOMRect, side: Side, digit: boolean) {
		const offset = box[side] - run[side];
		if (!digit) return offset;
		return side === 'left' ? offset + box.width / 2 : offset - box.width / 2;
	}

	#measure(root: HTMLElement, rtl: boolean) {
		this.#measures.clear();
		for (const [name, { node, chars }] of this.#sections(root)) {
			const side = anchorOf(name, rtl);
			const run = node.getBoundingClientRect();
			this.#measures.set(name, { x: run[side], top: 0, side: 0 });
			const kinds = new Map(this.view[name].map((char) => [char.key, char.kind]));
			for (const [key, child] of chars) {
				this.#measures.set(`${name}/${key}`, {
					x: this.#place(child.getBoundingClientRect(), run, side, kinds.get(key) === 'digit'),
					top: child.offsetTop,
					side: layoutOffset(child, side)
				});
			}
		}
		const number = this.#number(root);
		if (number) {
			this.#box = { left: number.getBoundingClientRect().left, width: number.offsetWidth };
		}
	}

	#animate(node: Element, keyframes: PropertyIndexedKeyframes, options: KeyframeAnimationOptions) {
		const animation = node.animate(keyframes, options);
		this.#animations.add(animation);
		return animation;
	}

	/** Lets go of an element that was held at the end of its way out, and says how far it had faded. */
	#release(node: Element) {
		const held = this.#held.get(node);
		if (!held) return 0;
		const opacity = Number(getComputedStyle(node).opacity);
		for (const animation of held) animation.cancel();
		this.#held.delete(node);
		return Number.isFinite(opacity) ? opacity : 0;
	}

	#fadeIn(node: Element, duration: number) {
		const from = this.#release(node);
		this.#animate(node, { opacity: [from, 1] }, { duration: duration / 2, easing: 'ease-out' });
	}

	#fadeOut(node: Element, duration: number) {
		this.#release(node);
		const from = Number(getComputedStyle(node).opacity);
		this.#held.set(node, [
			this.#animate(
				node,
				{ opacity: [Number.isFinite(from) ? from : 1, 0] },
				{ duration: duration / 2, easing: 'ease-out', fill: 'forwards' }
			)
		]);
	}

	#slideIn(node: Element, direction: number, duration: number) {
		this.#release(node);
		this.#animate(
			node,
			{ transform: [travel(direction), 'translateY(0)'] },
			{ duration, easing: SETTLE }
		);
		this.#animate(
			node,
			{ opacity: [0, 1], filter: [BLUR, 'blur(0px)'] },
			{ duration, easing: RESOLVE }
		);
	}

	#slideOut(node: Element, direction: number, duration: number) {
		this.#release(node);
		this.#held.set(node, [
			this.#animate(
				node,
				{ transform: ['translateY(0)', travel(-direction)] },
				{ duration, easing: DISSOLVE, fill: 'forwards' }
			),
			this.#animate(
				node,
				{ opacity: [1, 0], filter: ['blur(0px)', BLUR] },
				{ duration, easing: DISSOLVE, fill: 'forwards' }
			)
		]);
	}

	#play() {
		const plan = this.#plan;
		this.#plan = null;
		const root = this.#root;
		if (!plan || !root) return;

		const view = this.view;
		const flow = plan.variant === 'flow';
		const sections = this.#sections(root);
		const sides = new Map(
			ANIMATED_NUMBER_SECTIONS.map((name) => [name, anchorOf(name, view.rtl)] as const)
		);

		// What leaves is lifted out of the line and held beside the anchored edge of its run.
		for (const [name, { chars }] of sections) {
			const side = sides.get(name)!;
			const leaving: Array<[HTMLElement, number, number]> = [];
			if (name === 'integer' || name === 'fraction') {
				// Digits that leave keep their place past the ones that stay, so everything is put
				// back in the line and read there, the ones that were already leaving too.
				for (const node of chars.values()) settle(node);
				for (const char of view[name]) {
					const node = chars.get(char.key);
					if (node && char.exiting) leaving.push([node, node.offsetTop, layoutOffset(node, side)]);
				}
			} else {
				// A symbol that leaves stays where it was, and the next one is drawn over it.
				for (const char of view[name]) {
					const node = chars.get(char.key);
					if (!node) continue;
					const change = plan.changes.get(`${name}/${char.key}`);
					if (change?.kind === 'return') settle(node);
					else if (change?.kind === 'exit') {
						const was = this.#measures.get(`${name}/${char.key}`);
						leaving.push([node, was?.top ?? node.offsetTop, was?.side ?? layoutOffset(node, side)]);
					}
				}
			}
			for (const [node, top, offset] of leaving) lift(node, top, offset, side);
		}

		// Every place is read before anything moves: a move started now would show in the next read.
		const moves: Array<[HTMLElement, number]> = [];
		for (const [name, { node, chars }] of sections) {
			const side = sides.get(name)!;
			const run = node.getBoundingClientRect();
			const before = this.#measures.get(name);
			if (before && chars.size > 0 && before.x !== run[side]) {
				moves.push([node, before.x - run[side]]);
			}
			for (const char of view[name]) {
				// The decimal point opens a run anchored on its side: it never moves in it.
				if (char.type === 'decimal') continue;
				const child = chars.get(char.key);
				const was = this.#measures.get(`${name}/${char.key}`);
				if (!child || !was) continue;
				const x = this.#place(child.getBoundingClientRect(), run, side, char.kind === 'digit');
				if (was.x !== x) moves.push([child, was.x - x]);
			}
		}
		const number = this.#number(root);
		const box = number
			? { left: number.getBoundingClientRect().left, width: number.offsetWidth }
			: null;

		const glide = { duration: plan.duration, easing: GLIDE, composite: 'accumulate' as const };
		for (const [node, dx] of moves) {
			this.#animate(node, { transform: [`translateX(${dx}px)`, 'none'] }, glide);
		}

		// The window the wheels turn behind goes from the old number's box to the new one's.
		if (flow && number && box) number.style.setProperty('--_width', String(box.width || 1));
		if (flow && number && box && (this.#box.left !== box.left || this.#box.width !== box.width)) {
			this.#animate(
				number,
				{
					[animatedNumberShiftProperty]: [`${this.#box.left - box.left}px`, '0px'],
					[animatedNumberWidthProperty]: [this.#box.width - box.width, 0]
				},
				glide
			);
		}

		for (const [name, { chars }] of sections) {
			for (const char of view[name]) {
				const node = chars.get(char.key);
				const change = plan.changes.get(`${name}/${char.key}`);
				if (!node || !change) continue;
				const current = node.querySelector(':scope > [data-layer="current"]');
				const outgoing = node.querySelector(':scope > [data-layer="outgoing"]');

				if (flow) {
					if (char.kind === 'digit') {
						const loop = plan.loopFrom !== undefined && plan.loopFrom >= char.pos;
						const delta = digitDelta(change.to, change.from, plan.direction, loop);
						if (delta) {
							this.#animate(node, { [animatedNumberDeltaProperty]: [-delta, 0] }, glide);
						}
					} else if (change.kind === 'change' && current && outgoing) {
						this.#animate(
							current,
							{ opacity: [0, 1] },
							{ duration: plan.duration / 2, easing: 'ease-out' }
						);
						this.#fadeOut(outgoing, plan.duration);
					}
					if (change.kind === 'enter' || change.kind === 'return') {
						this.#fadeIn(node, plan.duration);
					} else if (change.kind === 'exit') {
						this.#fadeOut(node, plan.duration);
					}
					continue;
				}

				if (!current || change.kind === 'same') continue;
				const direction = plan.direction || Math.sign(change.to - change.from) || 1;
				if (change.kind === 'exit') {
					this.#slideOut(current, direction, plan.duration);
				} else {
					this.#slideIn(current, direction, plan.duration);
					if (change.kind === 'change' && outgoing) {
						this.#slideOut(outgoing, direction, plan.duration);
					}
				}
			}
		}

		this.#whenDone();
	}

	/** Once everything has played: what left is dropped, and the wheels give back their digits. */
	#whenDone() {
		const turn = ++this.#turn;
		const running = [...this.#animations].filter(
			(animation) => animation.playState === 'running' || animation.playState === 'paused'
		);
		void Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
			if (turn !== this.#turn) return;
			for (const animation of this.#animations) animation.cancel();
			this.#animations.clear();
			const view = this.view;
			const rest = (chars: AnimatedNumberChar[]) =>
				chars
					.filter((char) => !char.exiting)
					.map((char) => (char.outgoing === null ? char : { ...char, outgoing: null }));
			this.view = {
				...view,
				pre: rest(view.pre),
				integer: rest(view.integer),
				fraction: rest(view.fraction),
				post: rest(view.post),
				animating: false
			};
		});
	}
}
