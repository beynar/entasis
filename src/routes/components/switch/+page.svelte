<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { Switch } from '$lib/components/Form/Switch/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let enabled = $state(false);
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'labelPosition',
			type: 'segmented',
			label: 'Label',
			value: 'top',
			options: ['top', 'left']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

<DocPage
	title="Switch"
	subtitle="A toggle for switching a single setting on or off."
	component="Switch"
	features={[
		'role=switch with aria-checked',
		'Enter & Space keyboard toggle',
		'bind:value, errors, and focused',
		'Hidden checkbox for form submit'
	]}
>
	<ComponentCard
		{controls}
		description="A boolean toggle with a label and description"
		code={`<Switch
	size="${controls.value.size}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Notifications"
	description="Receive updates by email"
	bind:value={enabled}
/>`}
	>
		<div class="w-full max-w-md">
			<Switch
				size={controls.value.size}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Notifications"
				description="Receive updates by email"
				bind:value={enabled}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="A boolean toggle with a label and description">
			<div class="w-full max-w-md">
				<Switch label="Notifications" description="Receive updates by email" bind:value={enabled} />
				<p class="text-neutral/60 mt-2 text-xs">Value: {enabled}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large switch sizes."
			code={`<div class="grid w-full max-w-md gap-6">
	<Switch size="small" label="Small" description="Compact switch" value={true} />
	<Switch size="normal" label="Normal" description="Default switch" value={true} />
	<Switch size="large" label="Large" description="Roomier switch" value={true} />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<Switch size="small" label="Small" description="Compact switch" value={true} />
				<Switch size="normal" label="Normal" description="Default switch" value={true} />
				<Switch size="large" label="Large" description="Roomier switch" value={true} />
			</div>
		</ComponentCard>

		<ComponentCard description="An enabled default and a disabled state">
			<div class="grid w-full max-w-md gap-6">
				<Switch label="Dark mode" value={true} />
				<Switch label="Beta features" description="Coming soon" disabled />
			</div>
		</ComponentCard>

		<ComponentCard description="Using type: 'switch' inside a Form">
			<div class="w-full max-w-md">
				<Form
					inputs={{
						newsletter: {
							type: 'switch',
							label: 'Subscribe to newsletter',
							description: 'Receive updates and promotions'
						}
					}}
					onSubmit={(data) => {
						console.log('Form submitted:', data);
					}}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
