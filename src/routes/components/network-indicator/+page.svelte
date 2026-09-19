<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { NetworkIndicator } from '$lib/components/NetworkIndicator/index.js';
	import { colors } from '$lib/utils/tokens.js';
	import NetworkIndicatorPreview from './NetworkIndicatorPreview.svelte';
	import NetworkIndicatorTrailExamples from './NetworkIndicatorTrailExamples.svelte';
	import type { Easing } from '$lib/transitions/easingFunctions.js';

	const easingExamples: { label: string; easing: Easing; duration: number }[] = [
		{ label: 'Cubic', easing: 'cubicInOut', duration: 300 },
		{ label: 'Expo', easing: 'expoOut', duration: 450 },
		{ label: 'Back', easing: 'backOut', duration: 500 }
	];
	const controls = createComponentControls([
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'bar',
			options: ['bar', 'trail', 'trail-bounce']
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'primary',
			options: ['primary', 'success', 'warning', 'danger', 'info']
		},
		{
			name: 'height',
			type: 'slider',
			label: 'Height',
			value: 3,
			min: 2,
			max: 6,
			step: 1,
			showValue: true
		},
		{
			name: 'duration',
			type: 'slider',
			label: 'Duration',
			value: 300,
			min: 150,
			max: 700,
			step: 50,
			showValue: true
		}
	]);

	let isPreviewLoading = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	function previewNetworkRequest() {
		clearTimeout(timeoutId);
		isPreviewLoading = true;

		timeoutId = setTimeout(() => {
			isPreviewLoading = false;
		}, 1400);
	}
</script>

<DocPage
	title="Network indicator"
	subtitle="A fixed top loading bar for router navigations and explicit async work."
	component="NetworkIndicator"
	features={[
		'Router-agnostic navigating prop',
		'Explicit show/hide helper API',
		'Indeterminate progressbar semantics',
		'Bar and trail animation variants',
		'Color, height, duration, and easing controls',
		'Theme override support'
	]}
>
	<ComponentCard
		{controls}
		description="Trigger the mounted page indicator from explicit async work."
		class="!min-h-[260px]"
		code={`<script lang="ts">
	import { Button } from 'svelai/button';
	import { NetworkIndicator } from 'svelai/network-indicator';

	let loading = $state(false);

	function previewRequest() {
		loading = true;
		setTimeout(() => (loading = false), 1400);
	}
${'</' + 'script>'}

	<div class="relative overflow-hidden rounded-lg border">
		<NetworkIndicator
			{loading}
			variant="${controls.value.variant}"
			color="${controls.value.color}"
			height={${controls.value.height}}
			theme={{ motion: { duration: ${controls.value.duration} } }}
			class="!absolute"
		/>
		<Button onclick={previewRequest} loading={loading}>
		{loading ? 'Syncing' : 'Preview async work'}
	</Button>
</div>`}
	>
		<div
			class="border-neutral-muted bg-surface relative flex min-h-24 w-full max-w-md flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border p-6"
		>
			<NetworkIndicator
				loading={isPreviewLoading}
				variant={controls.value.variant}
				color={controls.value.color}
				height={controls.value.height}
				theme={{ motion: { duration: controls.value.duration } }}
				class="!absolute !z-10"
			/>
			<Button onclick={previewNetworkRequest} loading={isPreviewLoading}>
				{isPreviewLoading ? 'Syncing' : 'Preview async work'}
			</Button>
			<p class="text-neutral/70 text-sm">The local indicator runs for 1.4 seconds.</p>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Controlled loading state keeps the indicator local to a panel and still plays the finish-to-100 animation when loading ends."
			class="!min-h-[240px]"
			code={`<script lang="ts">
	import { Button } from 'svelai/button';
	import { NetworkIndicator } from 'svelai/network-indicator';

	let loading = $state(false);

	function runTask() {
		loading = true;
		setTimeout(() => (loading = false), 1400);
	}
${'</' + 'script>'}

<div class="relative overflow-hidden rounded-lg border p-6">
	<NetworkIndicator {loading} color="primary" class="!absolute !z-10" />
	<Button onclick={runTask} loading={loading}>
		{loading ? 'Saving' : 'Run task'}
	</Button>
</div>`}
		>
			<div
				class="border-neutral-muted bg-surface relative flex min-h-24 w-full max-w-xl items-center justify-center overflow-hidden rounded-lg border p-6"
			>
				<NetworkIndicator loading={isPreviewLoading} color="primary" class="!absolute !z-10" />
				<Button onclick={previewNetworkRequest} loading={isPreviewLoading}>
					{isPreviewLoading ? 'Saving' : 'Run task'}
				</Button>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Trail variant renders one randomly sized moving segment at a time. The motion slot duration sets the pass speed and trailGap the pause between passes."
			class="!min-h-[220px]"
			code={`<NetworkIndicator loading variant="trail" color="primary" theme={{ motion: { duration: 650 } }} trailGap={0} />
<NetworkIndicator loading variant="trail" color="success" height={5} theme={{ motion: { duration: 450 } }} trailGap={120} />
<NetworkIndicator loading variant="trail-bounce" color="info" theme={{ motion: { duration: 700 } }} trailGap={80} />`}
		>
			<NetworkIndicatorTrailExamples />
		</ComponentCard>

		<ComponentCard
			description="Use positioning utilities when the indicator should sit on a local surface edge instead of the viewport top."
			class="!min-h-[220px]"
			code={`<div class="relative overflow-hidden rounded-lg border">
	<NetworkIndicator loading color="warning" height={4} class="!absolute !top-auto !bottom-0 !z-10" />
	<div class="p-6">Panel content</div>
</div>`}
		>
			<div class="w-full max-w-xl">
				<NetworkIndicatorPreview label="Bottom edge indicator" class="h-28">
					<NetworkIndicator
						loading
						color="warning"
						height={4}
						class="!absolute !top-auto !bottom-0 !z-10"
					/>
				</NetworkIndicatorPreview>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Color tokens let the indicator match navigation, saving, upload, or warning contexts."
			class="!min-h-[260px]"
			code={`<NetworkIndicator loading color="primary" />
<NetworkIndicator loading color="success" />
<NetworkIndicator loading color="warning" />`}
		>
			<div class="grid w-full max-w-xl gap-4">
				{#each colors as color, index (index)}
					<NetworkIndicatorPreview label={color} class="h-10">
						<NetworkIndicator loading {color} height={4} class="!absolute !z-10" />
					</NetworkIndicatorPreview>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="Use a 2-6px height range. Thin is quiet for navigation; thicker bars are better for explicit tasks."
			class="!min-h-[240px]"
			code={`<NetworkIndicator loading height={2} />
<NetworkIndicator loading height={4} color="primary" />
<NetworkIndicator loading height={6} color="info" />`}
		>
			<div class="grid w-full max-w-xl gap-4">
				{#each [2, 4, 6] as height, index (index)}
					<NetworkIndicatorPreview label={`${height}px`}>
						<NetworkIndicator
							loading
							{height}
							color={height === 2 ? 'neutral' : height === 4 ? 'primary' : 'info'}
							class="!absolute !z-10"
						/>
					</NetworkIndicatorPreview>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="The motion slot duration sets each animation segment; its easing changes the perceived momentum."
			class="!min-h-[240px]"
			code={`<NetworkIndicator loading theme={{ motion: { duration: 300, easing: 'cubicInOut' } }} />
<NetworkIndicator loading theme={{ motion: { duration: 450, easing: 'expoOut' } }} />
<NetworkIndicator loading theme={{ motion: { duration: 500, easing: 'backOut' } }} />`}
		>
			<div class="grid w-full max-w-xl gap-4">
				{#each easingExamples as example, index (index)}
					<NetworkIndicatorPreview label={`${example.label}: ${example.easing}`}>
						<NetworkIndicator
							loading
							color="secondary"
							height={4}
							theme={{ motion: { duration: example.duration, easing: example.easing } }}
							class="!absolute !z-10"
						/>
					</NetworkIndicatorPreview>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="Provide a label when the default Loading announcement is not specific enough."
			class="!min-h-[220px]"
			code="<NetworkIndicator loading label=&quot;Uploading files&quot; color=&quot;info&quot; />"
		>
			<div class="w-full max-w-xl">
				<NetworkIndicatorPreview label="Accessible label: Uploading files" class="h-14">
					<NetworkIndicator
						loading
						label="Uploading files"
						color="info"
						height={4}
						class="!absolute !z-10"
					/>
				</NetworkIndicatorPreview>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Theme overrides are useful when the top bar needs a custom visual treatment without changing global tokens."
			class="!min-h-[220px]"
			code={`<NetworkIndicator
	loading
	color="success"
	height={5}
	theme={{
		root: {
			base: 'ui-network-indicator fixed top-0 left-0 w-full z-[9999] origin-left rounded-none shadow-lg'
		}
	}}
/>`}
		>
			<div class="w-full max-w-xl">
				<NetworkIndicatorPreview label="Square edge with a stronger shadow" class="h-14">
					<NetworkIndicator
						loading
						color="success"
						height={5}
						class="!absolute !z-10"
						theme={{
							root: {
								base: 'ui-network-indicator fixed top-0 left-0 w-full z-[9999] origin-left rounded-none shadow-lg'
							}
						}}
					/>
				</NetworkIndicatorPreview>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
