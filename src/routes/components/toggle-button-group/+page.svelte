<script lang="ts">
	import ToggleButtonGroup from '$lib/components/ToggleButtonGroup/ToggleButtonGroup.svelte';
	import { textBIcon } from '$lib/components/Icons/textB.js';
	import { textItalicIcon } from '$lib/components/Icons/textItalic.js';
	import { textUnderlineIcon } from '$lib/components/Icons/textUnderline.js';
	import { colors, sizes } from '$lib/utils/tokens.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const variants = ['ghost', 'outline'] as const;
	const formattingItems = [
		{ value: 'bold', prefix: textBIcon, label: 'Bold' },
		{ value: 'italic', prefix: textItalicIcon, label: 'Italic' },
		{ value: 'underline', prefix: textUnderlineIcon, label: 'Underline' }
	];
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'ghost',
			options: variants
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);

	let formatting = $state(['bold']);
</script>

<DocPage
	title="Toggle group"
	subtitle="A labeled group of independent pressed buttons."
	component="ToggleButtonGroup"
	features={[
		'Value is the single pressed-state source',
		'Optional joined button layout',
		'onValueChange emits the pressed values',
		'Composes ToggleButton primitives'
	]}
>
	<ComponentCard
		{controls}
		code={`let formatting = $state(['bold']);

<ToggleButtonGroup
\tbind:value={formatting}
\tlabel="Text formatting"
\tsize="${controls.value.size}"
\tvariant="${controls.value.variant}"
\tcolor="${controls.value.color}"
\tdisabled={${controls.value.disabled}}
\titems={[
\t\t{ value: 'bold', prefix: textBIcon, label: 'Bold' },
\t\t{ value: 'italic', prefix: textItalicIcon, label: 'Italic' },
\t\t{ value: 'underline', prefix: textUnderlineIcon, label: 'Underline' }
\t]}
/>`}
	>
		<div class="flex flex-col items-center gap-3">
			<ToggleButtonGroup
				bind:value={formatting}
				label="Text formatting"
				size={controls.value.size}
				variant={controls.value.variant}
				color={controls.value.color}
				disabled={controls.value.disabled}
				items={formattingItems}
			/>
			<code class="text-neutral/70 text-xs">{JSON.stringify(formatting)}</code>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Joined"
			description="Joined is visual only. Ghost stays borderless; outline forms one continuous segmented border."
			class="!min-h-fit"
			code={`<ToggleButtonGroup
\tjoined
\tlabel="Text formatting"
\titems={formattingItems}
/>`}
		>
			<div class="flex flex-wrap items-center justify-center gap-6">
				{#each variants as variant (variant)}
					<ToggleButtonGroup
						{variant}
						joined
						label={`${variant} text formatting`}
						color="neutral"
						items={formattingItems}
						value={['bold']}
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Colors"
			description="Pressed state remains visible across every semantic color."
		>
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each colors as color (color)}
					<ToggleButtonGroup
						{color}
						label={`${color} options`}
						items={[
							{ value: 'one', children: 'One' },
							{ value: 'two', children: 'Two' }
						]}
						value={['one']}
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Icons and labels scale with the same size tokens as Button."
		>
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each sizes as size (size)}
					<ToggleButtonGroup
						{size}
						label={`${size} text formatting`}
						color="neutral"
						items={[
							{ value: 'bold', prefix: textBIcon, children: 'Bold' },
							{ value: 'italic', prefix: textItalicIcon, children: 'Italic' }
						]}
						value={['bold']}
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Selection Semantics"
			description="ToggleButtonGroup represents independent pressed states. Use SegmentedControl for mutually exclusive choices such as text alignment."
			class="!min-h-fit"
		>
			<ToggleButtonGroup
				label="Disabled text formatting"
				disabled
				items={formattingItems}
				value={['bold']}
			/>
		</ComponentCard>
	{/snippet}
</DocPage>
