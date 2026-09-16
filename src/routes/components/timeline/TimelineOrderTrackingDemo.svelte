<script lang="ts">
	import {
		Timeline,
		type TimelineItem,
		type TimelineItemPayload,
		type TimelineOrientation,
		type TimelinePlacement,
		type TimelineVariant
	} from '$lib/components/Timeline/index.js';
	import { checkIcon } from '$lib/components/Icons/check.js';
	import { packageIcon } from '$lib/components/Icons/package.js';
	import type { Density, Sizes } from '$lib/types/theme.js';

	let {
		orientation = 'vertical',
		placement = 'end',
		variant = 'ghost',
		size = 'normal',
		density = 'normal',
		showDateTime = true,
		showConnectors = true,
		loading = false
	}: {
		orientation?: TimelineOrientation;
		placement?: TimelinePlacement;
		variant?: TimelineVariant;
		size?: Sizes;
		density?: Density;
		showDateTime?: boolean;
		showConnectors?: boolean;
		loading?: boolean;
	} = $props();

	type OrderEvent = TimelineItem & {
		time: string;
		status: 'complete' | 'current' | 'upcoming';
	};

	const orderEvents: OrderEvent[] = [
		{
			id: 'placed',
			title: 'Your order has been placed.',
			date: '22 July, 2026',
			datetime: '2026-07-22',
			time: '3:00 PM',
			status: 'complete',
			icon: checkIcon,
			color: 'success',
			connectorColor: 'success'
		},
		{
			id: 'verified',
			title: 'Your order is verified.',
			date: '23 July, 2026',
			datetime: '2026-07-23',
			time: '7:32 PM',
			status: 'complete',
			icon: checkIcon,
			color: 'success',
			connectorColor: 'success'
		},
		{
			id: 'packed',
			title: 'Packed and ready for dispatch.',
			date: '24 July, 2026',
			datetime: '2026-07-24',
			time: '5:32 PM',
			status: 'current',
			icon: packageIcon,
			color: 'primary'
		},
		{
			id: 'transit',
			title: 'Courier is en route with your package.',
			date: '25 July, 2026',
			datetime: '2026-07-25',
			time: '2:00 PM',
			status: 'upcoming'
		},
		{
			id: 'delivery',
			title: 'Expected delivery to your address.',
			date: '28 July, 2026',
			datetime: '2026-07-28',
			time: '5:00 PM',
			status: 'upcoming'
		}
	];

	const timelineItems = $derived(
		orderEvents.map((orderEvent) => ({
			...orderEvent,
			date: showDateTime ? orderEvent.date : undefined,
			datetime: showDateTime ? orderEvent.datetime : undefined,
			loading: orderEvent.status === 'current' ? loading : orderEvent.loading
		}))
	);
	const eventTimeSizeClass = $derived(
		(placement === 'alternate'
			? {
					small: 'text-[0.5625rem]',
					normal: 'text-[0.625rem]',
					large: 'text-[0.6875rem]'
				}
			: {
					small: 'text-[0.6875rem]',
					normal: 'text-[0.8125rem]',
					large: 'text-[0.9375rem]'
				})[size]
	);
	const alternateDateSizeClass = $derived(
		{
			small: '[&_[data-slot=timeline-date]]:text-[0.5625rem]',
			normal: '[&_[data-slot=timeline-date]]:text-[0.625rem]',
			large: '[&_[data-slot=timeline-date]]:text-[0.6875rem]'
		}[size]
	);
	const isHorizontalFixed = $derived(orientation === 'horizontal' && placement !== 'alternate');
</script>

{#snippet eventTime(item: OrderEvent, isDateRow: boolean)}
	<time
		class:opacity-55={item.status === 'upcoming'}
		class:col-start-2={isDateRow}
		class:row-start-1={isDateRow}
		class:justify-self-end={isDateRow}
		class="{eventTimeSizeClass} whitespace-nowrap tabular-nums {variant === 'soft'
			? 'text-color-muted-readable/70'
			: 'text-neutral/70'}"
	>
		{item.time}
	</time>
{/snippet}

{#snippet orderItem({ item, defaultContent }: TimelineItemPayload<OrderEvent>)}
	<div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4">
		<div
			class:col-span-2={!showDateTime || isHorizontalFixed}
			class:grid={showDateTime && isHorizontalFixed}
			class:opacity-55={item.status === 'upcoming'}
			class="min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 [&>[data-slot=timeline-title-row]]:col-span-2"
		>
			{@render defaultContent()}
			{#if showDateTime && isHorizontalFixed}
				{@render eventTime(item, true)}
			{/if}
		</div>
		{#if showDateTime && !isHorizontalFixed && (orientation !== 'horizontal' || placement !== 'alternate')}
			{@render eventTime(item, orientation === 'horizontal')}
		{/if}
	</div>
{/snippet}

{#snippet orderMarker({ item, color, defaultMarker }: TimelineItemPayload<OrderEvent>)}
	{#if item.loading}
		{@render defaultMarker()}
	{:else if item.status === 'current'}
		<span
			data-color={color}
			class="bg-color text-color-contrast relative z-10 grid size-[var(--timeline-marker-size)] shrink-0 place-items-center rounded-full shadow-[0_0_0_4px_var(--color-surface)] [&>svg]:size-[58%]"
		>
			{@render packageIcon()}
		</span>
	{:else}
		{@render defaultMarker()}
	{/if}
{/snippet}

{#snippet orderOpposite({ item, defaultOpposite }: TimelineItemPayload<OrderEvent>)}
	{#if showDateTime}
		<div
			class:flex={orientation === 'horizontal'}
			class:items-baseline={orientation === 'horizontal'}
			class:gap-2={orientation === 'horizontal'}
			class="{alternateDateSizeClass} whitespace-nowrap"
		>
			{@render defaultOpposite()}
			{#if orientation === 'horizontal'}
				{@render eventTime(item, false)}
			{/if}
		</div>
	{/if}
{/snippet}

<div class="bg-surface w-full max-w-5xl rounded-2xl p-4 sm:p-7">
	<p class="text-neutral mb-7 text-lg font-semibold">
		{showDateTime ? 'Arriving on Tuesday, 28 July' : 'Order progress'}
	</p>

	{#if placement === 'alternate'}
		<Timeline
			items={timelineItems}
			{orientation}
			placement="alternate"
			{variant}
			{size}
			{density}
			{showConnectors}
			item={orderItem}
			marker={orderMarker}
			opposite={orderOpposite}
			aria-label="Order progress"
		/>
	{:else}
		<Timeline
			items={timelineItems}
			{orientation}
			{placement}
			{variant}
			{size}
			{density}
			{showConnectors}
			item={orderItem}
			marker={orderMarker}
			aria-label="Order progress"
		/>
	{/if}
</div>
