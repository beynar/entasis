<script lang="ts">
	import structureMap from 'virtual:svelai-structure';
	import type { ThemePart } from '../../tooling/structure-docs/types.js';
	import CustomizeTheme from './CustomizeTheme.svelte';

	let { component }: { component: string } = $props();

	const setter = $derived(structureMap[component]?.setter);
	// Only parts carrying a resolvable cva/motion definition are worth showing.
	const parts = $derived(
		(structureMap[component]?.parts ?? []).filter(
			(part: ThemePart) => part.base || (part.variants && part.variants.length)
		)
	);

	function isDefault(part: ThemePart, variant: string, value: string): boolean {
		return part.defaultVariants?.[variant] === value;
	}

	// The reserved `motion` slot holds a transition spec, not utility classes.
	function isMotion(part: ThemePart): boolean {
		return part.kind === 'motion';
	}
</script>

{#if parts.length}
	<div class="border-neutral-muted bg-surface w-full overflow-hidden rounded-xl border">
		<div class="border-neutral-muted/60 flex items-center justify-between gap-4 border-b px-6 py-3">
			<span class="text-neutral/65 text-[10.5px] font-semibold tracking-[0.12em] uppercase">
				Default theme
			</span>
			<div class="flex items-center gap-4">
				<span class="hidden flex-wrap gap-3 font-mono text-[11px] sm:flex">
					<span class="text-primary-readable">theme.part</span>
					<span class="text-success">default</span>
				</span>
				{#if setter}
					<CustomizeTheme {component} />
				{/if}
			</div>
		</div>

		<div class="divide-neutral-muted/60 divide-y">
			{#each parts as part (part.name)}
				<section class="px-6 py-4">
					<h3 class="mb-3 flex flex-wrap items-center gap-2 font-mono text-[13px]">
						<span class={isMotion(part) ? 'text-secondary' : 'text-primary-readable'}>
							theme.{part.name}
						</span>
						{#if isMotion(part)}
							<span
								class="bg-secondary/15 text-secondary rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase"
							>
								transition
							</span>
						{/if}
					</h3>

					{#if part.base}
						<div class="mb-3 flex flex-col gap-1 sm:flex-row sm:gap-3">
							<span
								class="text-neutral/65 shrink-0 pt-0.5 font-mono text-[11px] tracking-wide uppercase sm:w-20"
							>
								base
							</span>
							<code class="text-neutral/75 font-mono text-[12.5px] break-words">{part.base}</code>
						</div>
					{/if}

					{#each part.variants ?? [] as variant (variant.name)}
						<div class="mb-3 flex flex-col gap-1 sm:flex-row sm:gap-3">
							<span
								class="text-neutral/65 shrink-0 pt-0.5 font-mono text-[11px] tracking-wide uppercase sm:w-20"
							>
								{variant.name}
							</span>
							<div class="flex min-w-0 flex-col gap-1.5">
								{#each variant.options as option (option.value)}
									<div class="flex items-baseline gap-2">
										<span
											class="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] {isDefault(
												part,
												variant.name,
												option.value
											)
												? 'bg-success/15 text-success'
												: 'bg-surface-floating text-neutral/70'}"
										>
											{option.value}
										</span>
										<code class="text-neutral/70 font-mono text-[12.5px] break-words"
											>{option.classes}</code
										>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</section>
			{/each}
		</div>
	</div>
{/if}
