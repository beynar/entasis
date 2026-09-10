<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import KeyValueInput from '$lib/components/Form/KeyValueInput/KeyValueInput.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	// State for each example
	let value1 = $state<{ key: string; value: string }[] | null>(null);
	let value2 = $state<{ key: string; value: string }[] | null>([
		{ key: 'Content-Type', value: 'application/json' },
		{ key: 'Authorization', value: 'Bearer token' }
	]);
	let value3 = $state<{ key: string; value: string }[] | null>(null);
	let value4 = $state<{ key: string; value: string }[] | null>([
		{ key: 'theme', value: 'dark' },
		{ key: 'lang', value: 'en' }
	]);
	let envVars = $state<{ key: string; value: string }[] | null>([
		{ key: 'NODE_ENV', value: 'production' }
	]);
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
	title="Key value input"
	subtitle="An editable list of key/value string pairs."
	component="KeyValueInput"
	features={[
		'Add and remove rows dynamically',
		'Bindable value (KeyValuePair[])',
		'Animated row add/remove',
		'Optional maxRows limit',
		'Maps cleanly to an object with Object.fromEntries'
	]}
>
	<ComponentCard
		{controls}
		description="Edit the environment variables of a deployment"
		code={`<KeyValueInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	disabled={${controls.value.disabled}}
	label="Environment variables"
	description="Passed to the container at deploy time"
	bind:value={envVars}
/>`}
	>
		<div class="w-full max-w-md">
			<KeyValueInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				disabled={controls.value.disabled}
				label="Environment variables"
				description="Passed to the container at deploy time"
				bind:value={envVars}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<!-- Example 1: Empty -->
		<ComponentCard description="Empty — start by pressing Add">
			<div class="w-full max-w-md">
				<KeyValueInput bind:value={value1} />
				{#if value1?.length}
					<p class="text-neutral/60 mt-2 text-xs">
						Pairs: {value1.map((p) => `${p.key}=${p.value}`).join(', ')}
					</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 2: Pre-filled value -->
		<ComponentCard description="Pre-filled with a few pairs">
			<div class="w-full max-w-md">
				<KeyValueInput
					label="Request headers"
					keyPlaceholder="Header"
					valuePlaceholder="Value"
					bind:value={value2}
				/>
			</div>
		</ComponentCard>

		<!-- Example 3: Sizes -->
		<ComponentCard
			title="Sizes"
			description="Small, normal, and large key value input sizes."
			code={`<div class="grid w-full max-w-md gap-6">
	<KeyValueInput label="Small" size="small" value={[{ key: 'mode', value: 'preview' }]} />
	<KeyValueInput label="Normal" size="normal" value={[{ key: 'mode', value: 'preview' }]} />
	<KeyValueInput label="Large" size="large" value={[{ key: 'mode', value: 'preview' }]} />
</div>`}
		>
			<div class="grid w-full max-w-md gap-6">
				<KeyValueInput label="Small" size="small" value={[{ key: 'mode', value: 'preview' }]} />
				<KeyValueInput label="Normal" size="normal" value={[{ key: 'mode', value: 'preview' }]} />
				<KeyValueInput label="Large" size="large" value={[{ key: 'mode', value: 'preview' }]} />
			</div>
		</ComponentCard>

		<!-- Example 4: maxRows of 3 -->
		<ComponentCard description="Limited to a maximum of 3 rows">
			<div class="w-full max-w-md">
				<KeyValueInput maxRows={3} addLabel="Add field" bind:value={value3} />
				{#if value3?.length}
					<p class="text-neutral/60 mt-2 text-xs">{value3.length} / 3 rows</p>
				{/if}
			</div>
		</ComponentCard>

		<!-- Example 5: Object.fromEntries output -->
		<ComponentCard description="Convert the pairs to an object with Object.fromEntries">
			<div class="w-full max-w-md">
				<KeyValueInput label="Settings" bind:value={value4} />
				{#if value4?.length}
					<pre
						class="border-neutral-muted text-neutral/60 mt-2 overflow-auto rounded border p-2 text-xs">{JSON.stringify(
							Object.fromEntries(value4.map((p) => [p.key, p.value])),
							null,
							2
						)}</pre>
				{/if}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
