<script lang="ts">
	import propsMap from 'virtual:entasis-props';
	import type { PropCategory, PropDoc } from '../../tooling/props-docs/types.js';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import Code from '$lib/components/Code/Code.svelte';
	import Chip from '$lib/components/Chip/Chip.svelte';
	import { bracketsCurlyIcon } from '$lib/components/Icons/bracketsCurly.js';
	import { currencyDollarIcon } from '$lib/components/Icons/currencyDollar.js';
	import { bracketsAngleIcon } from '$lib/components/Icons/bracketsAngle.js';
	import { functionIcon } from '$lib/components/Icons/function.js';
	import type { Colors } from '$lib/types/theme.js';

	let { component }: { component: string } = $props();

	const docs = $derived(propsMap[component]);

	type SectionIcon = typeof bracketsCurlyIcon;
	const sectionOrder: {
		category: PropCategory;
		label: string;
		icon: SectionIcon;
		color: Colors;
	}[] = [
		{ category: 'prop', label: 'Props', icon: bracketsCurlyIcon, color: 'primary' },
		{ category: 'binding', label: 'Bindable props', icon: currencyDollarIcon, color: 'success' },
		{ category: 'slot', label: 'Slots', icon: bracketsAngleIcon, color: 'warning' },
		{ category: 'event', label: 'Callbacks', icon: functionIcon, color: 'info' }
	];

	const sections = $derived(
		sectionOrder
			.map(({ category, label, icon, color }) => ({
				label,
				icon,
				color,
				props: docs?.props.filter((prop: PropDoc) => prop.category === category) ?? []
			}))
			.filter((section) => section.props.length > 0)
	);

	// Split a description into plain and `inline code` segments so backticks render as code.
	const describe = (text: string) =>
		text.split(/(`[^`]+`)/).map((part) => ({
			code: part.startsWith('`') && part.endsWith('`'),
			value: part.startsWith('`') && part.endsWith('`') ? part.slice(1, -1) : part
		}));
</script>

{#if docs}
	<div class="border-neutral-muted bg-surface mt-12 w-full overflow-hidden rounded-xl border">
		{#if docs.htmlAttributes.length > 0}
			<div class="border-neutral-muted/40 flex items-center gap-2 border-b px-6 py-3">
				<span class="text-neutral/65 text-[10.5px] font-semibold tracking-[0.12em] uppercase">
					Extends
				</span>
				{#each docs.htmlAttributes as htmlAttributes (htmlAttributes)}
					<Chip size="small" variant="soft" color="primary">
						<code>{htmlAttributes}</code>
					</Chip>
				{/each}
			</div>
		{/if}
		<div class="overflow-x-auto" role="region" aria-label="Props table" tabindex="0">
			<table class="w-full border-collapse text-left">
				{#each sections as section (section.label)}
					<tbody>
						<tr>
							<th
								colspan="3"
								class="text-neutral/65 px-6 pt-5 pb-1.5 text-left text-[10.5px] font-semibold tracking-[0.12em] uppercase"
							>
								<span class="flex items-center gap-1.5">
									{@render section.icon({ size: 13, color: section.color })}
									{section.label}
								</span>
							</th>
						</tr>
						{#each section.props as prop (prop.name)}
							<tr class="state-layer border-neutral-muted/40 border-t align-top transition-colors">
								<td class="px-6 py-3.5 whitespace-nowrap">
									<span class="inline-flex items-center gap-2">
										<span class="text-neutral font-mono text-[13px] font-medium">{prop.name}</span>
										{#if !prop.optional}
											<span
												class="bg-primary/10 text-primary-readable rounded-full px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase"
											>
												Required
											</span>
										{/if}
									</span>
								</td>
								<td class="px-6 py-3.5">
									{#if prop.type}
										<Popover
											openOnHover
											openOnClick
											delay={150}
											position="bottom"
											closeOnMouseLeave
										>
											{#snippet trigger(popover)}
												<button
													type="button"
													{@attach popover.reference}
													onclick={() => popover.toggle()}
													class="text-primary/90 hover:text-primary-readable decoration-primary/30 hover:decoration-primary/60 cursor-help bg-transparent p-0 text-left font-mono text-[13px] underline decoration-dotted underline-offset-[3px] transition-colors"
												>
													{prop.value}
												</button>
											{/snippet}
											<Code
												language="typescript"
												code={prop.type}
												showHeader={false}
												copyable={false}
												maxHeight={320}
												class="max-w-md"
											/>
										</Popover>
									{:else}
										<code class="text-primary/90 font-mono text-[13px]">{prop.value}</code>
									{/if}
								</td>
								<td class="text-neutral/70 px-6 py-3.5 text-[13px] leading-relaxed">
									{#each describe(prop.description) as part, i (i)}
										{#if part.code}
											<code class="text-neutral font-mono text-[12.5px]">{part.value}</code>
										{:else}{part.value}{/if}
									{/each}
								</td>
							</tr>
						{/each}
					</tbody>
				{/each}
			</table>
		</div>
	</div>
{:else}
	<p class="text-neutral/70 text-sm">No documented props for <code>{component}</code>.</p>
{/if}
