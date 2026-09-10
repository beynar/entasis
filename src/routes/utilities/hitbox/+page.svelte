<script lang="ts">
	import Chip from '$lib/components/Chip/Chip.svelte';
	import Hitbox from '$lib/components/Hitbox/Hitbox.svelte';
	import type { HitboxThemeProps } from '$lib/components/Hitbox/hitbox.theme.js';
	import { sizes } from '$lib/utils/tokens.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const visibleHitboxTheme = {
		root: {
			base: 'bg-primary/10 ring-1 ring-primary/30 hover:bg-primary/20'
		}
	} satisfies HitboxThemeProps;

	let activations = $state(0);

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		}
	]);
</script>

<DocPage
	title="Hitbox"
	subtitle="Expand a compact control's pointer target without changing its visible dimensions."
	component="Hitbox"
	features={[
		'Preserves parent semantics',
		'No wrapper element',
		'Size-aware targets',
		'Themeable target surface'
	]}
>
	<ComponentCard
		{controls}
		description="The tinted surface visualizes the transparent target around the dot."
		class="!min-h-fit"
		code={`<button type="button" aria-label="Select item" class="relative size-2 rounded-full bg-primary">
	<Hitbox size="${controls.value.size}" />
</button>`}
	>
		<div class="flex min-h-40 w-full flex-col items-center justify-center gap-6">
			<button
				type="button"
				aria-label="Activate target"
				class="bg-primary relative size-2 cursor-pointer rounded-full"
				onclick={() => activations++}
			>
				<Hitbox size={controls.value.size} theme={visibleHitboxTheme} />
			</button>
			<Chip color="neutral" variant="soft">Activations: {activations}</Chip>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Target dimensions follow the shared size tokens while the visual control stays fixed."
			class="!min-h-fit"
		>
			<div class="flex min-h-40 w-full items-center justify-center gap-8">
				{#each sizes as size}
					<div class="flex flex-col items-center gap-4">
						<button
							type="button"
							aria-label={`Activate ${size} target`}
							class="bg-primary relative size-2 cursor-pointer rounded-full"
							onclick={() => activations++}
						>
							<Hitbox {size} theme={visibleHitboxTheme} />
						</button>
						<span class="text-neutral/60 text-xs capitalize">{size}</span>
					</div>
				{/each}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
