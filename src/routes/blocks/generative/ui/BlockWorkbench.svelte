<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { Button } from 'entasis/button';
	import { SegmentedControl } from 'entasis/segmented-control';
	import { arrowCounterClockwiseIcon } from 'entasis/icons/arrowCounterClockwise';
	import { arrowSquareOutIcon } from 'entasis/icons/arrowSquareOut';
	import { caretLeftIcon } from 'entasis/icons/caretLeft';
	import { caretRightIcon } from 'entasis/icons/caretRight';
	import { desktopIcon } from 'entasis/icons/desktop';
	import { deviceMobileIcon } from 'entasis/icons/deviceMobile';
	import { deviceTabletIcon } from 'entasis/icons/deviceTablet';
	import { plusIcon } from 'entasis/icons/plus';
	import { shuffleIcon } from 'entasis/icons/shuffle';
	import { findDirection } from '../engine/directions.js';
	import { defaultKitParams, kitType } from '../engine/kit.js';
	import { freshSeed } from '../engine/random.js';
	import {
		directedSpace,
		sampleVariants,
		sameParams,
		seededVariant,
		validateParams,
		variantIndex
	} from '../engine/space.js';
	import { encodeSpec, SPEC_VERSION } from '../engine/spec.js';
	import type { Params, SectionType } from '../engine/types.js';
	import KitScope from '../sections/KitScope.svelte';
	import LeverPanel from './LeverPanel.svelte';
	import DirectionPicker from './DirectionPicker.svelte';
	import ScaledFrame from './ScaledFrame.svelte';
	import SectionView from './SectionView.svelte';
	import { KIT_PREFIX, paramsFromUrl, writeParams } from './paramsUrl.js';

	let { type }: { type: SectionType } = $props();

	const viewports = { desktop: 1280, tablet: 834, mobile: 390 } as const;
	type Viewport = keyof typeof viewports;

	let directionId = $state(untrack(() => findDirection(page.url.searchParams.get('direction')).id));
	const direction = $derived(findDirection(directionId));
	const directed = $derived(directedSpace(type, direction));

	// A hand-edited URL is validated like any other edit: rejected params are reported, never drawn.
	const initial = untrack(() => {
		const fromUrl = paramsFromUrl(type, page.url);
		const fallback = seededVariant(directedSpace(type, direction), type.id, direction.id);
		if (!fromUrl) return { params: fallback, errors: [] as string[] };
		const result = validateParams(directedSpace(type, direction), { ...fallback, ...fromUrl });
		return result.ok
			? { params: { ...fallback, ...fromUrl }, errors: [] }
			: { params: fallback, errors: result.errors };
	});
	// The component kit starts at the library defaults; its levers live under `kit.` in the URL.
	const initialKit = untrack(() => {
		const fromUrl = paramsFromUrl(kitType, page.url, KIT_PREFIX);
		const kits = directedSpace(kitType, direction);
		// Library defaults when the direction allows them, else the direction's own seeded kit.
		const start =
			variantIndex(kits, defaultKitParams) >= 0
				? defaultKitParams
				: seededVariant(kits, 'kit', direction.id);
		if (!fromUrl) return { params: start, errors: [] as string[] };
		const candidate = { ...start, ...fromUrl };
		const result = validateParams(kits, candidate);
		return result.ok
			? { params: candidate, errors: [] }
			: { params: start, errors: result.errors.map((error) => `Kit: ${error}`) };
	});
	let params = $state<Params>(initial.params);
	let kit = $state<Params>(initialKit.params);
	let rejected = $state([...initial.errors, ...initialKit.errors]);
	const kitDirected = $derived(directedSpace(kitType, direction));
	let viewport = $state<Viewport>('desktop');
	let sampleSeed = $state('samples');

	const index = $derived(variantIndex(directed, params));
	const samples = $derived(sampleVariants(directed, 6, sampleSeed, type.id, direction.id));
	const previewHref = $derived(
		`/previews/generative?spec=${encodeSpec({
			version: SPEC_VERSION,
			seed: 'preview',
			direction: direction.id,
			kit: { params: kit, locked: true, nonce: 0 },
			sections: [{ id: 's1', type: type.id, params, locked: true, nonce: 0 }]
		})}`
	);
	const composeHref = $derived(
		`${resolve('/blocks/generative/compose')}?${new URLSearchParams({
			add: type.id,
			...Object.fromEntries(Object.entries(params).map(([lever, value]) => [lever, String(value)]))
		})}`
	);

	function writeUrl(url: URL) {
		if (direction.id === 'neutral') url.searchParams.delete('direction');
		else url.searchParams.set('direction', direction.id);
		// `resolve()` only accepts a route id, so the query is appended to what it returns.
		const target = `${resolve('/blocks/generative/[block]', { block: type.id })}${url.search}`;
		replaceState(target as ResolvedPathname, page.state);
	}

	function commit(next: Params) {
		params = next;
		rejected = [];
		writeUrl(writeParams(type, page.url, next));
	}

	function commitKit(next: Params) {
		kit = next;
		rejected = [];
		writeUrl(writeParams(kitType, page.url, next, KIT_PREFIX));
	}

	function step(delta: number) {
		const count = directed.indices.length;
		const position = index < 0 ? 0 : (index + delta + count) % count;
		commit({ ...directed.space.variants[directed.indices[position]] });
	}

	function changeDirection(id: string) {
		directionId = id;
		const next = directedSpace(type, findDirection(id));
		const nextKit = directedSpace(kitType, findDirection(id));
		// Keep the current variant and kit when the new direction allows them; otherwise its picks.
		if (variantIndex(nextKit, kit) < 0) commitKit(seededVariant(nextKit, 'kit', id));
		commit(variantIndex(next, params) >= 0 ? params : seededVariant(next, type.id, id));
	}
</script>

<div class="gap-xl grid min-w-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
	<div class="gap-xl flex min-w-0 flex-col">
		<div class="border-neutral-muted bg-surface-canvas overflow-hidden rounded-lg border">
			<div
				class="gap-md border-neutral-muted p-md flex flex-wrap items-center justify-between border-b"
			>
				<SegmentedControl
					size="small"
					label="Preview viewport"
					items={[
						{ value: 'desktop', icon: desktopIcon, label: 'Desktop' },
						{ value: 'tablet', icon: deviceTabletIcon, label: 'Tablet' },
						{ value: 'mobile', icon: deviceMobileIcon, label: 'Mobile' }
					] as const}
					bind:value={viewport}
				/>
				<div class="gap-xs flex items-center">
					<Button
						size="small"
						variant="ghost"
						squared
						prefix={caretLeftIcon}
						label="Previous variant"
						onclick={() => step(-1)}
					/>
					<span class="text-neutral/70 min-w-24 text-center text-xs tabular-nums">
						{index >= 0 ? (index + 1).toLocaleString('en-US') : '—'} / {directed.indices.length.toLocaleString(
							'en-US'
						)}
					</span>
					<Button
						size="small"
						variant="ghost"
						squared
						prefix={caretRightIcon}
						label="Next variant"
						onclick={() => step(1)}
					/>
				</div>
				<div class="gap-xs flex items-center">
					<Button
						size="small"
						variant="outline"
						color="neutral"
						prefix={shuffleIcon}
						onclick={() => commit(seededVariant(directed, freshSeed(), type.id))}>Shuffle</Button
					>
					<Button
						size="small"
						variant="ghost"
						squared
						prefix={arrowCounterClockwiseIcon}
						label="Reset to the default variant"
						onclick={() => commit(seededVariant(directed, type.id, direction.id))}
					/>
					<Button
						size="small"
						variant="ghost"
						squared
						href={previewHref}
						target="_blank"
						prefix={arrowSquareOutIcon}
						label="Open full-size preview"
					/>
				</div>
			</div>
			<div class="bg-surface-recessed p-md">
				<div class="bg-surface overflow-hidden rounded-md shadow-sm">
					<ScaledFrame width={viewports[viewport]}>
						<KitScope params={kit}><SectionView {type} {params} /></KitScope>
					</ScaledFrame>
				</div>
			</div>
		</div>

		<section class="gap-md flex flex-col" aria-labelledby="samples-heading">
			<div class="gap-md flex flex-wrap items-center justify-between">
				<div class="gap-xs flex flex-col">
					<h2 id="samples-heading" class="text-neutral text-base font-semibold">
						Sampled variants
					</h2>
					<p class="text-neutral/65 text-xs">
						Six distinct legal variants, weighted by {direction.label}. Pick one to edit it.
					</p>
				</div>
				<Button
					size="small"
					variant="ghost"
					prefix={shuffleIcon}
					onclick={() => (sampleSeed = freshSeed())}>Resample</Button
				>
			</div>
			<div class="gap-md grid grid-cols-2 xl:grid-cols-3">
				{#each samples as sample, sampleIndex (sampleIndex)}
					{@const active = sameParams(directed.space.order, sample, params)}
					<!-- The thumbnail holds buttons of its own, so the pick button overlays it instead of
					     wrapping it. -->
					<div
						class="border-neutral-muted hover:border-primary/50 has-focus-visible:outline-primary bg-surface relative flex aspect-16/10 flex-col justify-center-safe overflow-hidden rounded-md border transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 {active
							? 'border-primary ring-primary ring-1'
							: ''}"
					>
						<ScaledFrame width={1280} thumbnail>
							<KitScope params={kit}><SectionView {type} params={sample} /></KitScope>
						</ScaledFrame>
						<button
							type="button"
							class="absolute inset-0 cursor-pointer focus-visible:outline-none"
							aria-label={`Use sampled variant ${variantIndex(directed, sample) + 1}`}
							aria-pressed={active}
							onclick={() => commit(sample)}
						></button>
					</div>
				{/each}
			</div>
		</section>
	</div>

	<aside
		class="gap-xl border-neutral-muted bg-surface-canvas p-lg flex h-fit min-w-0 flex-col rounded-lg border lg:sticky lg:top-0 lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto"
		aria-label="Levers"
	>
		<div class="gap-sm flex flex-col">
			<span class="text-neutral/60 text-xs font-medium tracking-wide uppercase">Direction</span>
			<DirectionPicker value={direction.id} onValueChange={changeDirection} />
		</div>
		{#if rejected.length}
			<div
				role="alert"
				class="gap-xs bg-danger-muted text-danger-muted-readable p-md flex flex-col rounded-md text-xs"
			>
				<p class="font-medium">The link’s levers were rejected:</p>
				{#each rejected as error (error)}<p>{error}</p>{/each}
				<p>Showing the default variant instead.</p>
			</div>
		{/if}
		<LeverPanel {type} {direction} {params} onParamsChange={commit}>
			{#snippet actions()}
				<Button size="small" variant="soft" prefix={plusIcon} href={composeHref}>Add to page</Button
				>
			{/snippet}
		</LeverPanel>
		<section
			class="gap-lg border-neutral-muted pt-xl flex flex-col border-t"
			aria-labelledby="kit-heading"
		>
			<div class="gap-xs flex flex-col">
				<h2 id="kit-heading" class="text-neutral text-sm font-semibold">Component kit</h2>
				<p class="text-neutral/65 text-xs">
					Shared props every component reads — the same kit restyles a whole page.
				</p>
			</div>
			<LeverPanel
				type={kitType}
				{direction}
				params={kit}
				onParamsChange={commitKit}
				showSpec={false}
			>
				{#snippet actions()}
					<div class="gap-xs flex">
						<Button
							size="small"
							variant="ghost"
							squared
							prefix={shuffleIcon}
							label="Shuffle the kit"
							onclick={() => commitKit(seededVariant(kitDirected, freshSeed(), 'kit'))}
						/>
						<Button
							size="small"
							variant="ghost"
							squared
							prefix={arrowCounterClockwiseIcon}
							label="Reset the kit to library defaults"
							disabled={variantIndex(kitDirected, defaultKitParams) < 0}
							onclick={() => commitKit(defaultKitParams)}
						/>
					</div>
				{/snippet}
			</LeverPanel>
		</section>
	</aside>
</div>
