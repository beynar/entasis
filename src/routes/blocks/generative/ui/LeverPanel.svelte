<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Code } from 'entasis/code';
	import { SegmentedControl } from 'entasis/segmented-control';
	import { Select } from 'entasis/select';
	import { tooltip } from 'entasis/tooltip';
	import { checkCircleIcon } from 'entasis/icons/checkCircle';
	import { lockSimpleIcon } from 'entasis/icons/lockSimple';
	import { warningCircleIcon } from 'entasis/icons/warningCircle';
	import {
		directedSpace,
		failingRules,
		optionState,
		resolveParams,
		snapTo,
		validateParams,
		variantIndex,
		type OptionState
	} from '../engine/space.js';
	import type { DimValue, Direction, Params, Rule, SectionType } from '../engine/types.js';

	/**
	 * The lever panel: one control per design dimension, and nothing else. Options that would break
	 * a rule are not free positions — choosing one snaps the fewest other levers needed to land on
	 * a legal variant, and the panel says which rule forced it. Options a direction narrows away are
	 * disabled. The result is always inside the legal list.
	 */
	interface Props {
		type: SectionType;
		direction: Direction;
		params: Params;
		onParamsChange: (params: Params) => void;
		/** Header actions (shuffle, reroll, lock) supplied by the page. */
		actions?: Snippet;
		/** Hide the JSON spec, e.g. in a narrow inspector. */
		showSpec?: boolean;
	}

	let { type, direction, params, onParamsChange, actions, showSpec = true }: Props = $props();

	const directed = $derived(directedSpace(type, direction));
	const index = $derived(variantIndex(directed, params));
	const validation = $derived(validateParams(directed, params));
	const levers = $derived(directed.space.order);
	let notice = $state<{ lever: string; changed: string[]; rules: Rule[] } | null>(null);

	const keyOf = (value: DimValue) => String(value);
	const labelOf = (lever: string, value: DimValue) =>
		type.meta[lever]?.values?.[keyOf(value)] ?? keyOf(value);
	const leverLabel = (lever: string) => type.meta[lever]?.label ?? lever;

	const states = $derived(
		Object.fromEntries(
			levers.map((lever) => [
				lever,
				Object.fromEntries(
					type.dims[lever].map((value) => [
						keyOf(value),
						value === params[lever]
							? ({ kind: 'legal' } as OptionState)
							: optionState(directed, params, lever, value)
					])
				)
			])
		) as Record<string, Record<string, OptionState>>
	);

	const optionKinds = $derived(
		Object.values(states).flatMap((options) => Object.values(options).map((state) => state.kind))
	);
	const anyAdjusts = $derived(optionKinds.includes('adjusts'));
	const anyNarrowed = $derived(
		optionKinds.includes('narrowed') || optionKinds.includes('impossible')
	);

	// Rules currently shaping this variant: each blocks at least one single-lever move from here.
	const binding = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const lever of levers) {
			for (const value of type.dims[lever]) {
				if (value === params[lever]) continue;
				for (const rule of failingRules(type, { ...params, [lever]: value }, directed.rules)) {
					counts[rule.id] = (counts[rule.id] ?? 0) + 1;
				}
			}
		}
		return counts;
	});
	const allRules = $derived([...type.rules, ...directed.rules]);
	const derivedValues = $derived.by(() => {
		const resolved = resolveParams(type, params);
		return Object.entries(resolved).filter(([name]) => !(name in type.dims));
	});

	function choose(lever: string, key: string) {
		const value = type.dims[lever].find((candidate) => keyOf(candidate) === key);
		if (value === undefined || value === params[lever]) return;
		const state = optionState(directed, params, lever, value);
		if (state.kind === 'legal') {
			notice = null;
			onParamsChange({ ...params, [lever]: value });
			return;
		}
		const snapped = snapTo(directed, params, lever, value);
		if (!snapped) return;
		notice = {
			lever,
			changed: snapped.changed,
			rules: state.kind === 'adjusts' ? state.rules : []
		};
		onParamsChange(snapped.params);
	}

	function describe(state: OptionState) {
		if (state.kind === 'narrowed') return state.reason;
		if (state.kind === 'impossible') return 'No legal variant has this value';
		if (state.kind === 'adjusts')
			return `Also moves ${state.changed.map(leverLabel).join(', ')}${
				state.rules.length ? ` — ${state.rules[0].text}` : ''
			}`;
		return '';
	}

	const useSegments = (lever: string) => {
		const values = type.dims[lever];
		const length = values.reduce<number>((sum, value) => sum + labelOf(lever, value).length, 0);
		return values.length <= 4 && length <= 26;
	};
</script>

<div class="gap-xl flex flex-col">
	<header class="gap-md flex flex-col">
		<div class="gap-md flex items-start justify-between">
			<div class="gap-xs flex min-w-0 flex-col">
				<span class="text-neutral/60 text-xs font-medium tracking-wide uppercase">Variant</span>
				<p class="text-neutral text-sm font-semibold tabular-nums">
					{#if index >= 0}
						{(index + 1).toLocaleString('en-US')}
						<span class="text-neutral/60 font-normal"
							>of {directed.indices.length.toLocaleString('en-US')} legal</span
						>
					{:else}
						<span class="text-danger-readable">Outside the legal list</span>
					{/if}
				</p>
			</div>
			{@render actions?.()}
		</div>
		{#if !validation.ok}
			<div
				role="alert"
				class="gap-sm bg-danger-muted text-danger-muted-readable p-md flex flex-col rounded-md text-xs"
			>
				{#each validation.errors as error (error)}<p>{error}</p>{/each}
			</div>
		{:else if notice}
			<div
				role="status"
				class="gap-sm bg-primary-muted text-primary-muted-readable p-md flex items-start rounded-md text-xs"
			>
				<span class="pt-micro" aria-hidden="true">{@render warningCircleIcon()}</span>
				<p>
					{leverLabel(notice.lever)} snapped
					{notice.changed.length
						? notice.changed
								.map((lever) => `${leverLabel(lever)} → ${labelOf(lever, params[lever])}`)
								.join(', ')
						: 'nothing else'}{notice.rules.length ? ` to keep “${notice.rules[0].text}”.` : '.'}
				</p>
			</div>
		{/if}
	</header>

	<div class="gap-lg flex flex-col" role="group" aria-label="Levers">
		{#each levers as lever (lever)}
			{@const values = type.dims[lever]}
			<div class="gap-sm flex flex-col">
				<div class="gap-micro flex flex-col">
					<span class="text-neutral text-xs font-medium">{leverLabel(lever)}</span>
					{#if type.meta[lever]?.hint}
						<span class="text-neutral/65 text-xs">{type.meta[lever].hint}</span>
					{/if}
				</div>
				{#if useSegments(lever)}
					<SegmentedControl
						size="small"
						label={leverLabel(lever)}
						class="w-full"
						items={values.map((value) => ({
							value: keyOf(value),
							label: labelOf(lever, value),
							disabled:
								states[lever][keyOf(value)].kind === 'narrowed' ||
								states[lever][keyOf(value)].kind === 'impossible'
						}))}
						value={keyOf(params[lever])}
						onValueChange={(key) => choose(lever, key)}
					>
						{#snippet item(option)}
							{@const state = states[lever][option.value]}
							{#if state.kind === 'legal'}
								<span class="truncate">{option.label}</span>
							{:else}
								<span
									class="gap-xs inline-flex items-center truncate"
									{@attach tooltip({ content: describe(state) })}
								>
									{option.label}
									{#if state.kind === 'adjusts'}
										<span class="bg-warning size-1.5 shrink-0 rounded-full" aria-hidden="true"
										></span>
									{:else}
										<span class="text-neutral/50" aria-hidden="true"
											>{@render lockSimpleIcon()}</span
										>
									{/if}
								</span>
							{/if}
						{/snippet}
					</SegmentedControl>
				{:else}
					<Select
						size="small"
						triggerAttrs={{ 'aria-label': leverLabel(lever) }}
						items={values.map((value) => {
							const state = states[lever][keyOf(value)];
							return {
								value: keyOf(value),
								label:
									state.kind === 'adjusts'
										? `${labelOf(lever, value)} · adjusts`
										: labelOf(lever, value),
								disabled: state.kind === 'narrowed' || state.kind === 'impossible'
							};
						})}
						value={keyOf(params[lever])}
						onValueChange={(key) => typeof key === 'string' && choose(lever, key)}
					/>
				{/if}
			</div>
		{/each}
		{#if anyAdjusts || anyNarrowed}
			<p class="gap-md text-neutral/65 flex flex-wrap items-center text-xs">
				{#if anyAdjusts}
					<span class="gap-xs inline-flex items-center"
						><span class="bg-warning size-1.5 rounded-full" aria-hidden="true"></span> snaps other levers</span
					>
				{/if}
				{#if anyNarrowed}
					<span class="gap-xs inline-flex items-center"
						><span aria-hidden="true">{@render lockSimpleIcon()}</span> narrowed by {direction.label}</span
					>
				{/if}
			</p>
		{/if}
	</div>

	<section class="gap-md flex flex-col" aria-label="Rules">
		<h3 class="text-neutral/60 text-xs font-medium tracking-wide uppercase">
			Rules · {allRules.length}
		</h3>
		<ul class="gap-sm flex flex-col">
			{#each allRules as rule (rule.id)}
				{@const blocks = binding[rule.id] ?? 0}
				<li class="gap-sm flex items-start text-xs">
					<span class="text-success-readable pt-micro" aria-hidden="true"
						>{@render checkCircleIcon()}</span
					>
					<span class="text-neutral/75 min-w-0 flex-1">{rule.text}</span>
					{#if blocks}
						<span
							class="text-warning-readable shrink-0 tabular-nums"
							title="Options it blocks from here">blocks {blocks}</span
						>
					{/if}
				</li>
			{/each}
		</ul>
		{#if derivedValues.length}
			<p class="text-neutral/65 text-xs">
				Derived: {derivedValues.map(([name, value]) => `${name} = ${String(value)}`).join(' · ')}
			</p>
		{/if}
	</section>

	{#if showSpec}
		<Code
			code={JSON.stringify(params, null, 2)}
			language="json"
			title="Params"
			copyable
			maxHeight={280}
		/>
	{/if}
</div>
