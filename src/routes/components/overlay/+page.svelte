<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Overlay from '$lib/components/Overlay/Overlay.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const overlayPositions = ['fill', 'top', 'bottom'] as const;
	const overlayAligns = ['start', 'center', 'end'] as const;
	const overlayShowOn = ['always', 'hover', 'focus'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'position',
			type: 'segmented',
			label: 'Position',
			value: 'fill',
			options: overlayPositions
		},
		{
			name: 'align',
			type: 'segmented',
			label: 'Align',
			value: 'center',
			options: overlayAligns
		},
		{
			name: 'showOn',
			type: 'segmented',
			label: 'Show on',
			value: 'always',
			options: overlayShowOn
		},
		{ name: 'scrim', type: 'switch', label: 'Scrim', value: true }
	]);

	const valleyImage =
		'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=85';
	const mountainImage =
		'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85';
	const beachImage =
		'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85';

	let overlayOpen = $state(true);
</script>

<DocPage
	title="Overlay"
	subtitle="Concise content and actions layered over bounded media surfaces."
	component="Overlay"
	features={[
		'Automatic first-child parent positioning',
		'Fill, top, and bottom treatments',
		'Direction-aware edge reveal motion',
		'Reveal modes: always, hover, or on interaction',
		'Composable content and Button actions'
	]}
>
	<ComponentCard
		{controls}
		description="Place Overlay first: the plain parent becomes the positioning context without an attachment or wrapper API."
		code={`<div class="aspect-video overflow-hidden rounded-lg">
	<Overlay
		size="${controls.value.size}"
		position="${controls.value.position}"
		align="${controls.value.align}"
		showOn="${controls.value.showOn}"
		scrim={${controls.value.scrim}}
		title="Design system foundations"
		description="A practical tour of tokens, primitives, and composition."
		actions={[
			{
				content: 'Open gallery',
				color: 'neutral',
				variant: 'soft',
				fullWidth: true
			}
		]}
	/>
	<img src={valleyImage} alt="Layered mountain valley at dusk" class="size-full object-cover" />
</div>`}
	>
		<div class="aspect-video w-full max-w-4xl overflow-hidden rounded-lg">
			<Overlay
				size={controls.value.size}
				position={controls.value.position}
				align={controls.value.align}
				showOn={controls.value.showOn}
				scrim={controls.value.scrim}
				title="Design system foundations"
				description="A practical tour of tokens, primitives, and composition."
				actions={[
					{
						content: 'Open gallery',
						color: 'neutral',
						variant: 'soft',
						fullWidth: true
					}
				]}
			/>
			<img src={valleyImage} alt="Layered mountain valley at dusk" class="size-full object-cover" />
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Top and bottom positions shade only their content band with a directional black-to-transparent gradient."
			code={`<Overlay
	position="top"
	align="start"
	title="Field notes"
	description="Dolomites · September 2026"
/>

<Overlay
	position="bottom"
	align="start"
	title="Low tide"
	description="Atlantic coast · 06:42"
/>`}
		>
			<div class="grid w-full max-w-4xl gap-4 md:grid-cols-2">
				<div class="aspect-[4/3] overflow-hidden rounded-lg">
					<Overlay
						position="top"
						align="start"
						title="Field notes"
						description="Dolomites · September 2026"
					/>
					<img
						src={mountainImage}
						alt="Snow-covered mountains under a starry sky"
						class="size-full object-cover"
					/>
				</div>
				<div class="aspect-[4/3] overflow-hidden rounded-lg">
					<Overlay
						position="bottom"
						align="start"
						title="Low tide"
						description="Atlantic coast · 06:42"
					/>
					<img src={beachImage} alt="Ocean beach at sunrise" class="size-full object-cover" />
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Hover reveal includes focus-within for keyboard access and falls back to visible on touch devices."
			code={`<div class="aspect-video overflow-hidden rounded-lg">
	<Overlay
		showOn="hover"
		position="bottom"
		title="Mountain archive"
		description="Hover the image or focus its action."
		actions={[
			{ content: 'View collection', color: 'neutral', variant: 'soft' }
		]}
	/>
	<img src={mountainImage} alt="Mountain landscape" class="size-full object-cover" />
</div>`}
		>
			<div class="aspect-video w-full max-w-3xl overflow-hidden rounded-lg">
				<Overlay
					showOn="hover"
					position="bottom"
					title="Mountain archive"
					description="Hover the image or focus its action."
					actions={[{ content: 'View collection', color: 'neutral', variant: 'soft' }]}
				/>
				<img src={mountainImage} alt="Mountain landscape" class="size-full object-cover" />
			</div>
		</ComponentCard>

		<ComponentCard
			description="The open prop preserves the fade transition when application state hides the overlay."
			code={`<Button onclick={() => (overlayOpen = !overlayOpen)}>
	Toggle overlay
</Button>

<div class="aspect-video overflow-hidden rounded-lg">
	<Overlay
		open={overlayOpen}
		position="bottom"
		align="start"
		title="Valley study"
		description="Controlled by external state."
	/>
	<img src={valleyImage} alt="Layered mountain valley" class="size-full object-cover" />
</div>`}
		>
			<div class="flex w-full max-w-3xl flex-col items-center gap-4">
				<Button size="small" variant="outline" onclick={() => (overlayOpen = !overlayOpen)}>
					{overlayOpen ? 'Hide overlay' : 'Show overlay'}
				</Button>
				<div class="aspect-video w-full overflow-hidden rounded-lg">
					<Overlay
						open={overlayOpen}
						position="bottom"
						align="start"
						title="Valley study"
						description="Controlled by external state."
					/>
					<img src={valleyImage} alt="Layered mountain valley" class="size-full object-cover" />
				</div>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
