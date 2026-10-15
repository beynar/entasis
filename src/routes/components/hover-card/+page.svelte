<script lang="ts">
	import Avatar from '$lib/components/Avatar/Avatar.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import HoverCard from '$lib/components/HoverCard/HoverCard.svelte';
	import { densities, sizes } from '$lib/utils/tokens.js';
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
			options: densities
		},
		{ name: 'arrow', type: 'switch', label: 'Arrow', value: false }
	]);
	const stats = [
		{ label: 'Components', value: '70+' },
		{ label: 'Tokens', value: '8' },
		{ label: 'Runtime', value: 'Svelte 5' }
	];
</script>

{#snippet profileContent()}
	<div class="flex items-start gap-3">
		<Avatar name="Entasis" />
		<div class="grid gap-1">
			<p class="text-sm font-semibold">@entasis</p>
			<p class="text-neutral/70 text-sm">
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
		'Styling hooks: the card carries data-open, data-closed and data-side; the trigger data-popup-open (hoverCardDataAttributes)',
		{ label: 'Opens on hover and keyboard focus', test: 'a11y:hover-card.focus-opens' },
		'Configurable open and close delays',
		'Neighbouring cards, tooltips and hover popovers open without waiting',
		'Pointing at the trigger again while the card is closing reopens it at once',
		'A card opened from inside a card keeps its parent open while the pointer is on either',
		'Wrapping trigger for a link inside a paragraph, anchored to the line the pointer entered',
		'Optional arrow toward the trigger',
		'Opens from a mouse or pen hover, never from a touch tap’s pointer events',
		'Positioned by Popover with flip-aware transitions',
		'Card-powered title, description, content and footer',
		'String, snippet, or ButtonProps trigger'
	]}
>
	<ComponentCard
		{controls}
		description="A compact preview shown from a trigger on hover or focus."
		code={`<HoverCard
	trigger={{ content: '@entasis', variant: 'link' }}
	size="${controls.value.size}"
	density="${controls.value.density}"${controls.value.arrow ? '\n\tarrow' : ''}
	title="@entasis"
	description="Configuration-first Svelte components."
>
	<p>Theme-aware primitives for building application interfaces.</p>
</HoverCard>`}
	>
		<HoverCard
			trigger={{ content: '@entasis', variant: 'link' }}
			size={controls.value.size}
			density={controls.value.density}
			arrow={controls.value.arrow as boolean}
			title="@entasis"
			description="Configuration-first Svelte components."
		>
			<p class="text-neutral/70 text-sm">
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
	<div class="flex items-start gap-3">
		<Avatar name="Entasis" />
		<div>
			<p>@entasis</p>
			<p>Configuration-first Svelte components.</p>
		</div>
	</div>
</HoverCard>`}
		>
			<HoverCard trigger={{ content: 'Preview profile', variant: 'outline' }}>
				{@render profileContent()}
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
							<div class="text-neutral/70 text-xs">{stat.label}</div>
						</div>
					{/each}
				</div>
				{#snippet footer()}
					<span class="text-neutral/70 text-xs">Updated just now</span>
				{/snippet}
			</HoverCard>
		</ComponentCard>

		<ComponentCard
			title="Cards inside cards"
			description="A card opened from inside another card (a link in its text) keeps the outer card open while the pointer is on either of them. When the last inner card closes with the pointer outside every card, the outer one closes too."
			class="!min-h-fit"
			code={`<HoverCard trigger={{ content: 'Entasis', variant: 'link' }} title="Entasis">
	<p>
		Built on
		<HoverCard trigger={{ content: 'Svelte', variant: 'link' }} title="Svelte">
			<p>Cybernetically enhanced web apps.</p>
		</HoverCard>
	</p>
</HoverCard>`}
		>
			<HoverCard trigger={{ content: 'Entasis', variant: 'link' }} title="Entasis">
				<p class="text-neutral/70 text-sm">
					Built on
					<HoverCard
						trigger={{ content: 'Svelte', variant: 'link' }}
						title="Svelte"
						position="right"
					>
						<p class="text-neutral/70 text-sm">Cybernetically enhanced web apps.</p>
					</HoverCard>
					and Tailwind.
				</p>
			</HoverCard>
		</ComponentCard>

		<ComponentCard
			title="Wrapping trigger and arrow"
			description="wrap lets the trigger flow like text, so a link in a paragraph breaks across lines; the card anchors to the line the pointer entered. arrow points the card at its trigger."
			class="!min-h-fit"
			code={`<p class="w-56">
	Read the
	<HoverCard wrap arrow>
		{#snippet trigger()}
			<span class="underline">full release notes for this version</span>
		{/snippet}
		<p>Anchored to the line you pointed at.</p>
	</HoverCard>
	before upgrading.
</p>`}
		>
			<p class="w-56 text-sm leading-6">
				Read the
				<HoverCard wrap arrow offset={10}>
					{#snippet trigger()}
						<span class="text-primary cursor-pointer underline"
							>full release notes for this version</span
						>
					{/snippet}
					<p class="text-neutral/70 text-sm">Anchored to the line you pointed at.</p>
				</HoverCard>
				before upgrading.
			</p>
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
				<p class="text-neutral/70 text-sm">The trigger snippet receives the hover card state.</p>
			</HoverCard>
		</ComponentCard>
	{/snippet}
</DocPage>
