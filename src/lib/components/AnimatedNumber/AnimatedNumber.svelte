<script lang="ts">
	// A number that animates from the one it showed to the one it shows. It is cut into keyed
	// digits and symbols, so the units stay the units when the number gains a digit, and each
	// piece moves on its own: a digit turns like a wheel (`flow`) or is swapped through a blur
	// (`blur`), what joins the number fades in, what leaves it fades out, and the rest slides to
	// its new place. The server renders the plain number; a person using assistive technology
	// reads the plain number too.
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { getNumberFormatter } from '$lib/utils/number.js';
	import { presence } from '$lib/utils/stateAttributes.js';
	import { toAnimatedNumberParts, type AnimatedNumberSectionName } from './animatedNumber.parts.js';
	import type { AnimatedNumberProps } from './animatedNumber.props.js';
	import { AnimatedNumberState, animatedNumberAnchor } from './animatedNumber.state.svelte.js';
	import { useAnimatedNumberTheme } from './animatedNumber.theme.js';

	let {
		value,
		variant = 'flow',
		format,
		locale,
		prefix,
		suffix,
		trend = 'auto',
		continuous = false,
		duration,
		blur,
		animated = true,
		ref = $bindable(null),
		class: className,
		theme,
		...rest
	}: AnimatedNumberProps = $props();

	const classes = $derived(useAnimatedNumberTheme(theme));
	const messages = $derived(useI18n());
	const formatter = $derived(getNumberFormatter(locale ?? messages.locale, format));
	const parts = $derived(toAnimatedNumberParts(value, formatter, prefix, suffix));

	const engine = new AnimatedNumberState(
		() => parts,
		() => ({
			variant,
			trend,
			continuous,
			duration: duration ?? (variant === 'blur' ? 450 : 900),
			animated
		})
	);
	const view = $derived(engine.view);
</script>

{#snippet run(name: AnimatedNumberSectionName)}
	<span
		data-slot="animated-number-section"
		data-section={name}
		data-anchor={animatedNumberAnchor(name, view.rtl)}
		class={classes[name]()}
	>
		{#each view[name] as char (char.key)}
			{#if char.kind === 'digit' && variant === 'flow'}
				<span
					data-slot="animated-number-digit"
					data-wheel
					data-key={char.key}
					data-part={char.type}
					style:--_current={char.value}
					class={classes.digit()}
				>
					<!-- At rest a wheel carries the one digit it shows: the other nine come for the turn. -->
					{#each view.glyphs as glyph, digit (digit)}
						{#if view.animating || digit === char.value}
							<span
								data-slot="animated-number-numeral"
								data-current={presence(digit === char.value)}
								style:--_n={digit}>{glyph}</span
							>
						{/if}
					{/each}
				</span>
			{:else}
				<span
					data-slot={char.kind === 'digit' ? 'animated-number-digit' : 'animated-number-symbol'}
					data-key={char.key}
					data-part={char.type}
					class={char.kind === 'digit' ? classes.digit() : classes.symbol()}
				>
					<span data-layer="current"
						>{char.kind === 'digit' ? view.glyphs[char.value] : char.value}</span
					>{#if char.outgoing !== null}<span data-layer="outgoing">{char.outgoing}</span>{/if}
				</span>
			{/if}
		{/each}
	</span>
{/snippet}

<span
	bind:this={ref}
	data-slot="animated-number"
	data-variant={variant}
	data-animating={presence(view.animating)}
	dir={view.rtl ? 'rtl' : 'ltr'}
	class={classes.root({ className })}
	style:--animated-number-blur={blur === undefined ? undefined : `${Math.max(0, blur)}px`}
	{...rest}
	{@attach engine.attach}
>
	<!--
		What is read: the number as plain text. What is seen is hidden from assistive technology.
		No space is left between two tags from here on: it would be a space in the number when it is
		copied.
	-->
	<span data-slot="animated-number-text" class="sr-only select-none">{parts.text}</span><span
		data-slot="animated-number-visual"
		aria-hidden="true"
		>{@render run('pre')}<span data-slot="animated-number-number"
			><span data-slot="animated-number-inner"
				>{@render run('integer')}{@render run('fraction')}</span
			></span
		>{@render run('post')}</span
	>
</span>

<style>
	/*
	 * The digit wheels and the window they turn behind are NumberFlow's
	 * (github.com/barvian/number-flow), Copyright (c) 2024 Maxwell Barvian, MIT.
	 *
	 * Set on the root with a class: --animated-number-mask-height (0.25em) and
	 * --animated-number-mask-width (0.5em), the soft edges of the window; --animated-number-blur
	 * (0.45em) and --animated-number-distance (0.55em), the blur a swapped digit passes through
	 * and how far it travels. None is declared here, so a class can set them.
	 */
	:global {
		/* Every box is a flex row: the spaces between tags in the markup take no room. */
		[data-slot='animated-number-visual'],
		[data-slot='animated-number-inner'] {
			display: inline-flex;
			align-items: baseline;
		}

		/* What stands round a number follows its locale's reading direction; its digits never do. */
		[data-slot='animated-number-number'] {
			direction: ltr;
		}

		[data-slot='animated-number-section'] {
			position: relative;
			isolation: isolate;
		}
		/* A character that takes no room: an empty run keeps its place on the baseline. */
		[data-slot='animated-number-section']::after {
			content: '\200b';
		}
		/* The symbols round the number pass over the digits that leave it. */
		[data-slot='animated-number-visual'] > [data-slot='animated-number-section'] {
			z-index: 5;
		}

		[data-slot='animated-number-section'] > [data-key] {
			position: relative;
			isolation: isolate;
		}
		[data-slot='animated-number-section'] > [data-key]:not([data-wheel]) {
			display: inline-flex;
			align-items: baseline;
		}
		/* What leaves is out of the line, held where the engine put it. */
		[data-slot='animated-number-section'] > [data-key][data-exiting] {
			position: absolute;
			z-index: -1;
			margin: 0;
			pointer-events: none;
			user-select: none;
		}

		[data-slot='animated-number-section'] [data-layer] {
			display: inline-block;
			/* Some symbols are spaces. */
			white-space: pre;
		}
		[data-slot='animated-number-section'] [data-layer='outgoing'] {
			position: absolute;
			top: 0;
			pointer-events: none;
			user-select: none;
		}
		/* Two symbols crossing add up to one: neither shows through the other. */
		[data-slot='animated-number'][data-variant='flow'] [data-layer] {
			mix-blend-mode: plus-lighter;
		}
		[data-slot='animated-number'][data-variant='flow']
			[data-anchor='left']
			[data-layer='outgoing'] {
			left: 0;
		}
		[data-slot='animated-number'][data-variant='flow']
			[data-anchor='right']
			[data-layer='outgoing'] {
			right: 0;
		}
		[data-slot='animated-number'][data-variant='blur'] [data-layer='outgoing'] {
			inset: 0;
			text-align: center;
		}

		/*
		 * The window: the digits turn behind a mask with soft edges, one box round the whole
		 * number. On a change the box goes from the old number's width to the new one's by a
		 * scale, which its content undoes so that only the edges move.
		 */
		[data-slot='animated-number'][data-variant='flow'] [data-slot='animated-number-number'] {
			/* Rounded to whole pixels, or Safari sets the digits off the baseline. */
			--_fade: round(nearest, calc(var(--animated-number-mask-height, 0.25em) / 2), 1px);
			--_edge: var(--animated-number-mask-width, 0.5em);
			--_scale: calc(1 + var(--_animated-number-dw) / var(--_width, 1));
			--_scaled-edge: calc(var(--_edge) / var(--_scale));
			position: relative;
			/* The window is larger than the number and takes no more room than it. */
			margin: calc(-2 * var(--_fade)) calc(-1 * var(--_edge));
			/*
			 * The mask hides the digits waiting over and under the window, but they would still
			 * count as content that overflows: a scroll container round the number would grow by
			 * a line at each change, and show a scrollbar for it.
			 */
			overflow: clip;
			transform: translateX(var(--_animated-number-dx)) scaleX(var(--_scale));
			transform-origin: left top;
			mask-image:
				linear-gradient(
					to right,
					transparent 0,
					#000 var(--_scaled-edge),
					#000 calc(100% - var(--_scaled-edge)),
					transparent
				),
				linear-gradient(
					to bottom,
					transparent 0,
					#000 calc(var(--_fade) * 2),
					#000 calc(100% - var(--_fade) * 2),
					transparent 100%
				),
				radial-gradient(at bottom right, #000 0, transparent 71%),
				radial-gradient(at bottom left, #000 0, transparent 71%),
				radial-gradient(at top left, #000 0, transparent 71%),
				radial-gradient(at top right, #000 0, transparent 71%);
			mask-size:
				100% calc(100% - var(--_fade) * 4),
				calc(100% - var(--_scaled-edge) * 2) 100%,
				var(--_scaled-edge) calc(var(--_fade) * 2),
				var(--_scaled-edge) calc(var(--_fade) * 2),
				var(--_scaled-edge) calc(var(--_fade) * 2),
				var(--_scaled-edge) calc(var(--_fade) * 2);
			mask-position:
				center,
				center,
				top left,
				top right,
				bottom right,
				bottom left;
			mask-repeat: no-repeat;
		}
		[data-slot='animated-number'][data-variant='flow'] [data-slot='animated-number-inner'] {
			padding: var(--_fade) var(--_edge);
			transform: scaleX(calc(1 / var(--_scale))) translateX(calc(-1 * var(--_animated-number-dx)));
			transform-origin: left top;
		}
		[data-slot='animated-number'][data-variant='flow']
			[data-slot='animated-number-inner']
			[data-slot='animated-number-section']::after {
			padding: var(--_fade) 0;
		}

		/*
		 * A wheel: each digit sits as many lines from the one shown as it counts from it, the
		 * short way round, and the engine turns the wheel by animating the count.
		 */
		[data-slot='animated-number-digit'][data-wheel] {
			display: inline-block;
			--_c: var(--_current) + var(--_animated-number-d);
		}
		[data-slot='animated-number-numeral'] {
			display: inline-block;
			padding: var(--_fade) 0;
			--_raw: mod(10 + var(--_n) - mod(var(--_c), 10), 10);
			--_offset: calc(var(--_raw) - 10 * round(down, var(--_raw) / 5, 1));
			/* A digit more than a line away is behind the mask: it need not go further. */
			--_y: clamp(-100%, var(--_offset) * 100%, 100%);
			transform: translateY(var(--_y));
		}
		[data-slot='animated-number-numeral']:not([data-current]) {
			position: absolute;
			top: 0;
			left: 50%;
			transform: translateX(-50%) translateY(var(--_y));
			user-select: none;
		}
	}

	/* How far a wheel still has to turn, in digits. */
	@property --_animated-number-d {
		syntax: '<number>';
		inherits: true;
		initial-value: 0;
	}
	/* How far the window still is from its place, and from its width. */
	@property --_animated-number-dx {
		syntax: '<length>';
		inherits: true;
		initial-value: 0px;
	}
	@property --_animated-number-dw {
		syntax: '<number>';
		inherits: false;
		initial-value: 0;
	}
</style>
