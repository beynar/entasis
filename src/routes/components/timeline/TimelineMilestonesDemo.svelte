<script lang="ts">
	import { Chip } from '$lib/components/Chip/index.js';
	import { Timeline, type TimelineItem } from '$lib/components/Timeline/index.js';
	import type { Colors } from '$lib/types/theme.js';

	type MediaTile = {
		label: string;
		src: string;
	};

	function createMediaImage(label: string, startColor: string, endColor: string): string {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${startColor}"/><stop offset="1" stop-color="${endColor}"/></linearGradient></defs><rect width="320" height="240" fill="url(#g)"/><circle cx="250" cy="46" r="54" fill="white" opacity=".2"/><rect x="36" y="74" width="178" height="104" rx="16" fill="white" opacity=".22"/><path d="M64 156l42-42 32 29 30-27 34 40" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity=".72"/><text x="36" y="211" fill="white" font-family="system-ui,sans-serif" font-size="20" font-weight="600">${label}</text></svg>`;
		return `data:image/svg+xml,${encodeURIComponent(svg)}`;
	}

	type Milestone = TimelineItem & {
		dateBadge?: string;
		badgeColor?: Colors;
		media?: MediaTile[];
		highlights?: { name: string; detail: string; color: Colors }[];
	};

	const milestones: Milestone[] = [
		{
			id: 'beginning',
			title: 'A dream that started at home',
			description:
				'With two people, a single desk, and a shared vision, we began building something we believed could make a difference.',
			date: 'January 2005',
			dateBadge: 'January 2005',
			badgeColor: 'neutral',
			media: [
				{ label: 'First desk', src: createMediaImage('First desk', '#a16207', '#f59e0b') },
				{ label: 'Remote call', src: createMediaImage('Remote call', '#1d4ed8', '#60a5fa') },
				{ label: 'Studio', src: createMediaImage('Studio', '#047857', '#34d399') },
				{ label: 'Prototype', src: createMediaImage('Prototype', '#0e7490', '#22d3ee') }
			]
		},
		{
			id: 'first-win',
			title: 'First big win',
			description:
				'Our first major delivery turned a small idea into a real business and gave the team room to grow.',
			date: 'June 2010',
			dateBadge: 'June 2010',
			badgeColor: 'primary',
			highlights: [
				{ name: 'South Airlines', detail: 'Online flight booking', color: 'info' },
				{ name: 'Pulse Health', detail: 'Remote care platform', color: 'success' }
			]
		},
		{
			id: 'recognition',
			title: 'Recognised and featured',
			description: 'Consistent quality brought industry attention and our first award.',
			date: 'May 2015',
			color: 'warning',
			media: [
				{ label: 'Gold award', src: createMediaImage('Gold award', '#92400e', '#fbbf24') },
				{ label: 'Press feature', src: createMediaImage('Press feature', '#6d28d9', '#c084fc') }
			]
		},
		{
			id: 'launch',
			title: 'Launched our first two products',
			description: 'The company moved from client work to a durable product portfolio.',
			date: 'January 2017',
			dateBadge: 'January 2017',
			badgeColor: 'success',
			color: 'success'
		}
	];
</script>

<div class="w-full max-w-6xl py-4">
	<Timeline
		items={milestones}
		placement="alternate"
		variant="card"
		density="comfortable"
		aria-label="Company milestones"
	>
		{#snippet item({ item, defaultContent })}
			<div class="space-y-4">
				{@render defaultContent()}

				{#if item.media}
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
						{#each item.media as media (media.label)}
							<figure class="bg-surface-raised relative aspect-[4/3] overflow-hidden rounded-lg">
								<img src={media.src} alt="" class="size-full object-cover" />
								<figcaption
									class="absolute inset-x-0 bottom-0 bg-black/45 px-2 py-1.5 text-xs font-medium text-white"
								>
									{media.label}
								</figcaption>
							</figure>
						{/each}
					</div>
				{/if}

				{#if item.highlights}
					<div class="grid gap-2">
						{#each item.highlights as highlight (highlight.name)}
							<div class="flex items-center gap-3">
								<span data-color={highlight.color} class="bg-color-muted size-9 shrink-0 rounded-lg"
								></span>
								<div class="min-w-0">
									<p class="text-neutral truncate text-sm font-medium">{highlight.name}</p>
									<p class="text-neutral/70 truncate text-xs">{highlight.detail}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/snippet}

		{#snippet opposite({ item, defaultOpposite })}
			{#if item.dateBadge}
				<Chip size="small" variant="soft" color={item.badgeColor ?? 'neutral'}>
					{item.dateBadge}
				</Chip>
			{:else}
				{@render defaultOpposite()}
			{/if}
		{/snippet}
	</Timeline>
</div>
