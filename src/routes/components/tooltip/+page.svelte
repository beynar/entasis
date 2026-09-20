<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import Button from '$lib/components/Button/Button.svelte';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import { tooltip } from '$lib/components/Tooltip/tooltip.attachment.svelte.js';
	import { colors, sizes, variants } from '$lib/utils/tokens.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const placements = ['top', 'bottom', 'left', 'right'] as const;
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
			value: 'solid',
			options: variants
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		},
		{
			name: 'position',
			type: 'segmented',
			label: 'Position',
			value: 'top',
			options: placements
		}
	]);
</script>

<DocPage
	title="Tooltip"
	subtitle="Contextual information on hover, as a component or an attachment."
	component="Tooltip"
	features={[
		'trigger prop: Button props or a snippet handed the attachment',
		'open forces the tooltip visible',
		'{@attach tooltip()} primitive for any element',
		'Chip-aligned solid, outline, and soft variants',
		'Any-side placement via Floating UI',
		'Single shared surface through theme state'
	]}
>
	<ComponentCard
		{controls}
		description="A tooltip component whose trigger renders a Button."
		code={`<Tooltip
	content="Hover me"
	size="${controls.value.size}"
	variant="${controls.value.variant}"
	color="${controls.value.color}"
	position="${controls.value.position}"
	trigger={{ content: 'Hover me', variant: 'outline', color: 'neutral' }}
/>`}
	>
		<Tooltip
			content="Hover me"
			size={controls.value.size}
			variant={controls.value.variant}
			color={controls.value.color}
			position={controls.value.position}
			trigger={{ content: 'Hover me', variant: 'outline', color: 'neutral' }}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="A snippet trigger receives the attachment and spreads it on its own element."
			code={`{#snippet helpTrigger(attach)}
	<button type="button" class="underline" {@attach attach}>What is this?</button>
{/snippet}

<Tooltip content="Anchored to any element you like" trigger={helpTrigger} />`}
		>
			{#snippet helpTrigger(attach: Attachment<HTMLElement>)}
				<button type="button" class="text-primary underline" {@attach attach}>
					What is this?
				</button>
			{/snippet}
			<Tooltip content="Anchored to any element you like" trigger={helpTrigger} />
		</ComponentCard>

		<ComponentCard
			description="open shows the tooltip without hovering; a hovered tooltip takes the shared surface over."
			code={`<Tooltip
	open
	content="Always visible"
	color="info"
	trigger={{ content: 'Forced open', variant: 'outline' }}
/>`}
		>
			<div class="flex items-center justify-center py-10">
				<Tooltip
					open
					content="Always visible"
					color="info"
					trigger={{ content: 'Forced open', variant: 'outline', color: 'neutral' }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="The same variants and sizes as Chip.">
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each variants as variant, index (index)}
					<Tooltip
						content={variant}
						{variant}
						trigger={{ content: variant, variant: 'outline', color: 'neutral' }}
					/>
				{/each}
				{#each sizes as size, index (index)}
					<Tooltip
						content={size}
						{size}
						color="info"
						variant="soft"
						trigger={{ content: size, variant: 'outline', color: 'neutral' }}
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="The tooltip attachment stays available for elements you already render."
			code={`<script>
	import { tooltip } from 'entasis/tooltip';
</scr${'ipt'}>

<Button variant="outline" {@attach tooltip({ content: 'Top tooltip', position: 'top' })}>
	Top
</Button>`}
		>
			<div class="flex items-center justify-center gap-4">
				<Button
					variant="outline"
					color="neutral"
					{@attach tooltip({ content: 'Top tooltip', position: 'top' })}
				>
					Top
				</Button>
				<Button
					variant="outline"
					color="neutral"
					{@attach tooltip({ content: 'Bottom tooltip', position: 'bottom' })}
				>
					Bottom
				</Button>
				<Button
					variant="outline"
					color="neutral"
					{@attach tooltip({ content: 'Left tooltip', position: 'left' })}
				>
					Left
				</Button>
				<Button
					variant="outline"
					color="neutral"
					{@attach tooltip({ content: 'Right tooltip', position: 'right' })}
				>
					Right
				</Button>
				<Button
					variant="outline"
					color="neutral"
					{@attach tooltip({ content: 'Shows after 1s', delay: 1000 })}
				>
					Long delay
				</Button>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
