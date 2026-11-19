<script lang="ts">
	// Shows where a voice conversation is and how loud the voice is: a ring or an orb, in light
	// or solid, drawn on a canvas by an engine that reads these props every frame. The component
	// owns what the engine cannot know: the resolved colours, the surface it sits on, reduced
	// motion and the accessible name.
	import { untrack } from 'svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
	import { observeThemeTokens } from '$lib/utils/observeThemeTokens.js';
	import { presence } from '$lib/utils/stateAttributes.js';
	import { getVoiceAudioContext } from './voiceIndicator.audio.js';
	import { luminance, readCssColor, type Rgb } from './voiceIndicator.color.js';
	import {
		createVoiceIndicatorEngine,
		type VoiceIndicatorEngine,
		type VoiceIndicatorEngineInputs
	} from './voiceIndicator.engine.js';
	import type { VoiceIndicatorProps } from './voiceIndicator.props.js';
	import { useVoiceIndicatorTheme } from './voiceIndicator.theme.js';

	let {
		variant = 'ring',
		appearance = 'light',
		color = 'spectrum',
		state: phase = 'idle',
		input,
		output,
		size = 'normal',
		diameter,
		motion = 'balanced',
		speed = 1,
		sensitivity = 1,
		threshold = 0.04,
		curve = 'soft',
		curveAmount,
		direction,
		hoverBend = false,
		paused = false,
		colorScheme = 'auto',
		tuning,
		onLevelChange,
		onStart,
		onStop,
		disabled = false,
		label,
		ref = $bindable(null),
		class: className,
		theme,
		...attachments
	}: VoiceIndicatorProps = $props();

	// The strength `hoverBend={true}` bends at.
	const HOVER_BEND = 0.55;

	const describedBy = $props.id();
	const t = $derived(useI18n());
	const classes = $derived(useVoiceIndicatorTheme(theme));
	const interactive = $derived(!!(onStart || onStop));
	const inactive = $derived(phase === 'idle' || phase === 'error');
	const reducedMotion = $derived(prefersReducedMotion());

	const stateLabel = $derived(
		{
			idle: t.voiceIndicatorIdle,
			connecting: t.voiceIndicatorConnecting,
			listening: t.voiceIndicatorListening,
			thinking: t.voiceIndicatorThinking,
			speaking: t.voiceIndicatorSpeaking,
			error: t.voiceIndicatorError
		}[phase]
	);
	const actionLabel = $derived(inactive ? t.voiceIndicatorStart : t.voiceIndicatorStop);

	// The role the indicator shows: an error is the danger role whatever `color` is.
	const role = $derived(phase === 'error' ? 'danger' : color === 'spectrum' ? null : color);

	// The role's colour and the surface's lightness, read from the page: a canvas cannot use a
	// token. Read again when the tokens may have changed.
	let tokens = $state(0);
	$effect(() => observeThemeTokens(() => tokens++));
	let resolved = $state.raw<{ color: Rgb | null; dark: boolean }>({ color: null, dark: true });
	$effect(() => {
		void tokens;
		const node = ref;
		if (!node) return;
		let tone: Rgb | null = null;
		if (role) {
			// A probe inside the root, so a scoped palette applies to it.
			const probe = node.ownerDocument.createElement('span');
			probe.style.cssText = `display:none;background-color:var(--color-${role})`;
			node.append(probe);
			tone = readCssColor(getComputedStyle(probe).backgroundColor);
			probe.remove();
		}
		const dark =
			colorScheme === 'auto'
				? luminance(readCssColor(getComputedStyle(node).color) ?? [0, 0, 0]) > 0.35
				: colorScheme === 'dark';
		resolved = { color: tone, dark };
	});

	const inputs = (): VoiceIndicatorEngineInputs => ({
		variant,
		appearance,
		state: phase,
		input,
		output,
		motion,
		speed,
		sensitivity,
		threshold,
		curve,
		curveAmount,
		direction,
		hoverBend:
			hoverBend === true ? HOVER_BEND : hoverBend ? Math.min(1, Math.max(0, hoverBend)) : 0,
		paused,
		reducedMotion,
		dark: resolved.dark,
		color: resolved.color,
		tuning: tuning ?? {},
		onLevelChange
	});

	let engine: VoiceIndicatorEngine | null = null;
	// The engine reads the inputs itself each frame: creating it must not depend on them.
	const draw = (canvas: HTMLCanvasElement) =>
		untrack(() => {
			const created = createVoiceIndicatorEngine(canvas, inputs);
			engine = created;
			return () => {
				created.destroy();
				if (engine === created) engine = null;
			};
		});
	// A change of any input is taken into account at once, also while the loop is held.
	$effect(() => {
		inputs();
		untrack(() => engine?.sync());
	});

	const press = () => {
		// Inside the press, so the browser lets the audio that follows start.
		getVoiceAudioContext();
		if (inactive) onStart?.();
		else onStop?.();
	};
</script>

{#snippet canvas()}
	<canvas {@attach draw} aria-hidden="true" class={classes.canvas()}></canvas>
{/snippet}

{#if interactive}
	<button
		bind:this={ref}
		type="button"
		data-slot="voice-indicator"
		data-variant={variant}
		data-appearance={appearance}
		data-state={phase}
		data-color={role ?? 'spectrum'}
		data-disabled={presence(disabled)}
		class={classes.root({ size, interactive: true, disabled, className })}
		style:--voice-indicator-size={diameter ? `${diameter}px` : undefined}
		aria-label={label ?? actionLabel}
		aria-describedby={describedBy}
		{disabled}
		onclick={press}
		{...attachments}
	>
		{@render canvas()}
		<span id={describedBy} class="sr-only">{stateLabel}</span>
	</button>
{:else}
	<div
		bind:this={ref}
		role="img"
		data-slot="voice-indicator"
		data-variant={variant}
		data-appearance={appearance}
		data-state={phase}
		data-color={role ?? 'spectrum'}
		class={classes.root({ size, className })}
		style:--voice-indicator-size={diameter ? `${diameter}px` : undefined}
		aria-label={label ?? stateLabel}
		{...attachments}
	>
		{@render canvas()}
	</div>
{/if}
