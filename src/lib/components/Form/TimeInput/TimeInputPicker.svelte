<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import ScrollArea from '../../ScrollArea/ScrollArea.svelte';
	import type { Sizes } from '$lib/types/theme.js';
	import type { TimeInputThemeProps } from './timeInput.theme.js';
	import { useTimeInputTheme } from './timeInput.theme.js';
	import type { TimeOption } from './timeInputValue.js';

	type TimeInputPickerProps = {
		id?: string;
		hourOptions: TimeOption[];
		minuteOptions: TimeOption[];
		selectedHour: number | null;
		selectedMinute: number | null;
		size?: Sizes;
		theme?: TimeInputThemeProps;
		onSelectHour: (hour: number) => void;
		onSelectMinute: (minute: number) => void;
	};

	let {
		id,
		hourOptions,
		minuteOptions,
		selectedHour,
		selectedMinute,
		size,
		theme,
		onSelectHour,
		onSelectMinute
	}: TimeInputPickerProps = $props();

	const classes = $derived(useTimeInputTheme(theme));
	const t = $derived(useI18n());
</script>

<div {id} role="group" aria-label={t.timePicker} class={classes.picker()}>
	<div class={classes.pickerColumn()}>
		<div class={classes.pickerLabel({ size })}>{t.hour}</div>
		<ScrollArea scrollOnEdges type="auto" class={classes.pickerScrollArea()}>
			{#each hourOptions as hour (hour.value)}
				<button
					type="button"
					aria-pressed={hour.value === selectedHour}
					class={classes.pickerOption({ size, selected: hour.value === selectedHour })}
					onclick={() => onSelectHour(hour.value)}
				>
					{hour.label}
				</button>
			{/each}
		</ScrollArea>
	</div>

	<div class={classes.pickerColumn()}>
		<div class={classes.pickerLabel({ size })}>{t.minute}</div>
		<ScrollArea scrollOnEdges type="auto" class={classes.pickerScrollArea()}>
			{#each minuteOptions as minute (minute.value)}
				<button
					type="button"
					aria-pressed={minute.value === selectedMinute}
					class={classes.pickerOption({ size, selected: minute.value === selectedMinute })}
					onclick={() => onSelectMinute(minute.value)}
				>
					{minute.label}
				</button>
			{/each}
		</ScrollArea>
	</div>
</div>
