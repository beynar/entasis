<script lang="ts">
	import { untrack } from 'svelte';
	import Slot from '../Slot/Slot.svelte';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { presence } from '$lib/utils/stateAttributes.js';
	import { formatSpokenClock, nextChangeDelay, resolveCountdown, toEpoch } from './countdown.js';
	import type { CountdownProps } from './countdown.props.js';
	import { useCountdownTheme } from './countdown.theme.js';

	let {
		until,
		from,
		format = 'relative',
		units = 1,
		locale: localeProp,
		onComplete,
		ref = $bindable(null),
		class: className,
		theme,
		children,
		...rest
	}: CountdownProps = $props();

	// setTimeout overflows past 2^31 - 1 ms (~24.8 days); longer waits wake up early and reschedule.
	const MAX_DELAY = 2_147_483_647;
	// With `from`, wake at least this many times over the span so `fraction` moves smoothly.
	const FRACTION_STEPS = 200;

	const t = $derived(useI18n());
	const classes = $derived(useCountdownTheme(theme));
	const locale = $derived(localeProp ?? t.locale);
	const untilTime = $derived(toEpoch(until));
	const fromTime = $derived(from === undefined ? undefined : toEpoch(from));

	// The server renders the value at render time; the client re-reads the clock on mount.
	let now = $state(Date.now());

	const payload = $derived(
		resolveCountdown({ now, until: untilTime, from: fromTime, format, units, locale })
	);
	const spoken = $derived(
		format === 'clock' && !children && !payload.done
			? formatSpokenClock(payload.remaining, locale)
			: ''
	);
	const datetime = $derived(
		Number.isFinite(untilTime) ? new Date(untilTime).toISOString() : undefined
	);

	// One timer, aimed at the next moment the text changes. Re-armed whenever the inputs change and
	// when the page becomes visible again (background tabs throttle timers).
	$effect(() => {
		const target = untilTime;
		const start = fromTime;
		const shape = { format, units };
		let timer: ReturnType<typeof setTimeout> | undefined;

		const schedule = () => {
			clearTimeout(timer);
			const current = Date.now();
			let delay = nextChangeDelay({ now: current, until: target, ...shape });
			if (delay === null) return;
			if (start !== undefined && Number.isFinite(start) && target > start) {
				delay = Math.min(delay, Math.max(1000, (target - start) / FRACTION_STEPS));
			}
			timer = setTimeout(tick, Math.min(delay, MAX_DELAY));
		};
		const tick = () => {
			now = Date.now();
			schedule();
		};
		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') tick();
		};

		tick();
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => {
			clearTimeout(timer);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	});

	// `onComplete` fires once per `until`: when it is reached, or on mount when it already passed.
	let completedAt: number | undefined;
	$effect(() => {
		if (!payload.done || completedAt === untilTime) return;
		completedAt = untilTime;
		untrack(() => onComplete?.());
	});
</script>

<time
	bind:this={ref}
	role="timer"
	{datetime}
	data-slot="countdown"
	data-format={format}
	data-done={presence(payload.done)}
	class={classes.root({ format, className })}
	{...rest}
>
	{#if children}
		<Slot render={children} {payload} />
	{:else if spoken}
		<span data-slot="countdown-clock" aria-hidden="true" class={classes.clock()}
			>{payload.label}</span
		><span data-slot="countdown-spoken" class={classes.spoken()}>{spoken}</span>
	{:else}
		{payload.label}
	{/if}
</time>
