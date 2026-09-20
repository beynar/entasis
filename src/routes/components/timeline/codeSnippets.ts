import type {
	TimelineOrientation,
	TimelinePlacement,
	TimelineVariant
} from '$lib/components/Timeline/index.js';
import type { Density, Sizes } from '$lib/types/theme.js';

export function getOrderCode({
	orientation,
	placement,
	variant,
	size,
	density,
	showDateTime,
	showConnectors,
	loading
}: {
	orientation: TimelineOrientation;
	placement: TimelinePlacement;
	variant: TimelineVariant;
	size: Sizes;
	density: Density;
	showDateTime: boolean;
	showConnectors: boolean;
	loading: boolean;
}): string {
	const timeSizeClass = (
		placement === 'alternate'
			? {
					small: 'text-[0.5625rem]',
					normal: 'text-[0.625rem]',
					large: 'text-[0.6875rem]'
				}
			: {
					small: 'text-[0.6875rem]',
					normal: 'text-[0.8125rem]',
					large: 'text-[0.9375rem]'
				}
	)[size];
	const alternateDateSizeClass = {
		small: '[&_[data-slot=timeline-date]]:text-[0.5625rem]',
		normal: '[&_[data-slot=timeline-date]]:text-[0.625rem]',
		large: '[&_[data-slot=timeline-date]]:text-[0.6875rem]'
	}[size];
	const timeColorClass = variant === 'soft' ? 'text-color-muted-readable/70' : 'text-neutral/60';
	const isAlternate = placement === 'alternate';
	const isHorizontalAlternate = orientation === 'horizontal' && placement === 'alternate';
	const isHorizontalFixed = orientation === 'horizontal' && placement !== 'alternate';

	return [
		'<script lang="ts">',
		"  import { Timeline, type TimelineItem } from 'entasis/timeline';",
		'',
		'  type OrderEvent = TimelineItem & {',
		"    time: string; status: 'complete' | 'current' | 'upcoming';",
		'  };',
		'',
		...(showDateTime
			? [
					'  const items: OrderEvent[] = orderEvents.map((event) =>',
					`    event.status === 'current' ? { ...event, loading: ${loading} } : event`,
					'  );'
				]
			: [
					'  const items: OrderEvent[] = orderEvents.map((event) => ({',
					'    ...event,',
					'    date: undefined,',
					'    datetime: undefined,',
					`    loading: event.status === 'current' ? ${loading} : event.loading`,
					'  }));'
				]),
		'</script>',
		'',
		'<Timeline',
		'  {items}',
		`  orientation="${orientation}"`,
		`  placement="${placement}"`,
		`  variant="${variant}"`,
		`  size="${size}"`,
		`  density="${density}"`,
		...(showConnectors ? [] : ['  showConnectors={false}']),
		'>',
		'  {#snippet item({ item, defaultContent })}',
		'    <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4">',
		`      <div class="min-w-0${!showDateTime || isHorizontalFixed ? ' col-span-2' : ''}${showDateTime && isHorizontalFixed ? ' grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 [&>[data-slot=timeline-title-row]]:col-span-2' : ''}" class:opacity-50={item.status === "upcoming"}>`,
		'        {@render defaultContent()}',
		...(showDateTime && isHorizontalFixed
			? [
					`        <time class="col-start-2 row-start-1 justify-self-end ${timeSizeClass} ${timeColorClass} whitespace-nowrap tabular-nums">`,
					'          {item.time}',
					'        </time>'
				]
			: []),
		'      </div>',
		...(!showDateTime || isHorizontalAlternate || isHorizontalFixed
			? []
			: [
					`      <time class="${timeSizeClass} ${timeColorClass} whitespace-nowrap tabular-nums">`,
					'        {item.time}',
					'      </time>'
				]),
		'    </div>',
		'  {/snippet}',
		...(showDateTime && isAlternate
			? [
					'',
					'  {#snippet opposite({ item, defaultOpposite })}',
					`    <div class="${orientation === 'horizontal' ? 'flex items-baseline gap-2 ' : ''}${alternateDateSizeClass} whitespace-nowrap">`,
					'      {@render defaultOpposite()}',
					...(orientation === 'horizontal'
						? [
								`      <time class="${timeSizeClass} ${timeColorClass} whitespace-nowrap tabular-nums">`,
								'        {item.time}',
								'      </time>'
							]
						: []),
					'    </div>',
					'  {/snippet}'
				]
			: []),
		'',
		'  {#snippet marker({ item, defaultMarker })}',
		'    {#if item.loading}',
		'      {@render defaultMarker()}',
		'    {:else if item.status === "current"}',
		'      <span class="current-marker">…</span>',
		'    {:else}',
		'      {@render defaultMarker()}',
		'    {/if}',
		'  {/snippet}',
		'</Timeline>'
	].join('\n');
}

export const milestonesCode = [
	"import { Timeline, type TimelineItem } from 'entasis/timeline';",
	'',
	'type Milestone = TimelineItem & {',
	'  dateBadge?: string;',
	'  media?: { label: string; src: string }[];',
	'};',
	'',
	'<Timeline items={milestones} placement="alternate" variant="card">',
	'  {#snippet item({ item, defaultContent })}',
	'    {@render defaultContent()}',
	'    {#if item.media}',
	'      <MediaGrid items={item.media} />',
	'    {/if}',
	'  {/snippet}',
	'',
	'  {#snippet opposite({ item, defaultOpposite })}',
	'    {#if item.dateBadge}',
	'      <Chip>{item.dateBadge}</Chip>',
	'    {:else}',
	'      {@render defaultOpposite()}',
	'    {/if}',
	'  {/snippet}',
	'</Timeline>'
].join('\n');

export const minimalCode = [
	'<Timeline items={releases} density="comfortable">',
	'  {#snippet marker({ index, defaultMarker })}',
	'    {#if index < 2}',
	'      <span class="hollow-marker"></span>',
	'    {:else}',
	'      {@render defaultMarker()}',
	'    {/if}',
	'  {/snippet}',
	'</Timeline>',
	'',
	'<Timeline items={roadmap} size="small" density="compact">',
	'  {#snippet marker({ color })}',
	'    <span data-color={color} class="size-2.5 rounded-full bg-color"></span>',
	'  {/snippet}',
	'</Timeline>'
].join('\n');

export const activityCode = [
	'type ActivityItem = TimelineItem & {',
	'  relativeTime: string;',
	'  activityIcon?: Snippet;',
	"  state: 'complete' | 'active';",
	'};',
	'',
	'<Timeline items={activities} density="comfortable">',
	'  {#snippet item({ item, defaultContent })}',
	'    {@render defaultContent()}',
	'    <p>{item.relativeTime}</p>',
	'  {/snippet}',
	'',
	'  {#snippet marker({ item, defaultMarker })}',
	'    {#if item.loading}',
	'      {@render defaultMarker()}',
	'    {:else if item.activityIcon}',
	'      <span class="activity-marker">{@render item.activityIcon()}</span>',
	'    {:else}',
	'      {@render defaultMarker()}',
	'    {/if}',
	'  {/snippet}',
	'</Timeline>'
].join('\n');

export const variantsCode = [
	"const variants = ['ghost', 'card', 'outline', 'soft'] as const;",
	'',
	'{#each variants as variant}',
	'  <Timeline',
	'    items={events}',
	'    {variant}',
	'    size="small"',
	'    density="compact"',
	'  />',
	'{/each}'
].join('\n');

export const layoutCode = [
	'<div class="max-w-[34rem]">',
	'  <Timeline',
	'    items={milestones}',
	'    placement="alternate"',
	'    variant="card"',
	'  />',
	'</div>',
	'',
	'<div class="max-w-2xl">',
	'  <Timeline',
	'    items={events}',
	'    orientation="horizontal"',
	'    placement="alternate"',
	'    variant="soft"',
	'    scrollFade',
	'  />',
	'</div>'
].join('\n');
