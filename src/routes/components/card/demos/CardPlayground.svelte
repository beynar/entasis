<script lang="ts">
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import { Switch } from '$lib/components/Form/Switch/index.js';
	import Button from '$lib/components/Button/Button.svelte';
	import { Card } from '$lib/components/Card/index.js';
	import type { CardDensity, CardVariant } from '$lib/components/Card/card.props.js';
	import type { Colors, Sizes } from '$lib/types/theme.js';

	const variantItems = [
		{ value: 'solid', label: 'Solid' },
		{ value: 'outline', label: 'Outline' },
		{ value: 'soft', label: 'Soft' },
		{ value: 'ghost', label: 'Ghost' }
	] as const satisfies ReadonlyArray<{ value: CardVariant; label: string }>;

	const colorItems = [
		{ value: 'neutral', label: 'Background' },
		{ value: 'primary', label: 'Primary' },
		{ value: 'success', label: 'Success' },
		{ value: 'danger', label: 'Danger' }
	] as const satisfies ReadonlyArray<{ value: Colors; label: string }>;

	const sizeItems = [
		{ value: 'small', label: 'Small' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Large' }
	] as const satisfies ReadonlyArray<{ value: Sizes; label: string }>;

	const densityItems = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
	] as const satisfies ReadonlyArray<{ value: CardDensity; label: string }>;

	type PlaygroundColor = (typeof colorItems)[number]['value'];

	let variant = $state<CardVariant>('solid');
	let color = $state<PlaygroundColor>('neutral');
	let size = $state<Sizes>('normal');
	let density = $state<CardDensity>('normal');
	let showBorders = $state(false);
	let disabled = $state(false);
	let clickable = $state(false);
</script>

<div class="grid w-full gap-6">
	<section
		aria-label="Card controls"
		class="border-neutral-muted bg-surface grid gap-5 rounded-lg border p-4"
	>
		<div class="grid gap-5 sm:grid-cols-2">
			<div class="grid gap-2">
				<span class="text-neutral text-sm font-medium">Variant</span>
				<SegmentedControl items={variantItems} bind:value={variant} size="small" label="Variant" />
			</div>
			<div class="grid gap-2">
				<span class="text-neutral text-sm font-medium">Color</span>
				<SegmentedControl items={colorItems} bind:value={color} size="small" label="Color" />
			</div>
			<div class="grid gap-2">
				<span class="text-neutral text-sm font-medium">Size</span>
				<SegmentedControl
					items={sizeItems}
					bind:value={size}
					size="small"
					label="Typography size"
				/>
			</div>
			<div class="grid gap-2">
				<span class="text-neutral text-sm font-medium">Density</span>
				<SegmentedControl
					items={densityItems}
					bind:value={density}
					size="small"
					label="Spacing density"
				/>
			</div>
		</div>
		<div class="flex flex-wrap gap-6">
			<Switch size="small" label="Section borders" bind:value={showBorders} />
			<Switch size="small" label="Disabled" bind:value={disabled} />
			<Switch size="small" label="Clickable" bind:value={clickable} />
		</div>
	</section>

	<div class="flex justify-center">
		<Card
			class="w-full max-w-sm"
			{variant}
			{color}
			{size}
			{density}
			{showBorders}
			{disabled}
			onclick={clickable ? () => console.log('Card clicked') : null}
		>
			{#snippet title()}
				Team workspace
			{/snippet}
			{#snippet description()}
				Shared settings for everyone in the Design team.
			{/snippet}
			{#snippet action()}
				<Button variant="ghost" size="small">Edit</Button>
			{/snippet}
			<p>12 members · 4 pending invitations. Changes apply to new members immediately.</p>
			{#snippet footer()}
				<Button size="small">Invite people</Button>
				<Button size="small" variant="outline">Manage roles</Button>
			{/snippet}
		</Card>
	</div>
</div>
