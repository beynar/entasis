<script lang="ts">
	import Kbd from '$lib/components/Kbd/Kbd.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { colors, sizes } from '$lib/utils/tokens.js';
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: ['neutral', 'primary', 'success', 'danger']
		}
	]);
</script>

<DocPage
	title="Kbd"
	subtitle="Keyboard keys and shortcuts rendered as semantic kbd elements."
	component="Kbd"
	features={[
		'Semantic kbd elements',
		'keys array with separators',
		'Snippet keys for icon support',
		'size & color design tokens'
	]}
>
	<ComponentCard
		{controls}
		description="A command-palette shortcut rendered as keycaps."
		code={`<Kbd keys={['⌘', 'K']} size="${controls.value.size}" color="${controls.value.color}" />`}
	>
		<Kbd keys={['⌘', 'K']} size={controls.value.size} color={controls.value.color} />
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Single keys, combos, sizes, colors, inline usage, and button suffixes."
			class="grid !min-h-fit gap-8"
		>
			<!-- Single keys -->
			<div class="flex items-center justify-center gap-2">
				<Kbd>Esc</Kbd>
				<Kbd>Tab</Kbd>
				<Kbd>⇧</Kbd>
				<Kbd>Enter</Kbd>
				<Kbd>
					{@render commandIcon({})}
				</Kbd>
			</div>

			<!-- Combos with and without separator -->
			<div class="flex items-center justify-center gap-6">
				<Kbd keys={['⌘', 'K']} />
				<Kbd keys={['Ctrl', 'Shift', 'P']} separator="+" />
				{#snippet cmdKey()}
					{@render commandIcon({})}
				{/snippet}
				<Kbd keys={[cmdKey, 'K']} separator="+" />
			</div>

			<!-- Sizes -->
			<div class="flex items-center justify-center gap-6">
				{#each sizes as size, index (index)}
					<Kbd {size} keys={['⌘', 'K']} separator="+" />
				{/each}
			</div>

			<!-- Colors -->
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each colors as color, index (index)}
					<Kbd {color} keys={['⌘', 'K']} />
				{/each}
			</div>

			<!-- Inline in a sentence -->
			<p class="text-neutral flex items-center justify-center gap-1 text-sm">
				Press <Kbd keys={['⌘', 'K']} /> to open the command palette, or <Kbd>Esc</Kbd> to close it.
			</p>

			<!-- Inside a Button suffix -->
			<div class="flex items-center justify-center">
				<!-- Button's suffix slot is icon-sized (max-w-4) by default — widen it for a key combo. -->
				<Button
					variant="outline"
					color="neutral"
					theme={{ suffix: { base: 'max-w-none max-h-none' } }}
				>
					Search
					{#snippet suffix()}
						<Kbd keys={['⌘', 'K']} />
					{/snippet}
				</Button>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
