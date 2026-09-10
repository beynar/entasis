<script lang="ts">
	import { Stack } from '$lib/components/Stack/index.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const stackOrientations = ['vertical', 'horizontal'] as const;
	const stackAligns = ['start', 'center', 'end', 'stretch'] as const;
	const layoutGaps = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
	const controls = createComponentControls([
		{
			name: 'orientation',
			type: 'segmented',
			label: 'Orientation',
			value: 'vertical',
			options: stackOrientations
		},
		{
			name: 'gap',
			type: 'segmented',
			label: 'Gap',
			value: 'xl',
			options: layoutGaps
		},
		{
			name: 'align',
			type: 'segmented',
			label: 'Align',
			value: 'stretch',
			options: stackAligns
		}
	]);
</script>

<DocPage
	title="Stack"
	subtitle="Arranges content on one flex axis with semantic, runtime-scaled spacing."
	component="Stack"
	features={[
		'Horizontal or vertical orientation',
		'Semantic gap and padding',
		'Alignment, distribution, and wrapping',
		'Semantic root element',
		'Explicit scroll and size constraints'
	]}
>
	<ComponentCard
		{controls}
		description="A vertical content stack containing a wrapping horizontal action row."
		code={`<Stack orientation="${controls.value.orientation}" gap="${controls.value.gap}" align="${controls.value.align}" padding="xl">
	<h2>Account</h2>
	<Stack orientation="horizontal" align="center" gap="md" wrap="wrap">
		<button>Profile</button>
		<button>Security</button>
	</Stack>
</Stack>`}
	>
		<Stack
			orientation={controls.value.orientation}
			gap={controls.value.gap}
			align={controls.value.align}
			padding="xl"
			class="border-neutral-muted bg-surface-canvas rounded-lg border"
		>
			<Stack gap="xs">
				<h2 class="text-neutral text-xl font-semibold">Account</h2>
				<p class="text-neutral/65 text-sm">Manage the profile and security surfaces.</p>
			</Stack>
			<Stack orientation="horizontal" align="center" gap="md" wrap="wrap">
				<span class="bg-primary-muted text-primary-readable rounded-sm px-lg py-sm text-sm">
					Profile
				</span>
				<span class="bg-surface-raised text-neutral rounded-sm px-lg py-sm text-sm">
					Security
				</span>
			</Stack>
		</Stack>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Distributed row"
			description="Horizontal stacks can distribute content across the main axis."
			code={`<Stack orientation="horizontal" align="center" justify="between" gap="md">
	<span>Workspace</span>
	<span>Active</span>
</Stack>`}
		>
			<Stack
				orientation="horizontal"
				align="center"
				justify="between"
				gap="md"
				class="border-neutral-muted rounded-lg border p-xl"
			>
				<span class="text-neutral font-medium">Workspace</span>
				<span class="text-success-readable text-sm">Active</span>
			</Stack>
		</ComponentCard>
	{/snippet}
</DocPage>
