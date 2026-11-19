<script lang="ts">
	// Shows what an agent is doing as a small figure of dots, drawn on a canvas by a player that
	// follows these props. The component owns what the player cannot know: the ink, read from
	// the page, the surface the orb sits on, reduced motion and the accessible name.
	import { untrack } from 'svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { luminance, readCssColor, type Rgb } from '$lib/utils/cssColor.js';
	import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
	import { observeThemeTokens } from '$lib/utils/observeThemeTokens.js';
	import { presence } from '$lib/utils/stateAttributes.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import {
		createThinkingOrbPlayer,
		type ThinkingOrbPlayer,
		type ThinkingOrbPlayerInputs
	} from './thinkingOrb.player.js';
	import type { ThinkingOrbProps } from './thinkingOrb.props.js';
	import { useThinkingOrbTheme } from './thinkingOrb.theme.js';

	let {
		state: activity = 'working',
		color,
		size = 'normal',
		diameter,
		speed = 1,
		paused = false,
		dots = 1,
		dotSize = 1,
		tuning,
		frame,
		colorScheme = 'auto',
		label,
		ref = $bindable(null),
		class: className,
		theme,
		...attachments
	}: ThinkingOrbProps = $props();

	const t = $derived(useI18n());
	const classes = $derived(useThinkingOrbTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));
	const reducedMotion = $derived(prefersReducedMotion());

	const stateLabel = $derived(
		{
			working: t.thinkingOrbWorking,
			searching: t.thinkingOrbSearching,
			solving: t.thinkingOrbSolving,
			listening: t.thinkingOrbListening,
			connecting: t.thinkingOrbConnecting,
			weaving: t.thinkingOrbWeaving,
			composing: t.thinkingOrbComposing,
			breathing: t.thinkingOrbBreathing,
			shaping: t.thinkingOrbShaping
		}[activity]
	);

	// The ink and the surface's lightness, read from the page: a canvas cannot use a token. The
	// ink is the root's own text colour, which the colour role and any class set; the surface is
	// judged by the text colour around the orb. Read again when either may have changed.
	let tokens = $state(0);
	$effect(() => observeThemeTokens(() => tokens++));
	let resolved = $state.raw<{ ink: Rgb | null; dark: boolean }>({ ink: null, dark: false });
	$effect(() => {
		void tokens;
		void resolvedColor;
		void className;
		void theme;
		const node = ref;
		if (!node) return;
		const ink = readCssColor(getComputedStyle(node).color);
		const around = readCssColor(getComputedStyle(node.parentElement ?? node).color);
		const dark =
			colorScheme === 'auto' ? luminance(around ?? [0, 0, 0]) > 0.35 : colorScheme === 'dark';
		if (dark !== resolved.dark || ink?.join() !== resolved.ink?.join()) resolved = { ink, dark };
	});

	const inputs = (): ThinkingOrbPlayerInputs => ({
		state: activity,
		speed,
		paused,
		reducedMotion,
		dark: resolved.dark,
		ink: resolved.ink,
		dots,
		dotSize,
		tuning,
		frame
	});

	let player: ThinkingOrbPlayer | null = null;
	// The player is told of a change by the effect below: creating it must not depend on any.
	const play = (canvas: HTMLCanvasElement) =>
		untrack(() => {
			const created = createThinkingOrbPlayer(canvas, inputs);
			player = created;
			return () => {
				created.destroy();
				if (player === created) player = null;
			};
		});
	$effect(() => {
		// Read deeply, so a change inside `tuning` counts.
		const next = inputs();
		if (next.tuning)
			for (const key in next.tuning) void next.tuning[key as keyof typeof next.tuning];
		untrack(() => player?.sync());
	});
</script>

<span
	bind:this={ref}
	role="img"
	data-slot="thinking-orb"
	data-state={activity}
	data-color={resolvedColor}
	data-paused={presence(paused)}
	class={classes.root({ size, color: resolvedColor, className })}
	style:--thinking-orb-size={diameter ? `${diameter}px` : undefined}
	aria-label={label ?? stateLabel}
	{...attachments}
>
	<canvas {@attach play} aria-hidden="true" class={classes.canvas()}></canvas>
</span>
