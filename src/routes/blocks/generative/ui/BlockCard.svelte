<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { arrowUpRightIcon } from 'entasis/icons/arrowUpRight';
	import { directedSpace } from '../engine/space.js';
	import type { Direction, Params, SectionType } from '../engine/types.js';
	import KitScope from '../sections/KitScope.svelte';
	import PageGhost from './PageGhost.svelte';
	import ScaledFrame from './ScaledFrame.svelte';
	import SectionView from './SectionView.svelte';

	interface Props {
		type: SectionType;
		direction: Direction;
		params: Params;
		/** Component kit the thumbnail renders with. */
		kit?: Params;
	}

	let { type, direction, params, kit }: Props = $props();

	const directed = $derived(directedSpace(type, direction));
	// `resolve()` only accepts a route id, so the query is appended to what it returns.
	const href = $derived(
		`${resolve('/blocks/generative/[block]', { block: type.id })}${
			direction.id === 'neutral' ? '' : `?direction=${direction.id}`
		}` as ResolvedPathname
	);
</script>

<!-- A stretched title link: the thumbnail holds links of its own, and anchors cannot nest. -->
<div
	class="group border-neutral-muted bg-surface-canvas hover:border-primary/50 has-focus-visible:outline-primary relative flex min-w-0 flex-col overflow-hidden rounded-lg border transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-4"
>
	<div
		class="border-neutral-muted bg-surface flex aspect-16/10 flex-col overflow-hidden border-b {type.placement ===
		'bottom'
			? 'justify-end'
			: type.placement === 'top'
				? 'justify-start'
				: 'justify-center-safe'}"
	>
		<ScaledFrame width={1280} thumbnail>
			<KitScope params={kit}>
				{#if type.placement === 'bottom'}<PageGhost />{/if}
				<SectionView {type} {params} />
				{#if type.placement === 'top'}<PageGhost />{/if}
			</KitScope>
		</ScaledFrame>
	</div>
	<div class="gap-md p-lg flex items-start justify-between">
		<div class="gap-xs flex min-w-0 flex-col">
			<h3 class="text-neutral text-sm font-semibold">
				<a {href} class="after:absolute after:inset-0 focus-visible:outline-none">{type.title}</a>
			</h3>
			<p class="text-neutral/65 text-xs">{type.description}</p>
			<p class="text-neutral/65 pt-xs text-xs tabular-nums">
				{directed.indices.length.toLocaleString('en-US')} legal variants · {directed.space.order
					.length} levers · {type.rules.length} rules
			</p>
		</div>
		{@render arrowUpRightIcon({
			class: 'size-4 shrink-0 text-neutral/35 transition-colors group-hover:text-primary-readable'
		})}
	</div>
</div>
