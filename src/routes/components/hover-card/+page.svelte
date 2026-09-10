<script lang="ts">
	import Avatar from '$lib/components/Avatar/Avatar.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import HoverCard from '$lib/components/HoverCard/HoverCard.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const sideExamples = ['top', 'right', 'bottom', 'left'] as const;
	const sizeExamples = ['small', 'normal', 'large'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: sizes
		}
	]);
	const stats = [
		{ label: 'Components', value: '70+' },
		{ label: 'Tokens', value: '8' },
		{ label: 'Runtime', value: 'Svelte 5' }
	];
</script>

{#snippet profileContent()}
	<div class="flex items-start gap-3">
		<Avatar user={{ name: 'Svelai' }} />
		<div class="grid gap-1">
			<p class="text-sm font-semibold">@svelai</p>
			<p class="text-neutral/60 text-sm">
				Configuration-first Svelte components with theme-aware primitives.
			</p>
		</div>
	</div>
{/snippet}

<DocPage
	title="Hover Card"
	subtitle="A hover and focus preview composed from Popover positioning and Card content."
	component="HoverCard"
	features={[
		'Opens on hover and keyboard focus',
		'Configurable open and close delays',
		'Positioned by Popover with flip-aware transitions',
		'Card-powered title, description, content and footer',
		'String, snippet, or ButtonProps trigger'
	]}
>
	<ComponentCard
		{controls}
		description="A compact preview shown from a trigger on hover or focus."
		code={`<HoverCard
	trigger={{ content: '@svelai', variant: 'link' }}
	size="${controls.value.size}"
	density="${controls.value.density}"
	title="@svelai"
	description="Configuration-first Svelte components."
>
	<p>Theme-aware primitives for building application interfaces.</p>
</HoverCard>`}
	>
		<HoverCard
			trigger={{ content: '@svelai', variant: 'link' }}
			size={controls.value.size}
			density={controls.value.density}
			title="@svelai"
			description="Configuration-first Svelte components."
		>
			<p class="text-neutral/60 text-sm">
				Theme-aware primitives for building application interfaces.
			</p>
		</HoverCard>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Profile Preview"
			description="Use snippet content for richer previews while the card still owns the surface."
			class="!min-h-fit"
			code={`<HoverCard trigger={{ content: 'Preview profile', variant: 'outline' }}>
	{#snippet content()}
		<div class="flex items-start gap-3">
			<Avatar user={{ name: 'Svelai' }} />
			<div>
				<p>@svelai</p>
				<p>Configuration-first Svelte components.</p>
			</div>
		</div>
	{/snippet}
</HoverCard>`}
		>
			<HoverCard trigger={{ content: 'Preview profile', variant: 'outline' }}>
				{#snippet content()}
					{@render profileContent()}
				{/snippet}
			</HoverCard>
		</ComponentCard>

		<ComponentCard
			title="Placement"
			description="Use position to choose the preferred side. Popover handles flipping when space is tight."
			class="!min-h-fit"
			code={`{#each ['top', 'right', 'bottom', 'left'] as position}
	<HoverCard {position} trigger={{ content: position, variant: 'soft' }}>
		<p>This card prefers the {position} side.</p>
	</HoverCard>
{/each}`}
		>
			<div class="flex flex-wrap justify-center gap-3">
				{#each sideExamples as position (position)}
					<HoverCard
						{position}
						trigger={{ content: position, variant: 'soft' }}
						title={`${position[0].toUpperCase()}${position.slice(1)} side`}
						description={`This card prefers the ${position} side.`}
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Card Size"
			description="Use size to change the inner Card width and spacing."
			class="!min-h-fit"
			code={`{#each ['small', 'normal', 'large'] as size}
	<HoverCard {size} trigger={{ content: size, variant: 'outline' }}>
		<p>The card uses the {size} size token.</p>
	</HoverCard>
{/each}`}
		>
			<div class="flex flex-wrap justify-center gap-3">
				{#each sizeExamples as size (size)}
					<HoverCard
						{size}
						trigger={{ content: size, variant: 'outline' }}
						title={`${size[0].toUpperCase()}${size.slice(1)} card`}
						description={`The card uses the ${size} size token.`}
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Delays"
			description="Tune both the open delay and the close grace period for dense interfaces."
			class="!min-h-fit"
			code={`<HoverCard
	delay={500}
	closeDelay={300}
	trigger={{ content: 'Patient hover', color: 'secondary' }}
>
	<p>Opens after 500ms and waits 300ms before closing.</p>
</HoverCard>`}
		>
			<HoverCard
				delay={500}
				closeDelay={300}
				trigger={{ content: 'Patient hover', color: 'secondary' }}
				title="Delayed preview"
				description="Opens after 500ms and waits 300ms before closing."
			/>
		</ComponentCard>

		<ComponentCard
			title="Structured Card"
			description="Title, description, content, and footer are passed into the inner Card."
			class="!min-h-fit"
			code={`<HoverCard
	trigger={{ content: 'Show stats', variant: 'outline' }}
	title="Project stats"
	description="A small summary shown before navigating."
	showBorders
>
	<div class="grid grid-cols-3 gap-2">...</div>
	{#snippet footer()}
		<span>Updated now</span>
	{/snippet}
</HoverCard>`}
		>
			<HoverCard
				trigger={{ content: 'Show stats', variant: 'outline' }}
				title="Project stats"
				description="A small summary shown before navigating."
				showBorders
				class="w-96"
			>
				<div class="grid grid-cols-3 gap-2">
					{#each stats as stat (stat.label)}
						<div class="bg-neutral-muted rounded-md p-2 text-center">
							<div class="text-neutral text-sm font-semibold">{stat.value}</div>
							<div class="text-neutral/60 text-xs">{stat.label}</div>
						</div>
					{/each}
				</div>
				{#snippet footer()}
					<span class="text-neutral/60 text-xs">Updated just now</span>
				{/snippet}
			</HoverCard>
		</ComponentCard>

		<ComponentCard
			title="Custom Trigger"
			description="Pass a trigger snippet when the trigger needs local markup or state-aware styling."
			class="!min-h-fit"
			code={`<HoverCard position="right">
	{#snippet trigger(hoverCard)}
		<Button variant={hoverCard.isOpen ? 'solid' : 'outline'}>
			Preview
		</Button>
	{/snippet}

	<p>Custom trigger content.</p>
</HoverCard>`}
		>
			<HoverCard position="right" title="Custom trigger">
				{#snippet trigger(hoverCard)}
					<Button variant={hoverCard.isOpen ? 'solid' : 'outline'}>Preview</Button>
				{/snippet}
				<p class="text-neutral/60 text-sm">
					The trigger snippet receives the hover card state.
				</p>
			</HoverCard>
		</ComponentCard>
	{/snippet}
</DocPage>
