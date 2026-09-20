<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import Button from '$lib/components/Button/Button.svelte';
	import ButtonGroup from '$lib/components/ButtonGroup/ButtonGroup.svelte';
	import CalendarPrimitive from '$lib/components/Form/Calendar/CalendarPrimitive.svelte';
	import { calendarIcon } from '$lib/components/Icons/calendar.js';
	import { caretDownIcon } from '$lib/components/Icons/caretDown.js';
	import { caretLeftIcon } from '$lib/components/Icons/caretLeft.js';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import {
		fromDateJumpDate,
		getDateJumpBounds,
		getDateJumpDisabledDates,
		getDateJumpToday,
		toDateJumpDate
	} from './eventCalendar.dateJump.js';
	import {
		getHiddenWeekdays,
		getMaximumDateProfileAnchor,
		getZonedDay,
		parseDateOnly
	} from './eventCalendar.date.js';
	import type { EventCalendarHeaderPayload } from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import type { EventCalendarView } from './eventCalendar.types.js';

	let {
		calendar
	}: {
		calendar: EventCalendarState<TItemFields, TResourceFields>;
	} = $props();

	let pickerYear = $state(1970);
	let pickerMonth = $state(0);
	const messages = $derived(calendar.messages);
	const density = $derived(calendar.density);
	const disabled = $derived(calendar.disabled);
	const classes = $derived(calendar.classes);
	const chrome = $derived({ density, view: calendar.view, disabled });

	$effect.pre(() => {
		const anchorDay = parseDateOnly(getZonedDay(calendar.date, calendar.timeZone));
		pickerYear = anchorDay.year;
		pickerMonth = anchorDay.month - 1;
	});

	const profile = $derived(calendar.dateProfile);
	const hiddenWeekdays = $derived(getHiddenWeekdays(calendar));
	const pickerValue = $derived(toDateJumpDate(getZonedDay(calendar.date, calendar.timeZone)));
	const maximumPickerAnchor = $derived(getMaximumDateProfileAnchor(calendar));
	const pickerBounds = $derived(
		getDateJumpBounds(calendar.validRange, calendar.timeZone, maximumPickerAnchor)
	);
	const pickerDisabledDates = $derived(
		getDateJumpDisabledDates(pickerYear, pickerMonth, hiddenWeekdays)
	);
	const pickerToday = $derived(getDateJumpToday(calendar.todayInstant, calendar.timeZone));
	const previousIcon = $derived(calendar.direction === 'rtl' ? caretRightIcon : caretLeftIcon);
	const nextIcon = $derived(calendar.direction === 'rtl' ? caretLeftIcon : caretRightIcon);
	const viewLabels = $derived<Record<EventCalendarView, string>>({
		month: messages.eventCalendarMonthView,
		week: messages.eventCalendarWeekView,
		day: messages.eventCalendarDayView,
		days: messages.eventCalendarDaysView,
		agenda: messages.eventCalendarAgendaView,
		resource: messages.eventCalendarResourceView
	});
	const viewItems = $derived(
		calendar.enabledViews.map((enabledView) => ({
			value: enabledView,
			label: viewLabels[enabledView],
			disabled
		}))
	);
	const viewMenuItems = $derived(
		calendar.enabledViews.map((enabledView) => ({
			type: 'option' as const,
			title: viewLabels[enabledView],
			selected: enabledView === calendar.view,
			disabled,
			onclick: () => calendar.setView(enabledView)
		}))
	);
	const previousButton = $derived({
		type: 'button' as const,
		prefix: previousIcon,
		label: messages.eventCalendarPrevious,
		onclick: () => calendar.previous()
	});
	const nextButton = $derived({
		type: 'button' as const,
		prefix: nextIcon,
		label: messages.eventCalendarNext,
		onclick: () => calendar.next()
	});
</script>

<div
	data-event-calendar-part="header"
	class={calendar.classes.header({
		...chrome,
		class:
			calendar.stickyHeader && calendar.scrollMode === 'page'
				? 'sticky top-[var(--event-calendar-sticky-offset)] z-40'
				: undefined
	})}
>
	{#if calendar.renderers.header}
		{@const headerPayload = {
			...calendar.snapshot,
			previous: previousPart,
			today: todayPart,
			next: nextPart,
			title: titlePart,
			viewSwitcher: viewSwitcherPart,
			datePicker: datePickerPart,
			actions: actionsPart
		} satisfies EventCalendarHeaderPayload<TItemFields, TResourceFields>}
		<Slot render={calendar.renderers.header} payload={headerPayload} />
	{:else}
		<div data-event-calendar-part="navigation" class={classes.navigation(chrome)}>
			<ButtonGroup
				items={[previousButton, nextButton]}
				size="small"
				variant="ghost"
				color="neutral"
				{disabled}
			/>
			{@render todayPart()}
		</div>
		{@render titlePart()}
		{@render datePickerPart()}
		{@render viewSwitcherPart()}
		{@render actionsPart()}
	{/if}
</div>

<span class="sr-only" aria-live="polite">
	{messages.eventCalendarViewAnnouncement(viewLabels[calendar.view])}
</span>

{#snippet previousPart()}
	{@render navigationButton(previousButton)}
{/snippet}

{#snippet todayPart()}
	<Button type="button" size="small" variant="outline" {disabled} onclick={() => calendar.today()}>
		{messages.eventCalendarToday}
	</Button>
{/snippet}

{#snippet nextPart()}
	{@render navigationButton(nextButton)}
{/snippet}

{#snippet navigationButton(button: typeof previousButton)}
	<Button {...button} squared size="small" variant="ghost" color="neutral" {disabled} />
{/snippet}

{#snippet titlePart()}
	<div
		role="status"
		data-event-calendar-part="title"
		class={classes.title(chrome)}
		aria-live="polite"
		aria-label={messages.eventCalendarRangeAnnouncement(profile.title)}
	>
		{profile.title}
	</div>
{/snippet}

{#snippet viewSwitcherPart()}
	<div data-event-calendar-part="view-switcher" class={classes.viewSwitcher(chrome)}>
		<div class="hidden @[40rem]:block">
			<SegmentedControl
				items={viewItems}
				value={calendar.view}
				size="small"
				label={messages.eventCalendarViewSwitcher}
				onValueChange={(nextView) => calendar.setView(nextView)}
			/>
		</div>
		<div class="@[40rem]:hidden">
			<PopupMenu position="bottom-end" menu={{ items: viewMenuItems, density: 'compact' }}>
				{#snippet trigger(popover)}
					<Button
						type="button"
						size="small"
						variant="outline"
						suffix={caretDownIcon}
						label={messages.eventCalendarViewMenu}
						haspopup="menu"
						expanded={popover.isOpen}
						{disabled}
						onclick={() => popover.toggle()}
						{@attach popover.reference}
					>
						{viewLabels[calendar.view]}
					</Button>
				{/snippet}
			</PopupMenu>
		</div>
	</div>
{/snippet}

{#snippet datePickerPart()}
	{#if calendar.showDatePicker}
		<Popover position="bottom-start">
			{#snippet trigger(popover)}
				<Button
					type="button"
					squared
					size="small"
					variant="ghost"
					color="neutral"
					prefix={calendarIcon}
					label={messages.eventCalendarChooseDate}
					haspopup="dialog"
					expanded={popover.isOpen}
					{disabled}
					onclick={() => {
						calendar.refreshNow();
						popover.toggle();
					}}
					{@attach popover.reference}
				/>
			{/snippet}
			{#snippet children(popover)}
				<CalendarPrimitive
					type="calendar"
					value={pickerValue}
					weekStartsOn={calendar.weekStartsOn}
					today={pickerToday}
					locale={calendar.locale}
					minDate={pickerBounds.minDate}
					maxDate={pickerBounds.maxDate}
					disabledDates={pickerDisabledDates}
					label={messages.eventCalendarChooseDate}
					{disabled}
					onViewChange={({ startYear, startMonth }) => {
						pickerYear = startYear;
						pickerMonth = startMonth;
					}}
					onValueChange={(selectedDate) => {
						if (!selectedDate) return;
						calendar.goTo(fromDateJumpDate(selectedDate));
						popover.close();
					}}
				/>
			{/snippet}
		</Popover>
	{/if}
{/snippet}

{#snippet actionsPart()}
	{#if calendar.renderers.actions}
		<div data-event-calendar-part="actions" class={classes.actions(chrome)}>
			<Slot render={calendar.renderers.actions} payload={calendar.snapshot} />
		</div>
	{/if}
{/snippet}
