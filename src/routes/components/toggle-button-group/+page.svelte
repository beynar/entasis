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
	const formattingItems = {
		bold: { prefix: textBIcon, ariaLabel: 'Bold' },
		italic: { prefix: textItalicIcon, ariaLabel: 'Italic' },
		underline: { prefix: textUnderlineIcon, ariaLabel: 'Underline' }
	};
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

	let formatting = $state({ bold: true, italic: false, underline: false });
</script>

<DocPage
	title="Toggle group"
	subtitle="A labeled group of independent pressed buttons."
	component="ToggleButtonGroup"
	features={[
		'Value is the single checked-state source',
		'Optional joined button layout',
		'onValueChange emits the checked map',
		'Composes ToggleButton primitives'
	]}
>
	<ComponentCard
		{controls}
		code={`let formatting = $state({ bold: true });

<ToggleButtonGroup
\tbind:value={formatting}
\tariaLabel="Text formatting"
\tsize="${controls.value.size}"
\tvariant="${controls.value.variant}"
\tcolor="${controls.value.color}"
\tdisabled={${controls.value.disabled}}
\titems={{
\t\tbold: { prefix: textBIcon, ariaLabel: 'Bold' },
\t\titalic: { prefix: textItalicIcon, ariaLabel: 'Italic' },
\t\tunderline: { prefix: textUnderlineIcon, ariaLabel: 'Underline' }
\t}}
/>`}
	>
		<div class="flex flex-col items-center gap-3">
			<ToggleButtonGroup
				bind:value={formatting}
				ariaLabel="Text formatting"
				size={controls.value.size}
				variant={controls.value.variant}
				color={controls.value.color}
				disabled={controls.value.disabled}
				items={formattingItems}
			/>
			<code class="text-neutral/60 text-xs">{JSON.stringify(formatting)}</code>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Joined"
			description="Joined is visual only. Ghost stays borderless; outline forms one continuous segmented border."
			class="!min-h-fit"
			code={`<ToggleButtonGroup
\tjoined
\tariaLabel="Text formatting"
\titems={formattingItems}
/>`}
		>
			<div class="flex flex-wrap items-center justify-center gap-6">
				{#each variants as variant (variant)}
					<ToggleButtonGroup
						{variant}
						joined
						ariaLabel={`${variant} text formatting`}
						color="neutral"
						items={formattingItems}
						value={{ bold: true }}
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
						ariaLabel={`${color} options`}
						items={{ one: { children: 'One' }, two: { children: 'Two' } }}
						value={{ one: true }}
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
						ariaLabel={`${size} text formatting`}
						color="neutral"
						items={{
							bold: { prefix: textBIcon, children: 'Bold' },
							italic: { prefix: textItalicIcon, children: 'Italic' }
						}}
						value={{ bold: true }}
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
				ariaLabel="Disabled text formatting"
				disabled
				items={formattingItems}
				value={{ bold: true }}
			/>
		</ComponentCard>
	{/snippet}
</DocPage>
