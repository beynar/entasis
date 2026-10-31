<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import SignatureInput from '$lib/components/Form/SignatureInput/SignatureInput.svelte';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let signature = $state<string | null>(null);
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
		{
			name: 'format',
			type: 'segmented',
			label: 'Format',
			value: 'png',
			options: ['png', 'svg']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false },
		{ name: 'readOnly', type: 'switch', label: 'Read only', value: false }
	]);

	// A saved signature, as an app would load it back from storage.
	const savedSignature = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M10 50Q30 5 45 40T80 35Q95 20 105 45T150 30Q170 15 185 40T210 25" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"/></svg>'
	)}`;
</script>

<DocPage
	title="Signature input"
	subtitle="A pad to sign with a mouse, a finger or a pen. Its value is the signature as an image, cropped to the ink."
	component="SignatureInput"
	features={[
		'PNG or SVG data URL value, cropped to the ink',
		'Smoothed strokes with pen pressure',
		'Undo and clear, by button or key',
		'Theme-colored ink on screen, black ink in the export',
		'Form, ask() and native form submission'
	]}
>
	<ComponentCard
		{controls}
		description="Sign the pad; the value updates when each stroke ends."
		code={`<SignatureInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	format="${controls.value.format}"
	disabled={${controls.value.disabled}}
	readOnly={${controls.value.readOnly}}
	label="Signature"
	description="Sign with your mouse, finger or pen."
	required
	bind:value={signature}
/>`}
	>
		<div class="grid w-full max-w-md gap-4">
			<SignatureInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				format={controls.value.format}
				disabled={controls.value.disabled}
				readOnly={controls.value.readOnly}
				label="Signature"
				description="Sign with your mouse, finger or pen."
				required
				bind:value={signature}
			/>
			{#if signature}
				<div class="grid gap-2">
					<p class="text-neutral/70 text-xs">Exported image ({signature.length} characters)</p>
					<img
						src={signature}
						alt="Exported signature"
						class="border-neutral-muted max-h-24 w-fit rounded-md border bg-white p-2"
					/>
				</div>
			{/if}
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="A saved signature"
			description="A value set from outside shows as an image. Drawing over it starts a new signature."
			code={`<SignatureInput label="Signature" defaultValue={savedSignature} />`}
		>
			<div class="w-full max-w-md">
				<SignatureInput label="Signature" defaultValue={savedSignature} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Read only"
			description="Shows, focuses, validates and submits its value; no drawing, no buttons."
			code={`<SignatureInput label="Signature" readOnly value={savedSignature} />`}
		>
			<div class="w-full max-w-md">
				<SignatureInput label="Signature" readOnly value={savedSignature} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="The pad's height follows the size."
			code={`<SignatureInput label="Small" size="small" />
<SignatureInput label="Normal" size="normal" />
<SignatureInput label="Large" size="large" />`}
		>
			<div class="grid w-full max-w-md gap-6">
				<SignatureInput label="Small" size="small" />
				<SignatureInput label="Normal" size="normal" />
				<SignatureInput label="Large" size="large" />
			</div>
		</ComponentCard>

		<ComponentCard
			title="In a Form"
			description="Use type: 'signature' in Form inputs or ask()."
			code={`<Form
	inputs={{
		name: { type: 'text', label: 'Full name', required: true },
		signature: { type: 'signature', label: 'Signature', required: true }
	}}
	onSubmit={(data) => save(data)}
/>`}
		>
			<div class="w-full max-w-md">
				<Form
					inputs={{
						name: { type: 'text', label: 'Full name', required: true },
						signature: { type: 'signature', label: 'Signature', required: true }
					}}
					onSubmit={(data) => console.log('Form submitted:', data)}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
