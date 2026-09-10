<script lang="ts">
	import Alert from '$lib/components/Alert/Alert.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { infoIcon } from '$lib/components/Icons/info.js';

	const statusColors = ['success', 'info', 'warning', 'danger'] as const;
	const variants = ['solid', 'outline', 'soft'] as const;
	const sizes = ['small', 'normal', 'large'] as const;
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
			value: 'soft',
			options: variants
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'success',
			options: ['primary', 'success', 'info', 'warning', 'danger']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);

	let dismissed = $state(false);
</script>

<DocPage
	title="Alert"
	subtitle="Contextual banners that communicate status, warnings, or important messages. The `soft` variant is the tinted 'toast' look — a muted surface, colored border and filled status icon, readable in light and dark."
	component="Alert"
	features={[
		'soft variant: tinted surface + filled status icon',
		'solid / outline / soft variants',
		'Eight colors, three sizes',
		'Optional dismiss button',
		'prefix, title, description & children slots'
	]}
>
	<ComponentCard
		{controls}
		description="The soft variant gives the tinted status look. A matching filled icon is added automatically."
		code={`<Alert
	size="${controls.value.size}"
	variant="${controls.value.variant}"
	color="${controls.value.color}"
	disabled={${controls.value.disabled}}
	title="Payment received"
	description="Your invoice has been paid in full."
/>`}
	>
		<div class="w-full max-w-md">
			<Alert
				size={controls.value.size}
				variant={controls.value.variant}
				color={controls.value.color}
				disabled={controls.value.disabled}
				title="Payment received"
				description="Your invoice has been paid in full."
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Status colors"
			description="With the soft variant the status colors each ship a matching filled icon and a legible on-tint accent — readable in both light and dark."
			class="!min-h-fit !items-stretch !justify-start"
			code={`<Alert variant="soft" color="success" title="Saved" description="Your changes are live." />
<Alert variant="soft" color="info" title="Heads up" description="A new version is available." />
<Alert variant="soft" color="warning" title="Careful" description="This needs a review first." />
<Alert variant="soft" color="danger" title="Failed" description="Something went wrong. Try again." />`}
		>
			<div class="grid w-full max-w-md gap-3">
				{#each statusColors as color (color)}
					<Alert
						{color}
						variant="soft"
						title={color[0].toUpperCase() + color.slice(1)}
						description="The quick brown fox jumps over the lazy dog."
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Variants"
			description="solid / outline / soft. soft is the tinted status look; solid and outline are the classic flat styles."
			class="!min-h-fit !items-stretch !justify-start"
			code={`<Alert variant="solid" color="primary" title="Solid" />
<Alert variant="outline" color="primary" title="Outline" />
<Alert variant="soft" color="primary" title="Soft" />`}
		>
			<div class="grid w-full max-w-md gap-3">
				{#each variants as variant (variant)}
					<Alert
						{variant}
						color="primary"
						prefix={infoIcon}
						title={variant[0].toUpperCase() + variant.slice(1)}
						description="A {variant} variant alert."
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Three sizes scale padding, type and icon."
			class="!min-h-fit !items-stretch !justify-start"
			code={`<Alert size="small" variant="soft" color="info" title="Small" />
<Alert size="normal" variant="soft" color="info" title="Normal" />
<Alert size="large" variant="soft" color="info" title="Large" />`}
		>
			<div class="grid w-full max-w-md gap-3">
				{#each sizes as size (size)}
					<Alert
						{size}
						variant="soft"
						color="info"
						title={size[0].toUpperCase() + size.slice(1)}
						description="The quick brown fox."
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Dismissible"
			description="Pass dismissible with an onDismiss handler to render a close button. The caller owns visibility."
			class="!min-h-fit !items-stretch !justify-start"
			code={`<script>
	let dismissed = $state(false);
<\/script>

{#if !dismissed}
	<Alert
		variant="soft"
		color="warning"
		dismissible
		onDismiss={() => (dismissed = true)}
		title="Storage almost full"
		description="You've used 90% of your quota."
	/>
{/if}`}
		>
			<div class="grid w-full max-w-md gap-3">
				{#if !dismissed}
					<Alert
						variant="soft"
						color="warning"
						dismissible
						onDismiss={() => (dismissed = true)}
						title="Storage almost full"
						description="You've used 90% of your quota."
					/>
				{:else}
					<Button variant="soft" color="neutral" size="small" onclick={() => (dismissed = false)}>
						Reset alert
					</Button>
				{/if}
			</div>
		</ComponentCard>

		<ComponentCard
			title="With actions"
			description="Drop buttons into the description slot for a call to action."
			class="!min-h-fit !items-stretch !justify-start"
			code={`<Alert variant="soft" color="info" title="Update available">
	{#snippet description()}
		<p>Version 2.0 is ready to install.</p>
		<div class="mt-2 flex gap-2">
			<Button size="small" color="info">Update now</Button>
			<Button size="small" variant="ghost" color="info">Later</Button>
		</div>
	{/snippet}
</Alert>`}
		>
			<div class="w-full max-w-md">
				<Alert variant="soft" color="info" title="Update available">
					{#snippet description()}
						<p>Version 2.0 is ready to install.</p>
						<div class="mt-2 flex gap-2">
							<Button size="small" color="info">Update now</Button>
							<Button size="small" variant="ghost" color="info">Later</Button>
						</div>
					{/snippet}
				</Alert>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Title only"
			description="Description is optional; a single-line alert vertically centers its icon."
			class="!min-h-fit !items-stretch !justify-start"
			code={`<Alert variant="soft" color="success" title="Profile updated" />`}
		>
			<div class="grid w-full max-w-md gap-3">
				<Alert variant="soft" color="success" title="Profile updated" />
				<Alert
					variant="soft"
					color="danger"
					title="Connection lost"
					dismissible
					onDismiss={() => {}}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
