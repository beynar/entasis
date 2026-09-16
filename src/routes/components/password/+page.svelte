<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { PasswordInput } from '$lib/components/Form/PasswordInput/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let password = $state('');
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
	title="Password"
	subtitle="Password entry with a visibility toggle and strength cues."
	component="PasswordInput"
	features={[
		'Show/hide toggle on prefix',
		'Bindable value, errors & focused',
		'Field validation via onValidate',
		'data-1p-ignore for autofill'
	]}
>
	<ComponentCard
		{controls}
		description="A masked password input with visibility toggle"
		code={`<PasswordInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Password"
	placeholder="Enter your password"
	bind:value={password}
/>`}
	>
		<div class="w-full max-w-md">
			<PasswordInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Password"
				placeholder="Enter your password"
				bind:value={password}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="A masked password input with visibility toggle">
			<div class="w-full max-w-md">
				<PasswordInput label="Password" placeholder="Enter your password" bind:value={password} />
			</div>
		</ComponentCard>

		<ComponentCard description="Guide the user with requirements">
			<div class="w-full max-w-md">
				<PasswordInput
					label="New password"
					placeholder="Choose a strong password"
					helper="At least 8 characters"
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large password input sizes."
			code={`<div class="grid w-full max-w-md gap-6">
	<PasswordInput label="Small" placeholder="Small password" size="small" />
	<PasswordInput label="Normal" placeholder="Normal password" size="normal" />
	<PasswordInput label="Large" placeholder="Large password" size="large" />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<PasswordInput label="Small" placeholder="Small password" size="small" />
				<PasswordInput label="Normal" placeholder="Normal password" size="normal" />
				<PasswordInput label="Large" placeholder="Large password" size="large" />
			</div>
		</ComponentCard>

		<ComponentCard description="Using type: 'password' inside a Form">
			<div class="w-full max-w-md">
				<Form
					inputs={{
						password: {
							type: 'password',
							label: 'Password',
							placeholder: 'Enter your password',
							required: true
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
