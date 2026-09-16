<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
	import Slot from '../Slot/Slot.svelte';
	import { caretLeftIcon } from '../Icons/caretLeft.js';
	import { caretRightIcon } from '../Icons/caretRight.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { MiniCalendarDayPayload, MiniCalendarProps } from './miniCalendar.props.js';
	import { useMiniCalendarTheme } from './miniCalendar.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';

	// Noon avoids DST / timezone day-boundary shifts, mirroring Form/Calendar's date handling.
	const atNoon = (year: number, month: number, day: number) =>
		new Date(year, month, day, 12, 0, 0, 0);
	const normalizeDay = (date: Date) => atNoon(date.getFullYear(), date.getMonth(), date.getDate());
	const addDays = (date: Date, amount: number) =>
		atNoon(date.getFullYear(), date.getMonth(), date.getDate() + amount);
	const isSameDay = (a: Date, b: Date) =>
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate();

	let {
		defaultValue = null,
		value = $bindable(),
		startDate = $bindable(),
		days = 5,
		size = 'normal',
		color,
		disabled = false,
		locale,
		i18n,
		dir,
		class: className,
		ref = $bindable(null),
		onValueChange,
		onStartDateChange,
		theme,
		day,
		...attachments
	}: MiniCalendarProps = $props();
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);
	const startDateState = createBindableValue(
		() => startDate,
		(next) => {
			startDate = next;
		},
		() => normalizeDay(new Date())
	);

	const t = $derived(useI18n(i18n));
	const classes = $derived(useMiniCalendarTheme(theme));
	const resolvedColor = $derived(useDefaultColor(color));

	// Explicit prop wins, else the active i18n catalog's locale (reactive to runtime switches).
	const resolvedLocale = $derived(locale ?? t.locale);

	// Today is fixed for the lifetime of the instance; used only for the subtle highlight.
	const today = normalizeDay(new Date());

	const count = $derived(Math.max(1, Math.floor(days)));
	const start = $derived(normalizeDay(startDateState.value));

	const cells = $derived(
		Array.from({ length: count }, (_, index) => {
			const date = addDays(start, index);
			return {
				date,
				selected: valueState.value ? isSameDay(date, valueState.value) : false,
				today: isSameDay(date, today),
				monthLabel: date.toLocaleString(resolvedLocale, { month: 'short' }),
				dayNumber: date.getDate()
			} satisfies MiniCalendarDayPayload;
		})
	);

	// Chevron glyph size per token.
	const iconClass = $derived(
		size === 'small' ? 'size-3.5' : size === 'large' ? 'size-5' : 'size-4'
	);

	// In RTL the strip mirrors (previous sits on the right), so swap the chevron glyphs to keep them
	// pointing outward. Explicit prop wins, else the ambient direction once the root element binds,
	// mirroring how RatingInput resolves direction.
	const isRtl = $derived.by(() => {
		if (dir) return dir === 'rtl';
		if (typeof window === 'undefined' || !ref) return false;
		return getComputedStyle(ref).direction === 'rtl';
	});
	const prevIcon = $derived(isRtl ? caretRightIcon : caretLeftIcon);
	const nextIcon = $derived(isRtl ? caretLeftIcon : caretRightIcon);

	const dayLabel = (date: Date) =>
		date.toLocaleDateString(resolvedLocale, {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});

	// Direction of the last chevron navigation; drives the slide. Stays 0 until the first
	// shift so the initial mount does not animate.
	let shiftDir = $state(0);

	// Full-width push with no fade: the strip slides one viewport width, so the old range exits
	// through one edge while the new one enters through the other, clipped by the days viewport.
	// `dir` is the edge the track enters from / exits to (+1 right, -1 left), mirrored in RTL.
	const push = (_node: Element, { dir }: { dir: number }) => ({
		duration: dir === 0 || prefersReducedMotion() ? 0 : 200,
		easing: cubicOut,
		css: (_t: number, u: number) => `transform: translateX(${dir * u * 100}%)`
	});
	const enterDir = $derived(shiftDir * (isRtl ? -1 : 1));

	// Navigation is chronological regardless of direction: previous is always earlier dates.
	const shiftRange = (direction: number) => {
		if (disabled) return;
		shiftDir = direction;
		const next = addDays(start, direction * count);
		startDateState.value = next;
		onStartDateChange?.(next);
	};

	const selectDate = (date: Date) => {
		if (disabled) return;
		const picked = normalizeDay(date);
		if (valueState.value && isSameDay(valueState.value, picked)) return;
		valueState.value = picked;
		onValueChange?.(picked);
	};
</script>

<div bind:this={ref} {dir} class={classes.root({ size, disabled, className })} {...attachments}>
	<button
		type="button"
		{disabled}
		aria-label={t.previous}
		class={classes.navButton({ size })}
		onclick={() => shiftRange(-1)}
	>
		{@render prevIcon({ class: iconClass })}
	</button>

	<div class={classes.days()}>
		{#key start.getTime()}
			<div
				class={classes.track({ size })}
				in:push={{ dir: enterDir }}
				out:push={{ dir: -enterDir }}
			>
				{#each cells as cell (cell.date.getTime())}
					<button
						type="button"
						{disabled}
						aria-pressed={cell.selected}
						aria-label={dayLabel(cell.date)}
						data-today={cell.today ? '' : undefined}
						data-selected={cell.selected ? '' : undefined}
						class={classes.day({
							size,
							color: resolvedColor,
							selected: cell.selected,
							today: cell.today,
							disabled
						})}
						onclick={() => selectDate(cell.date)}
					>
						<Slot render={day} payload={cell}>
							<span class={classes.dayMonth({ size })}>{cell.monthLabel}</span>
							<span class={classes.dayNumber({ size })}>{cell.dayNumber}</span>
						</Slot>
					</button>
				{/each}
			</div>
		{/key}
	</div>

	<button
		type="button"
		{disabled}
		aria-label={t.next}
		class={classes.navButton({ size })}
		onclick={() => shiftRange(1)}
	>
		{@render nextIcon({ class: iconClass })}
	</button>
</div>
