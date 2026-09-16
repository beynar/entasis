<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { Card, type CardElevation } from '$lib/components/Card/index.js';
	import Button from '$lib/components/Button/Button.svelte';
	import { colors, densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import { Form } from '$lib/components/Form/Form/index.js';
	import CardPlayground from './demos/CardPlayground.svelte';

	const cardVariants = ['solid', 'outline', 'soft', 'ghost'] as const;
	const cardElevations = ['1', '2', '3', '4', '5'] as const;
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
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'solid',
			options: cardVariants
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		},
		{
			name: 'elevation',
			type: 'segmented',
			label: 'Elevation',
			value: '1',
			options: cardElevations
		}
	]);
	const elevation = $derived(Number(controls.value.elevation) as CardElevation);
</script>

<DocPage
	title="Card"
	subtitle="A flexible surface for grouping related content and actions."
	component="Card"
	features={[
		'Bindable ref to root element',
		'Header, content and footer slots',
		'Renders link or button when interactive',
		'Action slot or ButtonProps shortcut',
		'Variants, colors, size and density tokens'
	]}
>
	<ComponentCard
		{controls}
		code={`<Card size="${controls.value.size}" density="${controls.value.density}" variant="${controls.value.variant}" color="${controls.value.color}" elevation={${elevation}}>
	{#snippet title()}
		Card Title
	{/snippet}
	{#snippet description()}
		This is a description of the card content.
	{/snippet}
	{#snippet children()}
		<p>Card content goes here.</p>
	{/snippet}
</Card>`}
	>
		<Card
			class="w-full max-w-sm"
			size={controls.value.size}
			density={controls.value.density}
			variant={controls.value.variant}
			color={controls.value.color}
			{elevation}
		>
			{#snippet title()}
				Card Title
			{/snippet}
			{#snippet description()}
				This is a description of the card content.
			{/snippet}
			<p>Card content goes here.</p>
		</Card>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Playground"
			description="Every rendering prop, live — variant, color, size, density, section borders and disabled."
		>
			<CardPlayground />
		</ComponentCard>

		<ComponentCard
			title="Login card"
			description="Header with an action, a Form as content, and stacked footer buttons."
		>
			<Card
				class="w-full max-w-sm"
				title="Login to your account"
				description="Enter your email below to login to your account"
			>
				{#snippet action()}
					<Button size="small" variant="link">Sign Up</Button>
				{/snippet}

				<Form
					inputs={{
						email: {
							type: 'email',
							label: 'Email',
							required: true
						},
						password: {
							type: 'password',
							label: 'Password',
							required: true
						}
					}}
					onSubmit={() => {
						console.log('submit');
					}}
				></Form>

				{#snippet footer()}
					<Button fullWidth>Login</Button>
					<Button variant="outline" fullWidth>Login with Google</Button>
				{/snippet}
			</Card>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="size scales the typography only — title, description, and body text."
			code={`<Card size="small" ... />
<Card size="normal" ... />
<Card size="large" ... />`}
		>
			<div class="grid w-full gap-6 lg:grid-cols-3">
				{#each ['small', 'normal', 'large'] as const as s (s)}
					<Card size={s}>
						{#snippet title()}
							Settings ({s})
						{/snippet}
						{#snippet description()}
							Manage your preferences
						{/snippet}
						<p>Same paddings, scaled type.</p>
					</Card>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Density"
			description="density scales the paddings and gaps — compact for dense dashboards, comfortable for roomy detail surfaces. Combine freely with size."
			code={`<Card density="compact" ... />
<Card density="normal" ... />
<Card density="comfortable" ... />`}
		>
			<div class="grid w-full gap-6 lg:grid-cols-3">
				{#each ['compact', 'normal', 'comfortable'] as const as d (d)}
					<Card density={d}>
						{#snippet title()}
							Settings ({d})
						{/snippet}
						{#snippet description()}
							Manage your preferences
						{/snippet}
						<p>Same type, scaled spacing.</p>
					</Card>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Variants"
			description="solid is the elevated default; outline and soft are quieter; ghost blends into the page."
		>
			<div class="grid w-full gap-6 sm:grid-cols-2">
				{#each cardVariants as variant (variant)}
					<Card {variant} color="primary">
						{#snippet title()}
							{variant}
						{/snippet}
						{#snippet description()}
							A primary {variant} card.
						{/snippet}
					</Card>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Colors"
			description="The color prop drives the surface (solid), ring (outline) or tint (soft)."
		>
			<div class="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each colors as color (color)}
					<Card {color} density="compact">
						{#snippet title()}
							{color}
						{/snippet}
						<p>Solid {color} surface.</p>
					</Card>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Header action"
			description="Pass ButtonProps for the shortcut, or a snippet for full control — rendered top-right of the header."
			code={`<Card action={{ variant: 'ghost', size: 'small', children: 'Edit' }} ... />`}
		>
			<Card
				class="w-full max-w-sm"
				action={{
					variant: 'ghost',
					size: 'small',
					children: 'Edit'
				}}
			>
				{#snippet title()}
					Notifications
				{/snippet}
				{#snippet description()}
					Choose how you want to be notified
				{/snippet}
				<p>Email and push notifications are enabled.</p>
			</Card>
		</ComponentCard>

		<ComponentCard
			title="Sections and footer"
			description="showBorders draws muted separators between header, content and footer."
		>
			<Card class="w-full max-w-sm" showBorders>
				{#snippet title()}
					Billing
				{/snippet}
				{#snippet description()}
					Your plan renews on August 1st
				{/snippet}
				<p>Pro plan · $29/month · 3 seats</p>
				{#snippet footer()}
					<div class="flex w-full items-center justify-between">
						<span class="text-neutral/70 text-sm">Next invoice: $87</span>
						<Button size="small">Manage plan</Button>
					</div>
				{/snippet}
			</Card>
		</ComponentCard>

		<ComponentCard
			title="Interactive"
			description="With href the card renders as a link; with onclick it becomes a button."
		>
			<div class="grid w-full gap-6 sm:grid-cols-2">
				<Card href="/" target="_blank" rel="noopener">
					{#snippet title()}
						Release notes
					{/snippet}
					{#snippet description()}
						Everything new in version 0.2
					{/snippet}
					<p>Opens in a new tab.</p>
				</Card>
				<Card onclick={() => console.log('Card clicked')}>
					{#snippet title()}
						Quick action
					{/snippet}
					{#snippet description()}
						The whole surface is clickable
					{/snippet}
					<p>Logs a message on click.</p>
				</Card>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
