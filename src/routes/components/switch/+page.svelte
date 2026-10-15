<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { Switch } from '$lib/components/Form/Switch/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let enabled = $state(false);
	let nativeSubmission = $state<string | null>(null);
	let termsSubmission = $state<string | null>(null);
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
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false },
		{ name: 'readOnly', type: 'switch', label: 'Read only', value: false }
	]);
</script>

<DocPage
	title="Switch"
	subtitle="A toggle for switching a single setting on or off."
	component="Switch"
	features={[
		{ label: 'role=switch with aria-checked', test: 'a11y:switch.role' },
		{ label: 'Enter & Space keyboard toggle', test: 'a11y:switch.keyboard-toggle' },
		'A native button: clicking the label toggles it, Space acts once on release',
		'bind:value, errors, and focused',
		'Native form submit sends inputValue only while on',
		'Required means switched on'
	]}
>
	<ComponentCard
		{controls}
		description="A boolean toggle with a label and description"
		code={`<Switch
	size="${controls.value.size}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	readOnly={${controls.value.readOnly}}
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
				readOnly={controls.value.readOnly}
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
				<p class="text-neutral/70 mt-2 text-xs">Value: {enabled}</p>
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

		<ComponentCard
			title="Read-only and accessible name"
			description="A read-only switch stays focusable and announced but cannot be changed. inputAttrs reaches the switch button, so a switch without a visible label can still be named."
			code={`<Switch readOnly value={true} label="Maintenance mode" />
<Switch value={false} inputAttrs={{ 'aria-label': 'Email: weekly digest' }} />`}
		>
			<div class="grid w-full max-w-md gap-6">
				<Switch readOnly value={true} label="Maintenance mode" />
				<Switch value={false} inputAttrs={{ 'aria-label': 'Email: weekly digest' }} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Using type: 'switch' inside a Form. A required switch must be on to submit."
			code={`<Form
	inputs={{
		newsletter: {
			type: 'switch',
			label: 'Subscribe to newsletter',
			description: 'Receive updates and promotions'
		},
		terms: { type: 'switch', label: 'Accept the terms', required: true }
	}}
	onSubmit={(data) => save(data)}
>
	{#snippet children(form)}
		<Button type="button" onclick={() => void form.submit()}>Submit</Button>
	{/snippet}
</Form>`}
		>
			<div class="grid w-full max-w-md gap-4">
				<Form
					inputs={{
						newsletter: {
							type: 'switch',
							label: 'Subscribe to newsletter',
							description: 'Receive updates and promotions'
						},
						terms: { type: 'switch', label: 'Accept the terms', required: true }
					}}
					onSubmit={(data) => {
						termsSubmission = JSON.stringify(data);
					}}
				>
					{#snippet children(form)}
						<Button type="button" onclick={() => void form.submit()}>Submit</Button>
					{/snippet}
				</Form>
				<p class="text-neutral/70 text-xs" data-testid="switch-form-submission">
					Submitted: {termsSubmission ?? 'nothing yet'}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Native form"
			description="Inside a plain <form>, an on switch submits its name with inputValue (default 'true'); an off switch submits nothing, and a required one blocks the submit."
			code={`<form method="POST">
	<Switch name="marketing" inputValue="yes" label="Marketing emails" />
	<Switch name="terms" label="Accept the terms" required />
	<Button type="submit">Save</Button>
</form>`}
		>
			<form
				class="grid w-full max-w-md gap-4"
				data-testid="switch-native-form"
				onsubmit={(event) => {
					event.preventDefault();
					nativeSubmission = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)));
				}}
			>
				<Switch name="marketing" inputValue="yes" label="Marketing emails" />
				<Switch name="terms" label="Accept the terms" required />
				<Button type="submit">Save</Button>
				<p class="text-neutral/70 text-xs" data-testid="switch-native-submission">
					FormData: {nativeSubmission ?? 'nothing submitted yet'}
				</p>
			</form>
		</ComponentCard>
	{/snippet}
</DocPage>
