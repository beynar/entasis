<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import type { ButtonVariant } from '$lib/components/Button/index.js';
	import { eyeClosedIcon } from '$lib/components/Icons/eyeClosed.js';
	import { colors, sizes, variants } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let loading = $state(false);
	const buttonVariants = [...variants, 'ghost', 'link'] satisfies ButtonVariant[];
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
			options: buttonVariants
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false },
		{ name: 'loading', type: 'switch', label: 'Loading', value: false }
	]);

	const triggerLoading = () => {
		loading = true;
		setTimeout(() => (loading = false), 1200);
	};
</script>

<DocPage
	title="Button"
	subtitle="Triggers an action or event, with variants, sizes, and colors."
	component="Button"
	features={[
		{ label: 'role=button or link with aria-label', test: 'a11y:button.role-and-label' },
		'Loading spinner overlay attachment',
		'Bindable ref to root element',
		'Renders as anchor when href set',
		'Prefix & suffix icon slots'
	]}
>
	<ComponentCard
		{controls}
		code={`<Button size="${controls.value.size}" variant="${controls.value.variant}" color="${controls.value.color}" disabled={${controls.value.disabled}} loading={${controls.value.loading}}>Click me</Button>`}
	>
		<Button
			size={controls.value.size}
			variant={controls.value.variant}
			color={controls.value.color}
			disabled={controls.value.disabled}
			loading={controls.value.loading}
		>
			Click me
		</Button>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Five variants, from the prominent solid down to a minimal link.">
			<div class="flex flex-wrap items-center justify-center gap-3">
				{#each buttonVariants as variant (variant)}
					<Button {variant}>{variant}</Button>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Seven semantic colors, shown here in the solid variant.">
			<div class="flex flex-wrap items-center justify-center gap-3">
				{#each colors as color (color)}
					<Button {color}>{color}</Button>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Three sizes to match surrounding density.">
			<div class="flex flex-wrap items-center justify-center gap-3">
				{#each sizes as size (size)}
					<Button {size}>{size}</Button>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="Prefix and suffix icon slots. An icon with no label renders squared."
		>
			<div class="flex flex-wrap items-center justify-center gap-3">
				<Button prefix={eyeClosedIcon}>Prefix</Button>
				<Button suffix={eyeClosedIcon}>Suffix</Button>
				<Button prefix={eyeClosedIcon} suffix={eyeClosedIcon}>Both</Button>
				<Button prefix={eyeClosedIcon} label="Toggle visibility" />
			</div>
		</ComponentCard>

		<ComponentCard description="Loading buttons use the Spinner variant configured on Theme.">
			<Button {loading} onclick={triggerLoading}>Save changes</Button>
		</ComponentCard>

		<ComponentCard description="Disabled buttons are dimmed and ignore interaction.">
			<div class="flex flex-wrap items-center justify-center gap-3">
				<Button disabled>Solid</Button>
				<Button variant="outline" disabled>Outline</Button>
				<Button variant="soft" disabled>Soft</Button>
			</div>
		</ComponentCard>

		<ComponentCard description="With an href, the button renders as an anchor with role=link.">
			<div class="flex flex-wrap items-center justify-center gap-3">
				<Button href="https://svelte.dev" target="_blank" rel="noreferrer">Open svelte.dev</Button>
				<Button href="https://svelte.dev" variant="link">Link variant</Button>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
