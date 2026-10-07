<script lang="ts">
	import { page } from '$app/state';
	import { useRuntimeThemePlayground } from '../../runtimeThemePlayground.svelte.js';
	import { findDirection } from '../../blocks/generative/engine/directions.js';
	import { validateSpec } from '../../blocks/generative/engine/composition.js';
	import { decodeSpec } from '../../blocks/generative/engine/spec.js';
	import { lookupSection } from '../../blocks/generative/registry.js';
	import { setSectionScope } from '../../blocks/generative/sections/sectionScope.js';
	import KitScope from '../../blocks/generative/sections/KitScope.svelte';
	import SectionView from '../../blocks/generative/ui/SectionView.svelte';

	const playground = useRuntimeThemePlayground();
	setSectionScope({ inverseStyle: () => playground.colorStyle || undefined });

	const spec = $derived(decodeSpec(page.url.searchParams.get('spec')));
	const direction = $derived(findDirection(spec?.direction));
	const report = $derived(spec ? validateSpec(spec, direction, lookupSection) : null);
</script>

<svelte:head>
	<title>Generated page preview · entasis</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if !spec}
	<main class="bg-surface text-neutral p-xl grid min-h-screen place-items-center">
		<p class="text-neutral/70 text-sm">This link does not carry a readable page spec.</p>
	</main>
{:else}
	<main class="bg-surface text-neutral min-h-screen" data-generated-page>
		{#if report && report.issues.length}
			<div role="alert" class="bg-danger-muted text-danger-muted-readable p-md text-xs">
				{#each report.issues as issue (issue.slotId)}
					<p>
						{issue.index < 0 ? 'Component kit' : `Section ${issue.index + 1}`}: {issue.errors.join(
							' '
						)}
					</p>
				{/each}
			</div>
		{/if}
		<KitScope params={spec.kit?.params}>
			{#each spec.sections as slot (slot.id)}
				{@const type = lookupSection(slot.type)}
				{#if type && !report?.issues.some((issue) => issue.slotId === slot.id)}
					<SectionView {type} params={slot.params} />
				{/if}
			{/each}
		</KitScope>
	</main>
{/if}
