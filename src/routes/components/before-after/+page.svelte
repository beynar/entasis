<script lang="ts">
	import { BeforeAfter } from '$lib/components/BeforeAfter/index.js';
	import type {
		BeforeAfterHandleVariant,
		BeforeAfterLabelPosition,
		BeforeAfterLabelVariant,
		BeforeAfterLineVariant,
		BeforeAfterOrientation,
		BeforeAfterVariant
	} from '$lib/components/BeforeAfter/index.js';
	import Button from '$lib/components/Button/Button.svelte';
	import Stack from '$lib/components/Stack/Stack.svelte';
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const photo = (id: string, options = '') =>
		`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80${options}`;
	const mountain = 'photo-1464822759023-fed622ff2c3b';
	const coast = 'photo-1507525428034-b723cf961d3e';

	const before = { src: photo(mountain, '&sat=-100'), alt: 'A mountain range, in black and white' };
	const after = { src: photo(mountain), alt: 'The same mountain range, in colour' };

	const controls = createComponentControls([
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'surface',
			options: ['surface', 'solid', 'glass']
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: ['neutral', 'primary', 'secondary', 'info', 'success', 'warning', 'danger']
		},
		{
			name: 'handleVariant',
			type: 'segmented',
			label: 'Handle',
			value: 'grip',
			options: ['grip', 'pill', 'arrows', 'none']
		},
		{
			name: 'lineVariant',
			type: 'segmented',
			label: 'Line',
			value: 'solid',
			options: ['solid', 'dashed', 'none']
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'orientation',
			type: 'segmented',
			label: 'Orientation',
			value: 'horizontal',
			options: ['horizontal', 'vertical']
		},
		{ name: 'labels', type: 'switch', label: 'Labels', value: true },
		{
			name: 'labelVariant',
			type: 'segmented',
			label: 'Label variant',
			value: 'solid',
			options: ['solid', 'soft', 'outline'],
			visible: (value) => value.labels === true
		},
		{
			name: 'labelPosition',
			type: 'segmented',
			label: 'Label position',
			value: 'start',
			options: ['start', 'center', 'end'],
			visible: (value) => value.labels === true
		}
	]);

	// Only what differs from the defaults is written in the Usage code.
	const usageProps = $derived(
		[
			controls.value.orientation !== 'horizontal' && `orientation="${controls.value.orientation}"`,
			controls.value.variant !== 'surface' && `variant="${controls.value.variant}"`,
			controls.value.color !== 'neutral' && `color="${controls.value.color}"`,
			controls.value.handleVariant !== 'grip' && `handleVariant="${controls.value.handleVariant}"`,
			controls.value.lineVariant !== 'solid' && `lineVariant="${controls.value.lineVariant}"`,
			controls.value.size !== 'normal' && `size="${controls.value.size}"`,
			controls.value.labels && 'labels',
			controls.value.labels &&
				controls.value.labelVariant !== 'solid' &&
				`labelVariant="${controls.value.labelVariant}"`,
			controls.value.labels &&
				controls.value.labelPosition !== 'start' &&
				`labelPosition="${controls.value.labelPosition}"`
		]
			.filter(Boolean)
			.map((line) => `\n\t${line}`)
			.join('')
	);

	let share = $state(30);
	let settled = $state(30);
</script>

<DocPage
	title="Before / after"
	subtitle="Compares two contents laid one over the other, with a divider to drag between them."
	component="BeforeAfter"
	features={[
		'The divider is a slider: keyboard, screen readers and right-to-left',
		'Drag the divider, press anywhere on the picture, or swipe and tap on touch',
		'The page keeps scrolling across it on touch',
		'Images by their attributes, or any content as snippets',
		'Labels that are covered and revealed with their side',
		'Variants for the divider, its handle, its line and the labels'
	]}
>
	<ComponentCard
		{controls}
		description="Pass each side as an image. The divider starts in the middle."
		class="mx-auto max-w-3xl"
		code={`<BeforeAfter
	ratio="16x9"${usageProps}
	before={{ src: '/mountain-bw.jpg', alt: 'A mountain range, in black and white' }}
	after={{ src: '/mountain.jpg', alt: 'The same mountain range, in colour' }}
/>`}
	>
		<BeforeAfter
			ratio="16x9"
			orientation={controls.value.orientation as BeforeAfterOrientation}
			variant={controls.value.variant as BeforeAfterVariant}
			color={controls.value.color as Colors}
			handleVariant={controls.value.handleVariant as BeforeAfterHandleVariant}
			lineVariant={controls.value.lineVariant as BeforeAfterLineVariant}
			size={controls.value.size as Sizes}
			labels={controls.value.labels}
			labelVariant={controls.value.labelVariant as BeforeAfterLabelVariant}
			labelPosition={controls.value.labelPosition as BeforeAfterLabelPosition}
			{before}
			{after}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Any content"
			description="Each side can be a snippet. Here both sides are the same image, one of them filtered, with labels of their own."
			class="mx-auto max-w-3xl"
			code={`<BeforeAfter ratio="3x2" labels={{ before: 'Original', after: 'Warm' }}>
	{#snippet before()}
		<img src="/coast.jpg" alt="A beach" class="size-full object-cover" />
	{/snippet}
	{#snippet after()}
		<img src="/coast.jpg" alt="The same beach, in warm tones" class="size-full object-cover sepia" />
	{/snippet}
</BeforeAfter>`}
		>
			<BeforeAfter ratio="3x2" labels={{ before: 'Original', after: 'Warm' }}>
				{#snippet before()}
					<img src={photo(coast)} alt="A beach" class="size-full object-cover" />
				{/snippet}
				{#snippet after()}
					<img
						src={photo(coast)}
						alt="The same beach, in warm tones"
						class="size-full object-cover saturate-150 sepia"
					/>
				{/snippet}
			</BeforeAfter>
		</ComponentCard>

		<ComponentCard
			title="Variants"
			description="`variant` and `color` paint the divider, `handleVariant` shapes its handle, `lineVariant` its line."
			class="mx-auto max-w-4xl"
			code={`<BeforeAfter variant="solid" color="primary" handleVariant="pill" ... />
<BeforeAfter variant="glass" lineVariant="none" ... />
<BeforeAfter handleVariant="arrows" lineVariant="dashed" ... />
<BeforeAfter handleVariant="none" size="large" ... />`}
		>
			<div class="gap-md grid w-full grid-cols-2">
				<BeforeAfter
					ratio="16x9"
					variant="solid"
					color="primary"
					handleVariant="pill"
					{before}
					{after}
				/>
				<BeforeAfter ratio="16x9" variant="glass" lineVariant="none" {before} {after} />
				<BeforeAfter ratio="16x9" handleVariant="arrows" lineVariant="dashed" {before} {after} />
				<BeforeAfter ratio="16x9" handleVariant="none" size="large" {before} {after} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Controlled"
			description="Bind `value`, the share of the before side shown. `onValueCommit` fires once a drag or a key press has settled."
			class="mx-auto max-w-3xl"
			code={`<script>
	let share = $state(30);
</${'script'}>

<BeforeAfter bind:value={share} onValueCommit={(value) => (settled = value)} ... />
<Button onclick={() => (share = 50)}>Centre</Button>`}
		>
			<Stack gap="md">
				<BeforeAfter
					ratio="16x9"
					bind:value={share}
					onValueCommit={(value) => (settled = value)}
					{before}
					{after}
				/>
				<Stack orientation="horizontal" gap="sm" align="center" justify="between">
					<p class="text-sm tabular-nums">Showing {share}% · settled at {settled}%</p>
					<Stack orientation="horizontal" gap="sm">
						<Button variant="outline" size="small" onclick={() => (share = 0)}>After only</Button>
						<Button variant="outline" size="small" onclick={() => (share = 50)}>Centre</Button>
						<Button variant="outline" size="small" onclick={() => (share = 100)}>
							Before only
						</Button>
					</Stack>
				</Stack>
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Sized by its content"
			description="Without `ratio`, the after side keeps its own proportions and the before side fills the same box."
			class="mx-auto max-w-md"
			code={`<BeforeAfter before={before} after={after} />`}
		>
			<BeforeAfter {before} {after} />
		</ComponentCard>

		<ComponentCard
			title="Read-only and disabled"
			description="Read-only keeps the divider focusable and announced; disabled takes it out."
			class="mx-auto max-w-3xl"
			code={`<BeforeAfter readOnly defaultValue={35} ... />
<BeforeAfter disabled defaultValue={65} ... />`}
		>
			<Stack orientation="horizontal" gap="md">
				<BeforeAfter ratio="4x3" readOnly defaultValue={35} {before} {after} />
				<BeforeAfter ratio="4x3" disabled defaultValue={65} {before} {after} />
			</Stack>
		</ComponentCard>
	{/snippet}
</DocPage>
