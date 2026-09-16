<script lang="ts">
	import Spinner from '$lib/components/Spinner/Spinner.svelte';
	import SpinnerText from '$lib/components/SpinnerText/SpinnerText.svelte';
	import type { Sizes } from '$lib/types/theme.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const messages = ['Reading files', 'Building context', 'Preparing answer'];
	const sizes: Sizes[] = ['small', 'normal', 'large'];
	const controls = createComponentControls([
		{
			name: 'transition',
			type: 'segmented',
			label: 'Transition',
			value: 'vertical',
			options: ['vertical', 'reveal']
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'primary',
			options: ['primary', 'success', 'warning', 'danger', 'neutral']
		},
		{
			name: 'delay',
			type: 'slider',
			label: 'Delay',
			value: 1800,
			min: 600,
			max: 3000,
			step: 200,
			showValue: true
		},
		{ name: 'shimmer', type: 'switch', label: 'Shimmer', value: true },
		{ name: 'showSpinner', type: 'switch', label: 'Spinner', value: true }
	]);
</script>

<DocPage
	title="Spinner Text"
	subtitle="A loading status that rotates through messages without shifting its layout."
	component="SpinnerText"
	features={[
		'Vertical and masked reveal transitions',
		'Theme-aware spinner variant',
		'Optional shimmer text treatment',
		'Stable width across message changes',
		'Semantic size and color tokens',
		'Custom spinner snippet'
	]}
>
	<ComponentCard
		{controls}
		description="Cycle through progress messages while keeping the longest message width reserved. The spinner follows Theme unless overridden."
		code={`<script lang="ts">
\timport { SpinnerText } from 'svelai/spinner-text';
${'</' + 'script>'}

<SpinnerText
	\ttexts={['Reading files', 'Building context', 'Preparing answer']}
	\tdelay={${controls.value.delay}}
	\ttransition="${controls.value.transition}"
	\tsize="${controls.value.size}"
	\tcolor="${controls.value.color}"
	\tshimmer={${controls.value.shimmer}}
	\tshowSpinner={${controls.value.showSpinner}}
/>`}
		class="!min-h-[240px]"
	>
		<SpinnerText
			texts={messages}
			delay={controls.value.delay}
			transition={controls.value.transition}
			size={controls.value.size}
			color={controls.value.color}
			shimmer={controls.value.shimmer}
			showSpinner={controls.value.showSpinner}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Transitions"
			description="Move messages vertically or replace them through a left-to-right mask."
			code={`<SpinnerText
\ttexts={['Reading files', 'Building context', 'Preparing answer']}
\ttransition="vertical"
/>
<SpinnerText
\ttexts={['Reading files', 'Building context', 'Preparing answer']}
\ttransition="reveal"
/>`}
			class="!min-h-[240px]"
		>
			<div class="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-16">
				<div class="grid gap-2">
					<span class="text-neutral/70 text-xs font-medium">Vertical</span>
					<SpinnerText texts={messages} delay={1800} transition="vertical" />
				</div>
				<div class="grid gap-2">
					<span class="text-neutral/70 text-xs font-medium">Reveal</span>
					<SpinnerText texts={messages} delay={1800} transition="reveal" />
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Size tokens scale the indicator, gap, message, and transition viewport together."
			code={`<SpinnerText texts={['Loading', 'Almost ready']} size="small" />
<SpinnerText texts={['Loading', 'Almost ready']} size="normal" />
<SpinnerText texts={['Loading', 'Almost ready']} size="large" />`}
			class="!min-h-[240px]"
		>
			<div class="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
				{#each sizes as size, index (index)}
					<SpinnerText texts={['Loading', 'Almost ready']} delay={1900} {size} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Text only"
			description="Hide the indicator when the surrounding interface already communicates loading."
			code={`<SpinnerText
\ttexts={['Indexing workspace', 'Resolving references', 'Finalizing']}
\tshowSpinner={false}
\ttransition="reveal"
\tshimmer
/>`}
			class="!min-h-[240px]"
		>
			<SpinnerText
				texts={['Indexing workspace', 'Resolving references', 'Finalizing']}
				delay={1800}
				showSpinner={false}
				transition="reveal"
				shimmer
				color="info"
			/>
		</ComponentCard>

		<ComponentCard
			title="Custom spinner"
			description="Compose a Spinner variant through the snippet that receives the resolved size and color."
			code={`<script lang="ts">
\timport { SpinnerText } from 'svelai/spinner-text';
\timport { Spinner } from 'svelai/spinner';
${'</' + 'script>'}

<SpinnerText texts={['Generating preview', 'Polishing details']} color="success">
\t{#snippet spinner({ size, color })}
\t\t<Spinner variant="circles" decorative {size} {color} />
\t{/snippet}
</SpinnerText>`}
			class="!min-h-[240px]"
		>
			<SpinnerText texts={['Generating preview', 'Polishing details']} delay={1800} color="success">
				{#snippet spinner({ size, color })}
					<Spinner variant="circles" decorative {size} {color} />
				{/snippet}
			</SpinnerText>
		</ComponentCard>

		<ComponentCard
			title="Color"
			description="The semantic color is shared by the default spinner and active message."
			code={`<SpinnerText texts={['Uploading', 'Verifying']} color="primary" />
<SpinnerText texts={['Uploading', 'Verifying']} color="success" />
<SpinnerText texts={['Uploading', 'Verifying']} color="warning" />`}
			class="!min-h-[240px]"
		>
			<div class="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
				<SpinnerText texts={['Uploading', 'Verifying']} delay={1900} color="primary" />
				<SpinnerText texts={['Uploading', 'Verifying']} delay={1900} color="success" />
				<SpinnerText texts={['Uploading', 'Verifying']} delay={1900} color="warning" />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
