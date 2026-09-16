<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { Checkbox } from '$lib/components/Form/Checkbox/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let email = $state(true);
	let terms = $state(false);
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'mode',
			type: 'segmented',
			label: 'Mode',
			value: 'normal',
			options: ['normal', 'card']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

<DocPage
	title="Checkbox"
	subtitle="Lets users toggle a single boolean value."
	component="Checkbox"
	features={[
		'Single boolean field',
		'Hidden native checkbox for forms',
		'Bindable boolean value',
		'Normal and card display modes',
		'Required and custom validation'
	]}
>
	<ComponentCard
		{controls}
		description="Toggle a single notification preference"
		code={`<Checkbox
	size="${controls.value.size}"
	mode="${controls.value.mode}"
	disabled={${controls.value.disabled}}
	label="Email"
	description="Receive updates by email"
	bind:value={email}
/>`}
	>
		<div class="w-full max-w-md">
			<Checkbox
				size={controls.value.size}
				mode={controls.value.mode}
				disabled={controls.value.disabled}
				label="Email"
				description="Receive updates by email"
				bind:value={email}
			/>
			<p class="text-neutral/70 mt-4 text-sm">Value: {email}</p>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="A single boolean field.">
			<div class="w-full max-w-md">
				<Checkbox label="Email" description="Receive updates by email" bind:value={email} />
				<p class="text-neutral/70 mt-4 text-sm">Value: {email}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large checkbox sizes."
			code={`<div class="grid w-full max-w-md gap-6">
	<Checkbox size="small" label="Small" description="Compact checkbox" value={true} />
	<Checkbox size="normal" label="Normal" description="Default checkbox" value={true} />
	<Checkbox size="large" label="Large" description="Roomier checkbox" value={true} />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<Checkbox size="small" label="Small" description="Compact checkbox" value={true} />
				<Checkbox size="normal" label="Normal" description="Default checkbox" value={true} />
				<Checkbox size="large" label="Large" description="Roomier checkbox" value={true} />
			</div>
		</ComponentCard>

		<ComponentCard description="A checkbox rendered as a selectable card.">
			<div class="w-full max-w-md">
				<Checkbox
					label="Terms"
					description="I accept the terms and conditions"
					mode="card"
					bind:value={terms}
				/>
				<p class="text-neutral/70 mt-4 text-sm">Value: {terms}</p>
			</div>
		</ComponentCard>

		<ComponentCard description="Using type: 'checkbox' inside a Form.">
			<div class="w-full max-w-md">
				<Form
					inputs={{
						emailUpdates: {
							type: 'checkbox',
							label: 'Email',
							description: 'Receive updates by email'
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
