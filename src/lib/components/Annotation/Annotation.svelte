<script lang="ts">
	// Calls attention to a piece of content the way a pen would: a marker tint on the target, and
	// a handwritten note beside it with an arrow drawn back to it. The note and the arrow are
	// placed by CSS, round the target's own box; the one thing that runs in the browser is, with
	// `draw`, waiting for the annotation to come into view.
	import { presence } from '$lib/utils/stateAttributes.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import { ANNOTATION_ARROWS } from './annotation.arrows.js';
	import type { AnnotationProps } from './annotation.props.js';
	import { useAnnotationTheme } from './annotation.theme.js';

	let {
		children,
		note,
		placement = 'bottom',
		color,
		highlight = true,
		draw = false,
		drawOffset,
		decorative = false,
		as = 'span',
		ref = $bindable(null),
		class: className,
		theme,
		...attachments
	}: AnnotationProps = $props();

	const noteId = $props.id();
	const classes = $derived(useAnnotationTheme(theme));
	const role = $derived(color === 'rainbow' ? undefined : color);
	const resolvedColor = $derived(color === 'rainbow' ? 'rainbow' : useDefaultColor(role));
	const hasNote = $derived(typeof note === 'string' ? note.trim() !== '' : !!note);
	const arrow = $derived(ANNOTATION_ARROWS[placement] ?? ANNOTATION_ARROWS.bottom);

	// With `draw` the drawing is held on its first frame until the annotation is in view. With a
	// `drawOffset`, that is once its target is that far above the bottom of the screen. Without
	// one, once half of it shows or, for one taller than the screen, once it fills a quarter of it.
	let inView = $state(false);
	const watchView = (offset: AnnotationProps['drawOffset']) => (node: HTMLElement) => {
		if (typeof IntersectionObserver === 'undefined') {
			inView = true;
			return;
		}
		const share = typeof offset === 'string';
		const distance = share ? parseFloat(offset) : offset;
		// The bottom of the screen is raised by the distance: touching what is left of the
		// screen is being that far up it. Only the bottom, so that an annotation which shows
		// near the top, after a jump down the page or while scrolling back up, is drawn too.
		const margin =
			distance == null || Number.isNaN(distance)
				? null
				: share
					? `${-Math.min(distance, 95)}%`
					: `${-distance}px`;
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[entries.length - 1];
				const screen = entry.rootBounds?.height ?? window.innerHeight;
				const near =
					margin !== null ||
					entry.intersectionRatio >= 0.5 ||
					entry.intersectionRect.height >= screen * 0.25;
				if (entry.isIntersecting && near) {
					inView = true;
					observer.disconnect();
				}
			},
			margin !== null
				? // The document as the root: inside a frame, the screen is the frame's own, and a
					// negative distance can then reach past its edge.
					{ root: node.ownerDocument, rootMargin: `0px 0px ${margin} 0px` }
				: { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
		);
		observer.observe(node);
		return () => {
			observer.disconnect();
			// Turned off and on again, `draw` plays again.
			inView = false;
		};
	};
</script>

<svelte:element
	this={as}
	bind:this={ref}
	data-slot="annotation"
	data-placement={hasNote ? placement : undefined}
	data-highlight={presence(highlight)}
	data-rainbow={presence(resolvedColor === 'rainbow')}
	data-draw={draw ? (inView ? 'play' : 'wait') : undefined}
	class={classes.root({ color: resolvedColor, highlight, block: as === 'div', className })}
	aria-describedby={hasNote && !decorative ? noteId : undefined}
	{...attachments}
	{@attach draw ? watchView(drawOffset) : null}
>
	{#if typeof children === 'string'}{children}{:else}{@render children?.()}{/if}
	{#if hasNote}
		<svg
			data-slot="annotation-arrow"
			aria-hidden="true"
			viewBox="0 0 46 38"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			class={classes.arrow()}
		>
			<!-- A length of 1, so `draw` traces a stroke whatever its real length. -->
			<path d={arrow[0]} pathLength="1" />
			<path d={arrow[1]} pathLength="1" />
		</svg>
		<span
			id={noteId}
			data-slot="annotation-label"
			aria-hidden={decorative ? 'true' : undefined}
			class={classes.label()}
		>
			{#if typeof note === 'string'}{note}{:else}{@render note?.()}{/if}
		</span>
	{/if}
</svelte:element>

<style>
	/*
	 * Where the arrow and the note sit, by placement. Adapted from neat-annotations
	 * (github.com/syabro/neat-annotations), Copyright (c) 2026 Maxim Syabro, MIT.
	 *
	 * Each number can be moved from outside with a variable set on the root:
	 * --annotation-target-gap (5px), --annotation-label-gap (6px), --annotation-lower-label-gap
	 * (-4px), --annotation-arrow-x and -y (0px), --annotation-label-x (0px) and -y (5px),
	 * --annotation-rotate (-4deg), --annotation-label-max-width (150px), --annotation-font and
	 * --annotation-font-size (0.95rem). None is declared here, so a class can set them.
	 */
	:global {
		[data-slot='annotation'] > [data-slot='annotation-label'] {
			max-width: var(--annotation-label-max-width, 150px);
			font-family: var(
				--annotation-font,
				'Shantell Sans',
				'Bradley Hand',
				'Segoe Print',
				'Comic Sans MS',
				cursive
			);
			font-size: var(--annotation-font-size, 0.95rem);
		}

		/* Under the target: the arrow points up. */
		[data-slot='annotation'][data-placement='bottom'] > [data-slot='annotation-arrow'] {
			left: calc(50% - 23px + var(--annotation-arrow-x, 0px));
			top: calc(100% + var(--annotation-target-gap, 5px) - 4px + var(--annotation-arrow-y, 0px));
		}
		[data-slot='annotation'][data-placement='bottom'] > [data-slot='annotation-label'] {
			left: calc(50% + var(--annotation-label-x, 0px));
			top: calc(
				100% + var(--annotation-target-gap, 5px) + 31px + var(--annotation-lower-label-gap, -4px) +
					var(--annotation-label-y, 5px)
			);
			transform: translateX(-50%) rotate(var(--annotation-rotate, -4deg));
		}

		/* Over the target: the arrow points down. */
		[data-slot='annotation'][data-placement='top'] > [data-slot='annotation-arrow'] {
			left: calc(50% - 23px + var(--annotation-arrow-x, 0px));
			top: calc(-1 * var(--annotation-target-gap, 5px) - 35px + var(--annotation-arrow-y, 0px));
		}
		[data-slot='annotation'][data-placement='top'] > [data-slot='annotation-label'] {
			left: calc(50% + var(--annotation-label-x, 0px));
			bottom: calc(
				100% + var(--annotation-target-gap, 5px) + 31px + var(--annotation-label-gap, 6px) -
					var(--annotation-label-y, 5px)
			);
			transform: translateX(-50%) rotate(var(--annotation-rotate, -4deg));
		}

		/* Beside the target. */
		[data-slot='annotation'][data-placement='left'] > [data-slot='annotation-arrow'] {
			left: calc(-1 * var(--annotation-target-gap, 5px) - 43px + var(--annotation-arrow-x, 0px));
			top: calc(50% - 19px + var(--annotation-arrow-y, 0px));
		}
		[data-slot='annotation'][data-placement='left'] > [data-slot='annotation-label'] {
			right: calc(
				100% + var(--annotation-target-gap, 5px) + 39px + var(--annotation-label-gap, 6px) -
					var(--annotation-label-x, 0px)
			);
			top: calc(50% - 5px + var(--annotation-label-y, 5px));
			transform: translateY(-50%) rotate(var(--annotation-rotate, -4deg));
		}
		[data-slot='annotation'][data-placement='right'] > [data-slot='annotation-arrow'] {
			left: calc(100% + var(--annotation-target-gap, 5px) - 3px + var(--annotation-arrow-x, 0px));
			top: calc(50% - 19px + var(--annotation-arrow-y, 0px));
		}
		[data-slot='annotation'][data-placement='right'] > [data-slot='annotation-label'] {
			left: calc(
				100% + var(--annotation-target-gap, 5px) + 40px + var(--annotation-label-gap, 6px) +
					var(--annotation-label-x, 0px)
			);
			top: calc(50% - 5px + var(--annotation-label-y, 5px));
			transform: translateY(-50%) rotate(var(--annotation-rotate, -4deg));
		}

		/* On a slant, under the target. */
		[data-slot='annotation'][data-placement^='bottom-'] > [data-slot='annotation-arrow'] {
			top: calc(100% + var(--annotation-target-gap, 5px) - 6px + var(--annotation-arrow-y, 0px));
		}
		[data-slot='annotation'][data-placement^='bottom-'] > [data-slot='annotation-label'] {
			top: calc(
				100% + var(--annotation-target-gap, 5px) + 26px + var(--annotation-lower-label-gap, -4px) +
					var(--annotation-label-y, 5px)
			);
		}

		/* On a slant, over the target. */
		[data-slot='annotation'][data-placement^='top-'] > [data-slot='annotation-arrow'] {
			top: calc(-1 * var(--annotation-target-gap, 5px) - 32px + var(--annotation-arrow-y, 0px));
		}
		[data-slot='annotation'][data-placement^='top-'] > [data-slot='annotation-label'] {
			bottom: calc(
				100% + var(--annotation-target-gap, 5px) + 26px + var(--annotation-label-gap, 6px) -
					var(--annotation-label-y, 5px)
			);
		}

		/* A slanted note on the left: `start` from left to right, `end` from right to left. */
		[data-slot='annotation'][data-placement$='-start']:dir(ltr) > [data-slot='annotation-arrow'],
		[data-slot='annotation'][data-placement$='-end']:dir(rtl) > [data-slot='annotation-arrow'] {
			left: calc(50% - 40px + var(--annotation-arrow-x, 0px));
			transform: translateX(-10%);
		}
		[data-slot='annotation'][data-placement$='-start']:dir(ltr) > [data-slot='annotation-label'],
		[data-slot='annotation'][data-placement$='-end']:dir(rtl) > [data-slot='annotation-label'] {
			left: calc(50% - 34px + var(--annotation-label-x, 0px));
			transform: translateX(-60%) rotate(var(--annotation-rotate, -4deg));
		}

		/* A slanted note on the right. */
		[data-slot='annotation'][data-placement$='-end']:dir(ltr) > [data-slot='annotation-arrow'],
		[data-slot='annotation'][data-placement$='-start']:dir(rtl) > [data-slot='annotation-arrow'] {
			left: calc(50% - 6px + var(--annotation-arrow-x, 0px));
			transform: translateX(10%);
		}
		[data-slot='annotation'][data-placement$='-end']:dir(ltr) > [data-slot='annotation-label'],
		[data-slot='annotation'][data-placement$='-start']:dir(rtl) > [data-slot='annotation-label'] {
			left: calc(50% + 34px + var(--annotation-label-x, 0px));
			transform: translateX(-40%) rotate(var(--annotation-rotate, -4deg));
		}

		/* The slanted arrows are drawn for left to right: the other way, each is its own mirror. */
		[data-slot='annotation'][data-placement$='-start']:dir(rtl) > [data-slot='annotation-arrow'],
		[data-slot='annotation'][data-placement$='-end']:dir(rtl) > [data-slot='annotation-arrow'] {
			scale: -1 1;
		}

		/* The rainbow: a hue that turns, on the one colour everything is drawn in. */
		[data-slot='annotation'][data-rainbow] {
			--annotation-color: oklch(0.65 0.28 var(--annotation-hue));
			animation: annotation-rainbow 3s linear infinite;
		}

		/*
		 * `draw`: the marker sweeps over the target, the note is written, then the arrow is traced
		 * from the note to the target, shaft first. Each part holds its first frame until its turn
		 * and is left as it is drawn once done. --annotation-draw-duration (900ms) is the whole
		 * drawing, --annotation-draw-delay (0s) what it waits first.
		 */
		[data-slot='annotation'][data-draw]::before {
			animation: annotation-mark calc(var(--annotation-draw-duration, 900ms) * 0.3) ease-out
				var(--annotation-draw-delay, 0s) backwards;
		}
		[data-slot='annotation'][data-draw] > [data-slot='annotation-label'] {
			animation: annotation-write calc(var(--annotation-draw-duration, 900ms) * 0.35) linear
				calc(var(--annotation-draw-delay, 0s) + var(--annotation-draw-duration, 900ms) * 0.2)
				backwards;
		}
		[data-slot='annotation'][data-draw] > [data-slot='annotation-arrow'] > path {
			animation: annotation-stroke calc(var(--annotation-draw-duration, 900ms) * 0.28) ease-in-out
				calc(var(--annotation-draw-delay, 0s) + var(--annotation-draw-duration, 900ms) * 0.55)
				backwards;
		}
		[data-slot='annotation'][data-draw] > [data-slot='annotation-arrow'] > path + path {
			animation-duration: calc(var(--annotation-draw-duration, 900ms) * 0.17);
			animation-delay: calc(
				var(--annotation-draw-delay, 0s) + var(--annotation-draw-duration, 900ms) * 0.83
			);
		}
		/*
		 * Until the annotation is in view the drawing waits on its first frame, where nothing is
		 * drawn yet. Only where scripts run: without them nothing would ever start it, so it
		 * plays as the page is painted.
		 */
		@media (scripting: enabled) {
			[data-slot='annotation'][data-draw='wait']::before,
			[data-slot='annotation'][data-draw='wait'] > [data-slot='annotation-label'],
			[data-slot='annotation'][data-draw='wait'] > [data-slot='annotation-arrow'] > path {
				animation-play-state: paused;
			}
		}

		/* From right to left the pen starts on the right. */
		[data-slot='annotation'][data-draw]:dir(rtl)::before {
			animation-name: annotation-mark-rtl;
		}
		[data-slot='annotation'][data-draw] > [data-slot='annotation-label']:dir(rtl) {
			animation-name: annotation-write-rtl;
		}

		/* Theme mirrors the resolved preference on <html>, so its `reduceMotion` prop decides. */
		html[data-entasis-reduce-motion] [data-slot='annotation'][data-rainbow],
		html[data-entasis-reduce-motion] [data-slot='annotation'][data-draw]::before,
		html[data-entasis-reduce-motion]
			[data-slot='annotation'][data-draw]
			> [data-slot='annotation-label'],
		html[data-entasis-reduce-motion]
			[data-slot='annotation'][data-draw]
			> [data-slot='annotation-arrow']
			> path {
			animation: none;
		}
	}

	@property --annotation-hue {
		syntax: '<angle>';
		inherits: false;
		initial-value: 350deg;
	}

	@keyframes -global-annotation-rainbow {
		to {
			--annotation-hue: 710deg;
		}
	}

	@keyframes -global-annotation-mark {
		from {
			clip-path: inset(0 100% 0 0);
		}
		to {
			clip-path: inset(0);
		}
	}
	@keyframes -global-annotation-mark-rtl {
		from {
			clip-path: inset(0 0 0 100%);
		}
		to {
			clip-path: inset(0);
		}
	}

	/* The note is uncovered along its lines, with room left for tails and tall letters. */
	@keyframes -global-annotation-write {
		from {
			clip-path: inset(-30% 100% -30% -10%);
		}
		to {
			clip-path: inset(-30% -10% -30% -10%);
		}
	}
	@keyframes -global-annotation-write-rtl {
		from {
			clip-path: inset(-30% -10% -30% 100%);
		}
		to {
			clip-path: inset(-30% -10% -30% -10%);
		}
	}

	/* A round cap shows as a dot on a stroke of no length: the stroke is hidden until it starts. */
	@keyframes -global-annotation-stroke {
		from {
			stroke-dasharray: 1;
			stroke-dashoffset: 1;
			opacity: 0;
		}
		1% {
			opacity: 1;
		}
		to {
			stroke-dasharray: 1;
			stroke-dashoffset: 0;
		}
	}
</style>
