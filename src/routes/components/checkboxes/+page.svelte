<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { CheckboxesInput } from '$lib/components/Form/CheckboxesInput/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const items = [
		{ value: 'email', label: 'Email', description: 'Receive updates by email' },
		{ value: 'sms', label: 'SMS', description: 'Receive updates by text message' },
		{ value: 'push', label: 'Push', description: 'Receive push notifications' }
	];

	let selected = $state<string[]>(['email']);
	let cardSelected = $state<string[]>([]);
	let allSelected = $state<string[]>(['sms']);
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
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false },
		{ name: 'readOnly', type: 'switch', label: 'Read only', value: false }
	]);
</script>

<DocPage
	title="Checkboxes"
	subtitle="Lets users select one or more options from a set."
	component="CheckboxesInput"
	features={[
		'Fieldset groups options with labels',
		'Hidden native checkboxes for forms',
		'Bindable string[] value',
		'Normal and card display modes',
		'Required and custom validation'
	]}
>
	<ComponentCard
		{controls}
		description="Select one or more notification channels"
		code={`<CheckboxesInput
	size="${controls.value.size}"
	mode="${controls.value.mode}"
	disabled={${controls.value.disabled}}
	readOnly={${controls.value.readOnly}}
	label="Notifications"
	description="Pick the channels you want to hear from"
	items={[
		{ value: 'email', label: 'Email', description: 'Receive updates by email' },
		{ value: 'sms', label: 'SMS', description: 'Receive updates by text message' },
		{ value: 'push', label: 'Push', description: 'Receive push notifications' }
	]}
	bind:value={selected}
/>`}
	>
		<div class="w-full max-w-md">
			<CheckboxesInput
				size={controls.value.size}
				mode={controls.value.mode}
				disabled={controls.value.disabled}
				readOnly={controls.value.readOnly}
				label="Notifications"
				description="Pick the channels you want to hear from"
				{items}
				bind:value={selected}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="A list of checkable options">
			<div class="w-full max-w-md">
				<CheckboxesInput label="Notifications" mode="normal" {items} bind:value={selected} />
				<p class="text-neutral/70 mt-4 text-sm">Selected: {selected.join(', ') || 'none'}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large checkbox groups."
			code={`<div class="grid w-full max-w-md gap-6">
	<CheckboxesInput label="Small" mode="normal" size="small" {items} />
	<CheckboxesInput label="Normal" mode="normal" size="normal" {items} />
	<CheckboxesInput label="Large" mode="normal" size="large" {items} />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<CheckboxesInput label="Small" mode="normal" size="small" {items} />
				<CheckboxesInput label="Normal" mode="normal" size="normal" {items} />
				<CheckboxesInput label="Large" mode="normal" size="large" {items} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Select all"
			description="selectAll adds a parent checkbox. It is mixed while some enabled options are selected; clicking it selects all, then none, then gives back the selection you started from. Disabled options are never changed."
			code={`<CheckboxesInput
	label="Notifications"
	selectAll
	items={[
		{ value: 'email', label: 'Email' },
		{ value: 'sms', label: 'SMS' },
		{ value: 'push', label: 'Push', disabled: true }
	]}
	bind:value={selected}
/>`}
		>
			<div class="w-full max-w-md">
				<CheckboxesInput
					label="Notifications"
					selectAll
					items={[
						{ value: 'email', label: 'Email' },
						{ value: 'sms', label: 'SMS' },
						{ value: 'push', label: 'Push', disabled: true }
					]}
					bind:value={allSelected}
				/>
				<p class="text-neutral/70 mt-4 text-sm">
					Selected: {allSelected.join(', ') || 'none'}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Read-only"
			description="Focusable and announced as read-only, but unchangeable. The selection still submits."
			code={`<CheckboxesInput label="Notifications" readOnly value={['email']} items={items} />`}
		>
			<div class="w-full max-w-md">
				<CheckboxesInput label="Notifications" readOnly value={['email']} {items} />
			</div>
		</ComponentCard>

		<ComponentCard description="Options rendered as selectable cards">
			<div class="w-full max-w-md">
				<CheckboxesInput label="Notifications" mode="card" {items} bind:value={cardSelected} />
				<p class="text-neutral/70 mt-4 text-sm">
					Selected: {cardSelected.join(', ') || 'none'}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard description="Using type: 'checkboxes' inside a Form">
			<div class="w-full max-w-md">
				<Form
					inputs={{
						channels: {
							type: 'checkboxes',
							label: 'Notification channels',
							required: true,
							items
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
