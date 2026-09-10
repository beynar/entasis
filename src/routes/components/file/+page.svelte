<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { FileInput } from '$lib/components/Form/File/index.js';
	import Form from '$lib/components/Form/Form/Form.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	let single = $state<File | null>(null);
	let multiple = $state<File[] | null>(null);
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
	title="File"
	subtitle="Upload files via click or drag-and-drop."
	component="FileInput"
	features={[
		'Click or drag-and-drop upload',
		'Single and multiple file modes',
		'MIME type, size and count limits',
		'Bindable File or File[] value',
		'Image preview thumbnails'
	]}
>
	<ComponentCard
		{controls}
		description="Click or drag a single image file"
		code={`<FileInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Avatar"
	description="A square image works best."
	mode="single"
	types={['image/*']}
	bind:value={single}
/>`}
	>
		<div class="w-full max-w-md">
			<FileInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Avatar"
				description="A square image works best."
				mode="single"
				types={['image/*']}
				bind:value={single}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Click or drag a single file">
			<div class="w-full max-w-md">
				<FileInput label="Avatar" mode="single" types={['image/*']} bind:value={single} />
				{#if single}
					<p class="text-neutral/60 mt-2 text-xs">Selected: {single.name}</p>
				{/if}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large file inputs."
			code={`<div class="grid w-full max-w-md gap-6">
	<FileInput size="small" label="Small" mode="single" types={['image/*']} />
	<FileInput size="normal" label="Normal" mode="single" types={['image/*']} />
	<FileInput size="large" label="Large" mode="single" types={['image/*']} />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<FileInput size="small" label="Small" mode="single" types={['image/*']} />
				<FileInput size="normal" label="Normal" mode="single" types={['image/*']} />
				<FileInput size="large" label="Large" mode="single" types={['image/*']} />
			</div>
		</ComponentCard>

		<ComponentCard description="Upload up to 3 files with a size limit">
			<div class="w-full max-w-md">
				<FileInput
					label="Attachments"
					mode="multiple"
					maxFiles={3}
					maxSize={5 * 1024 * 1024}
					bind:value={multiple}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Using type: 'file' and 'files' inside a Form">
			<div class="w-full max-w-md">
				<Form
					inputs={{
						avatar: {
							type: 'file',
							label: 'Avatar',
							required: true
						},
						documents: {
							type: 'files',
							label: 'Documents',
							description: 'Upload up to 3 files',
							maxFiles: 3
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
