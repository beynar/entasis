<script lang="ts">
	import structureMap from 'virtual:entasis-structure';
	import type { StructureNode } from '../../tooling/structure-docs/types.js';

	let { component }: { component: string } = $props();
	const structure = $derived(structureMap[component]);

	type Box = {
		kind: StructureNode['kind'];
		tag?: string;
		themePart?: string;
		slot?: StructureNode['slot'];
		control?: StructureNode['control'];
		defaultValue?: string;
		children: Box[];
		spans: { t: string; cls: string }[];
	};

	function toBox(node: StructureNode): Box {
		const box: Box = {
			kind: node.kind,
			tag: node.tag,
			themePart: node.themePart,
			slot: node.slot,
			control: node.control,
			defaultValue: node.defaultValue,
			children: (node.children ?? []).map(toBox),
			spans: []
		};
		box.spans = spansOf(box);
		return box;
	}

	function spansOf(box: Box): { t: string; cls: string }[] {
		const spans: { t: string; cls: string }[] = [];
		if (box.kind === 'slot') {
			spans.push({ t: box.slot?.name ?? box.slot?.source ?? 'slot', cls: 'text-warning' });
			if (box.slot?.payload) spans.push({ t: ` ${box.slot.payload}`, cls: 'text-neutral/65' });
		} else {
			const nameCls = box.kind === 'component' ? 'text-neutral' : 'text-neutral/70';
			spans.push({ t: `<${box.tag}>`, cls: nameCls });
		}
		if (box.themePart) spans.push({ t: ` theme.${box.themePart}`, cls: 'text-primary-readable' });
		if (box.defaultValue)
			spans.push({ t: ` default: ${box.defaultValue}`, cls: 'text-neutral/65 italic' });
		return spans;
	}

	// Cycle container fills by nesting depth so the box hierarchy reads at a glance.
	const DEPTH_BG = ['bg-surface', 'bg-surface', 'bg-surface'];

	const roots = $derived((structure?.tree ?? []).map(toBox));
</script>

{#snippet children(boxes: Box[], depth: number)}
	<div class="flex flex-col gap-2">
		{#each boxes as child, i (i)}
			{@render row(child, depth)}
		{/each}
	</div>
{/snippet}

{#snippet row(box: Box, depth: number)}
	{#if box.kind === 'control'}
		<div class="border-danger relative mt-2 rounded-lg border border-dashed px-3 pt-5 pb-3">
			<span
				class="bg-danger-muted text-danger absolute top-0 left-3 -translate-y-1/2 rounded px-1.5 py-0.5 font-mono text-[11px]"
			>
				<span class="font-semibold tracking-wide uppercase">{box.control?.keyword + ' '}</span
				>{#if box.control?.label}<span class="opacity-80"> {box.control.label}</span>{/if}
			</span>
			{@render children(box.children, depth + 1)}
		</div>
	{:else}
		<div
			class="rounded-lg border px-3 py-2 {box.kind === 'slot'
				? 'border-warning/50 bg-warning/10 border-dashed'
				: `border-neutral-muted ${DEPTH_BG[depth % DEPTH_BG.length]}`}"
		>
			<div class="font-mono text-[13px] whitespace-nowrap">
				{#each box.spans as span, i (i)}<span class={span.cls}>{span.t}</span>{/each}
			</div>
			{#if box.children.length}
				<div class="mt-2">
					{@render children(box.children, depth + 1)}
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

{#if structure}
	<div class="border-neutral-muted bg-surface w-full overflow-hidden rounded-xl border">
		<div class="border-neutral-muted/60 flex items-center justify-between border-b px-6 py-3">
			<span class="text-neutral/65 text-[10.5px] font-semibold tracking-[0.12em] uppercase">
				Structure
			</span>
			<span class="flex flex-wrap gap-3 font-mono text-[11px]">
				<span class="text-warning">slot</span>
				<span class="text-primary-readable">theme.part</span>
				<span class="text-danger">each / if</span>
			</span>
		</div>
		<div class="overflow-x-auto p-4">
			{@render children(roots, 0)}
		</div>
	</div>
{:else}
	<p class="text-neutral/70 text-sm">No structural schema for <code>{component}</code>.</p>
{/if}
