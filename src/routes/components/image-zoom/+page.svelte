<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import { ImageZoom } from '$lib/components/ImageZoom/index.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	let controlledOpen = $state(false);

	const indicatorPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
	const controls = createComponentControls([
		{ name: 'showIndicator', type: 'switch', label: 'Indicator', value: true },
		{
			name: 'indicatorPosition',
			type: 'segmented',
			label: 'Position',
			value: 'top-right',
			options: indicatorPositions
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);

	const mountainThumb =
		'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80';
	const mountainZoom =
		'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=90';
	const architectureThumb =
		'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80';
	const architectureZoom =
		'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=2200&q=90';
	const oceanImage = {
		src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80',
		zoomSrc:
			'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=90',
		zoomWidth: 1800,
		zoomHeight: 1197,
		alt: 'Clear turquoise ocean water at a beach'
	};
	const mediumLandscape = {
		src: 'https://images.unsplash.com/photo-1477322524744-0eece9e79640?auto=format&fit=crop&w=860&q=80',
		zoomSrc:
			'https://images.unsplash.com/photo-1477322524744-0eece9e79640?auto=format&fit=crop&w=1600&q=80',
		zoomWidth: 1600,
		zoomHeight: 1126,
		alt: 'A person standing beside a lake beneath a mountain range'
	};
	const mediumCoast = {
		src: 'https://images.unsplash.com/photo-1465311530779-5241f5a29892?auto=format&fit=crop&w=860&q=80',
		zoomSrc:
			'https://images.unsplash.com/photo-1465311530779-5241f5a29892?auto=format&fit=crop&w=1600&q=80',
		zoomWidth: 1600,
		zoomHeight: 1067,
		alt: 'Rocky coastline beneath a pale sky'
	};
	const mediumPortrait = {
		src: 'https://images.unsplash.com/photo-1610448721566-47369c768e70?auto=format&fit=crop&w=340&q=80',
		zoomSrc:
			'https://images.unsplash.com/photo-1610448721566-47369c768e70?auto=format&fit=crop&w=1600&q=80',
		zoomWidth: 1600,
		zoomHeight: 2400,
		alt: 'Sunlight passing through a forest canopy'
	};
	const galleryImages = [
		{
			src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=700&q=80',
			zoomSrc:
				'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=90',
			zoomWidth: 1800,
			zoomHeight: 2700,
			width: 700,
			height: 1050,
			alt: 'Desert road with sandstone formations'
		},
		{ ...oceanImage, width: 700, height: 465 },
		{
			src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=80',
			zoomSrc:
				'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=90',
			zoomWidth: 1800,
			zoomHeight: 1201,
			width: 700,
			height: 467,
			alt: 'Night sky over snowy mountains'
		}
	];
</script>

<DocPage
	title="Image Zoom"
	subtitle="Medium-style image expansion powered by LightGallery."
	component="ImageZoom"
	features={[
		'Controlled or uncontrolled open state',
		'LightGallery Medium Zoom origin transition',
		'Optional high-resolution zoom source',
		'Configurable image, backdrop, and Escape dismissal',
		'Scroll dismissal for page and nested scroll containers',
		'Focus restoration and reduced-motion support'
	]}
>
	<ComponentCard
		{controls}
		title="Medium Zoom"
		description="Full-resolution dimensions keep the source and zoomed image on the same animated geometry."
		class="max-w-4xl"
		code={`<ImageZoom
	src="/article-image-small.jpg"
	zoomSrc="/article-image-large.jpg"
	zoomWidth={1600}
	zoomHeight={1126}
	alt="Mountain ridge above a cloud layer"
	showIndicator={${controls.value.showIndicator}}
	indicatorPosition="${controls.value.indicatorPosition}"
	disabled={${controls.value.disabled}}
/>`}
	>
		<article class="mx-auto max-w-2xl py-4 text-left">
			<header class="grid gap-2">
				<p class="text-primary text-sm font-medium">Field notes</p>
				<h2 class="text-neutral text-3xl font-semibold">Along the waterline</h2>
				<p class="text-neutral/60 text-sm">Three images embedded in a reading flow.</p>
			</header>

			<p class="text-neutral/60 my-6 text-base leading-7">
				The path narrowed as it reached the lake. Click any photograph to expand it directly from
				its position in the article.
			</p>

			<ImageZoom
				{...mediumLandscape}
				width={860}
				height={605}
				backgroundColor="#fff"
				showIndicator={controls.value.showIndicator}
				indicatorPosition={controls.value.indicatorPosition}
				disabled={controls.value.disabled}
			/>

			<p class="text-neutral/60 my-6 text-base leading-7">
				Farther north, the shoreline became rougher and the horizon less certain. The larger source
				replaces the thumbnail without changing its final rectangle.
			</p>

			<ImageZoom
				{...mediumCoast}
				width={860}
				height={573}
				backgroundColor="rgb(22 37 44)"
				showIndicator={controls.value.showIndicator}
				indicatorPosition={controls.value.indicatorPosition}
				disabled={controls.value.disabled}
			/>

			<p class="text-neutral/60 my-6 text-base leading-7">
				The final image sits inside the prose rather than taking the full column. Its portrait
				geometry uses the same origin transition as the wider photographs.
			</p>

			<div class="float-right mb-4 ml-6 w-[min(42%,21rem)]">
				<ImageZoom
					{...mediumPortrait}
					width={340}
					height={510}
					backgroundColor="rgb(28 62 74)"
					showIndicator={controls.value.showIndicator}
					indicatorPosition={controls.value.indicatorPosition}
					disabled={controls.value.disabled}
				/>
			</div>

			<p class="text-neutral/60 text-base leading-7">
				The forest held the remaining light above the trail. Beneath it, the air cooled quickly and
				the details disappeared into a single dark plane.
			</p>
			<div class="clear-both"></div>
		</article>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="High-Resolution Source"
			description="Use zoomSrc when the thumbnail should stay light but the zoomed layer needs more detail."
			class="max-w-md"
			code={`<ImageZoom
	src="/architecture-800.jpg"
	zoomSrc="/architecture-2200.jpg"
	zoomWidth={2200}
	zoomHeight={1468}
	alt="Concrete house with large glass windows"
/>`}
		>
			<ImageZoom
				src={architectureThumb}
				zoomSrc={architectureZoom}
				zoomWidth={2200}
				zoomHeight={1468}
				alt="Concrete house with large glass windows"
				width={520}
				height={347}
			/>
		</ComponentCard>

		<ComponentCard
			title="Caption"
			description="Provide a caption slot when the zoomed view needs context."
			class="max-w-xl"
			code={`<ImageZoom src="/photo.jpg" alt="Mountain valley at sunrise">
	{#snippet caption()}
		<span>Shot at first light after rain.</span>
	{/snippet}
</ImageZoom>`}
		>
			<ImageZoom
				src={mountainThumb}
				zoomSrc={mountainZoom}
				zoomWidth={2200}
				zoomHeight={1467}
				alt="Mountain valley at sunrise"
				width={640}
				height={427}
			>
				{#snippet caption()}
					<span>Shot at first light after rain.</span>
				{/snippet}
			</ImageZoom>
		</ComponentCard>

		<ComponentCard
			title="Indicator"
			description="Move the zoom indicator, hide it, or replace the default icon with slot content."
			class="max-w-xl"
			code={`<ImageZoom
	src="/photo.jpg"
	alt="Mountain valley at sunrise"
	indicatorPosition="top-left"
>
	{#snippet indicator()}
		<span>2x</span>
	{/snippet}
</ImageZoom>

<ImageZoom showIndicator={false} src="/photo.jpg" alt="Mountain valley at sunrise" />`}
		>
			<ImageZoom
				src={mountainThumb}
				zoomSrc={mountainZoom}
				zoomWidth={2200}
				zoomHeight={1467}
				alt="Mountain valley at sunrise"
				width={640}
				height={427}
				indicatorPosition="top-left"
			>
				{#snippet indicator()}
					<span>2x</span>
				{/snippet}
			</ImageZoom>
		</ComponentCard>

		<ComponentCard
			title="Controlled"
			description="Bind open when another control should open or close the zoom layer."
			class="max-w-xl"
			code={`let open = $state(false);

<Button onclick={() => (open = true)}>Open zoom</Button>
<ImageZoom bind:open src="/photo.jpg" alt="Mountain valley at sunrise" />`}
		>
			<div class="grid gap-4">
				<Button variant="outline" onclick={() => (controlledOpen = true)}>Open zoom</Button>
				<ImageZoom
					bind:open={controlledOpen}
					src={mountainThumb}
					zoomSrc={mountainZoom}
					zoomWidth={2200}
					zoomHeight={1467}
					alt="Mountain valley at sunrise"
					width={640}
					height={427}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Child Image"
			description="When the children slot renders an image, ImageZoom can infer src and alt from it."
			class="max-w-lg"
			code={`<ImageZoom>
	{#snippet children()}
		<div class="relative overflow-hidden rounded-xl">
			<img src="/photo.jpg" alt="Mountain valley at sunrise" />
			<span>Open detail</span>
		</div>
	{/snippet}
</ImageZoom>`}
		>
			<ImageZoom>
				{#snippet children()}
					<div class="relative aspect-[4/3] w-72 overflow-hidden rounded-xl">
						<img
							src={mountainThumb}
							alt="Mountain valley at sunrise"
							class="h-full w-full object-cover"
						/>
						<span
							class="bg-surface/85 text-neutral absolute right-3 bottom-3 rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-md"
						>
							Open detail
						</span>
					</div>
				{/snippet}
			</ImageZoom>
		</ComponentCard>

		<ComponentCard
			title="Gallery"
			description="Multiple ImageZoom instances can live in the same grid."
			class="max-w-3xl"
			code={`<div class="grid grid-cols-3 gap-3">
	{#each images as image}
		<ImageZoom {...image} />
	{/each}
</div>`}
		>
			<div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
				{#each galleryImages as image (image.src)}
					<ImageZoom {...image} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Disabled"
			description="Disabled images keep their thumbnail visible but do not open."
			class="max-w-md"
			code={`<ImageZoom
	disabled
	src="/photo.jpg"
	alt="Mountain valley at sunrise"
/>`}
		>
			<ImageZoom
				disabled
				src={mountainThumb}
				alt="Mountain valley at sunrise"
				width={520}
				height={340}
			/>
		</ComponentCard>
	{/snippet}
</DocPage>
