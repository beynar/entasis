<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'entasis/button';
	import { Code } from 'entasis/code';
	import { SegmentedControl } from 'entasis/segmented-control';
	import { Switch } from 'entasis/switch';
	import { TextArea } from 'entasis/text-area';
	import { arrowSquareOutIcon } from 'entasis/icons/arrowSquareOut';
	import { arrowsClockwiseIcon } from 'entasis/icons/arrowsClockwise';
	import { checkCircleIcon } from 'entasis/icons/checkCircle';
	import { copyIcon } from 'entasis/icons/copy';
	import { lockSimpleIcon } from 'entasis/icons/lockSimple';
	import { lockSimpleOpenIcon } from 'entasis/icons/lockSimpleOpen';
	import { trashIcon } from 'entasis/icons/trash';
	import { warningCircleIcon } from 'entasis/icons/warningCircle';
	import { wrenchIcon } from 'entasis/icons/wrench';
	import { activePageRules, formatCount } from '../engine/composition.js';
	import { defaultKitParams, kitType } from '../engine/kit.js';
	import { lookupSection } from '../registry.js';
	import DirectionPicker from '../ui/DirectionPicker.svelte';
	import LeverPanel from '../ui/LeverPanel.svelte';
	import { KIT_PREFIX } from '../ui/paramsUrl.js';
	import type { Composer } from './composer.svelte.js';

	interface Props {
		composer: Composer;
		applyTheme: boolean;
		onApplyThemeChange: (value: boolean) => void;
		onFocusSection: (id: string) => void;
	}

	let { composer, applyTheme, onApplyThemeChange, onFocusSection }: Props = $props();

	const slot = $derived(composer.selected);
	const type = $derived(slot ? lookupSection(slot.type) : undefined);
	const siblings = $derived(slot ? composer.siblingsOf(slot) : []);
	const slotIssues = $derived(
		slot ? composer.issues.filter((issue) => issue.slotId === slot.id) : []
	);
	const rules = $derived(activePageRules(composer.direction));
	const kitParams = $derived(composer.spec.kit?.params ?? defaultKitParams);
	const kitIssues = $derived(composer.issues.filter((issue) => issue.slotId === 'kit'));
	const ratio = $derived(
		composer.count.value > 0 ? composer.neutralCount.value / composer.count.value : 0
	);
	let importText = $state('');
	let importErrors = $state<string[]>([]);

	/** A share as a readable percentage, down to the tiny ones page rules produce. */
	function formatShare(share: number) {
		if (share >= 0.01) return `${Math.round(share * 100)}%`;
		if (share <= 0) return '0%';
		return `1 in ${formatCount(1 / share)}`;
	}

	function titleOf(index: number) {
		const entry = composer.spec.sections[index];
		return (entry && lookupSection(entry.type)?.title) ?? `Section ${index + 1}`;
	}

	function importSpec() {
		try {
			importErrors = composer.load(JSON.parse(importText));
			if (!importErrors.length) importText = '';
		} catch {
			importErrors = ['That is not valid JSON.'];
		}
	}
</script>

{#if slot && type}
	<div class="gap-xl flex flex-col">
		<header class="gap-md flex flex-col">
			<div class="gap-sm flex items-start justify-between">
				<div class="gap-xs flex min-w-0 flex-col">
					<span class="text-neutral/60 text-xs font-medium tracking-wide uppercase"
						>Section {composer.selectedIndex + 1}</span
					>
					<h2 class="text-neutral truncate text-base font-semibold">{type.title}</h2>
				</div>
				<Button
					size="small"
					variant="ghost"
					color="neutral"
					onclick={() => (composer.selectedId = null)}>Page</Button
				>
			</div>
			{#if siblings.length > 1}
				<SegmentedControl
					size="small"
					label="Section type"
					class="w-full"
					items={siblings.map((sibling) => ({ value: sibling.id, label: sibling.title }))}
					value={slot.type}
					onValueChange={(id) => composer.swapType(slot.id, id)}
				/>
			{/if}
			<div class="gap-xs flex flex-wrap">
				<Button
					size="small"
					variant="outline"
					color="neutral"
					prefix={arrowsClockwiseIcon}
					disabled={slot.locked}
					onclick={() => composer.reroll(slot.id)}>Reroll</Button
				>
				<Button
					size="small"
					variant={slot.locked ? 'soft' : 'outline'}
					color={slot.locked ? 'primary' : 'neutral'}
					prefix={slot.locked ? lockSimpleIcon : lockSimpleOpenIcon}
					pressed={slot.locked}
					onclick={() => composer.toggleLock(slot.id)}>{slot.locked ? 'Locked' : 'Lock'}</Button
				>
				<Button
					size="small"
					variant="ghost"
					squared
					prefix={copyIcon}
					label="Duplicate"
					onclick={() => composer.duplicate(slot.id)}
				/>
				<Button
					size="small"
					variant="ghost"
					squared
					prefix={arrowSquareOutIcon}
					label="Open in the block page"
					href={`${resolve('/blocks/generative/[block]', { block: type.id })}?${new URLSearchParams(
						[
							...Object.entries(slot.params).map(([lever, value]) => [lever, String(value)]),
							...Object.entries(kitParams).map(([lever, value]) => [
								`${KIT_PREFIX}${lever}`,
								String(value)
							]),
							...(composer.direction.id === 'neutral' ? [] : [['direction', composer.direction.id]])
						]
					)}`}
				/>
				<Button
					size="small"
					variant="ghost"
					squared
					color="danger"
					prefix={trashIcon}
					label="Remove"
					onclick={() => composer.remove(slot.id)}
				/>
			</div>
			<p class="text-neutral/65 text-xs">
				Editing a lever locks the section, so randomizing the page keeps your choice.
			</p>
			{#if slotIssues.length}
				<div
					role="alert"
					class="gap-xs bg-danger-muted text-danger-muted-readable p-md flex flex-col rounded-md text-xs"
				>
					{#each slotIssues as issue (issue.slotId)}{#each issue.errors as error (error)}<p>
								{error}
							</p>{/each}{/each}
				</div>
			{/if}
		</header>
		{#key `${slot.id}:${slot.type}:${composer.direction.id}`}
			<LeverPanel
				{type}
				direction={composer.direction}
				params={slot.params}
				onParamsChange={(params) => composer.setParams(slot.id, params)}
			/>
		{/key}
	</div>
{:else}
	<div class="gap-xl flex flex-col">
		<section class="gap-md flex flex-col" aria-labelledby="direction-heading">
			<h2
				id="direction-heading"
				class="text-neutral/60 text-xs font-medium tracking-wide uppercase"
			>
				Direction
			</h2>
			<DirectionPicker
				value={composer.direction.id}
				onValueChange={(id) => composer.setDirection(id)}
				{applyTheme}
			/>
			<Switch
				size="small"
				label="Apply the direction’s theme when it changes"
				value={applyTheme}
				onValueChange={(value) => onApplyThemeChange(!!value)}
			/>
			<Switch
				size="small"
				label="Randomize mixes the section types of each category"
				bind:value={composer.mixTypes}
			/>
		</section>

		<section class="gap-md flex flex-col" aria-labelledby="kit-heading">
			<div class="gap-sm flex items-start justify-between">
				<div class="gap-xs flex flex-col">
					<h2 id="kit-heading" class="text-neutral/60 text-xs font-medium tracking-wide uppercase">
						Component kit
					</h2>
					<p class="text-neutral/65 text-xs">
						Shared size, accent and variants: every component on the page reads them.
					</p>
				</div>
				<div class="gap-xs flex shrink-0">
					<Button
						size="small"
						variant="ghost"
						squared
						prefix={arrowsClockwiseIcon}
						label="Reroll the kit"
						disabled={composer.spec.kit?.locked}
						onclick={() => composer.rerollKit()}
					/>
					<Button
						size="small"
						variant="ghost"
						squared
						prefix={composer.spec.kit?.locked ? lockSimpleIcon : lockSimpleOpenIcon}
						label={composer.spec.kit?.locked ? 'Unlock the kit' : 'Lock the kit'}
						pressed={composer.spec.kit?.locked ?? false}
						onclick={() => composer.toggleKitLock()}
					/>
				</div>
			</div>
			{#if kitIssues.length}
				<div
					role="alert"
					class="gap-xs bg-danger-muted text-danger-muted-readable p-md flex flex-col rounded-md text-xs"
				>
					{#each kitIssues as issue (issue.slotId)}{#each issue.errors as error (error)}<p>
								{error}
							</p>{/each}{/each}
				</div>
			{/if}
			{#key composer.direction.id}
				<LeverPanel
					type={kitType}
					direction={composer.direction}
					params={kitParams}
					onParamsChange={(params) => composer.setKit(params)}
					showSpec={false}
				/>
			{/key}
		</section>

		<section class="gap-sm flex flex-col" aria-labelledby="count-heading">
			<h2 id="count-heading" class="text-neutral/60 text-xs font-medium tracking-wide uppercase">
				Composition space
			</h2>
			<p class="text-neutral text-2xl font-semibold tabular-nums">
				{composer.count.exact ? '' : '≈ '}{formatCount(composer.count.value)}
			</p>
			<p class="text-neutral/65 text-xs">
				pages from this outline under {composer.direction.label}{composer.count.exact
					? `, counted exactly. ${formatShare(composer.count.passRate)} of the raw combinations pass the page rules.`
					: ', estimated.'}
				{#if composer.direction.id !== 'neutral' && ratio > 1}
					It keeps 1 in {formatCount(ratio)} of Neutral’s pages.
				{/if}
				Locked sections count once.
			</p>
		</section>

		<section class="gap-md flex flex-col" aria-labelledby="rules-heading">
			<div class="gap-sm flex items-center justify-between">
				<h2 id="rules-heading" class="text-neutral/60 text-xs font-medium tracking-wide uppercase">
					Page rules · {rules.length}
				</h2>
				{#if composer.violations.length}
					<Button size="small" variant="soft" prefix={wrenchIcon} onclick={() => composer.repair()}
						>Repair</Button
					>
				{/if}
			</div>
			<ul class="gap-sm flex flex-col">
				{#each rules as rule (rule.id)}
					{@const violation = composer.violations.find((entry) => entry.id === rule.id)}
					<li class="gap-sm flex items-start text-xs">
						{#if violation}
							<span class="text-warning-readable pt-micro" aria-hidden="true"
								>{@render warningCircleIcon()}</span
							>
						{:else}
							<span class="text-success-readable pt-micro" aria-hidden="true"
								>{@render checkCircleIcon()}</span
							>
						{/if}
						<div class="gap-xs flex min-w-0 flex-col">
							<span class="text-neutral/80">{rule.text}</span>
							{#if violation}
								<span class="gap-xs flex flex-wrap">
									{#each violation.indices as index (index)}
										<button
											type="button"
											class="text-warning-readable underline-offset-2 hover:underline"
											onclick={() => {
												const id = composer.spec.sections[index]?.id;
												if (id) {
													composer.selectedId = id;
													onFocusSection(id);
												}
											}}>{index + 1}. {titleOf(index)}</button
										>
									{/each}
								</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
			<p class="text-neutral/65 text-xs" role="status">
				{#if composer.log.unresolved.length}
					Repair stopped after {composer.log.attempts} attempts: locked sections clash. Unlock one, or
					edit it.
				{:else if composer.log.attempts}
					Repaired in {composer.log.attempts}
					{composer.log.attempts === 1 ? 'attempt' : 'attempts'}.
				{:else if !composer.violations.length}
					Every page rule holds.
				{/if}
			</p>
		</section>

		<section class="gap-md flex flex-col" aria-labelledby="spec-heading">
			<h2 id="spec-heading" class="text-neutral/60 text-xs font-medium tracking-wide uppercase">
				Page spec
			</h2>
			<p class="text-neutral/65 text-xs">
				Params, not indices: the spec stays valid when a lever gains a value.
			</p>
			<Code
				code={JSON.stringify(composer.spec, null, 2)}
				language="json"
				title="page.json"
				copyable
				maxHeight={240}
			/>
			<TextArea
				bind:value={importText}
				placeholder="Paste a page spec to load it…"
				rows={3}
				textareaAttrs={{ 'aria-label': 'Page spec to import' }}
			/>
			<Button
				size="small"
				variant="outline"
				color="neutral"
				disabled={!importText.trim()}
				onclick={importSpec}>Load spec</Button
			>
			{#if importErrors.length}
				<div
					role="alert"
					class="gap-xs bg-danger-muted text-danger-muted-readable p-md flex flex-col rounded-md text-xs"
				>
					{#each importErrors as error (error)}<p>{error}</p>{/each}
				</div>
			{/if}
		</section>
	</div>
{/if}
