<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import { ImageGallery } from '$lib/components/ImageGallery/index.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	let controlledOpen = $state(false);
	let controlledIndex = $state(1);

	const controls = createComponentControls([
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false },
		{ name: 'closeOnClickOutside', type: 'switch', label: 'Close outside', value: true },
		{
			name: 'zoomMargin',
			type: 'slider',
			label: 'Zoom margin',
			value: 32,
			min: 0,
			max: 96,
			step: 4,
			showValue: true
		}
	]);

	const landscapeOne =
		'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1100&q=80';
	const landscapeTwo =
		'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1100&q=80';
	const landscapeThree =
		'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1100&q=80';
	const articleOne =
		'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80';
	const articleTwo =
		'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80';
</script>

<DocPage
	title="Image Gallery"
	subtitle="Enhance images inside arbitrary HTML and browse them in a zoomed lightbox."
	component="ImageGallery"
	features={[
		'Wraps existing markup instead of requiring an items array',
		'Discovers descendant images from the DOM',
		'LightGallery origin zoom from the exact clicked image',
		'Swipe, thumbnail, wheel, and pinch navigation',
		'Controlled open and active index support'
	]}
>
	<ComponentCard
		{controls}
		title="Basic Gallery"
		description="Wrap any image grid. Each descendant image becomes a zoom trigger."
		class="max-w-4xl"
		code={`<ImageGallery
	disabled={${controls.value.disabled}}
	closeOnClickOutside={${controls.value.closeOnClickOutside}}
	zoomMargin={${controls.value.zoomMargin}}
>
	<div class="grid grid-cols-3 gap-3">
		<img src="/desert-road.jpg" alt="Desert road" title="Desert road" />
		<img src="/clear-water.jpg" alt="Clear ocean water" title="Clear ocean water" />
		<img src="/night-sky.jpg" alt="Night sky" title="Night sky" />
	</div>
</ImageGallery>`}
	>
		<ImageGallery
			disabled={controls.value.disabled}
			closeOnClickOutside={controls.value.closeOnClickOutside}
			zoomMargin={controls.value.zoomMargin}
		>
			<div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
				<img
					src={landscapeOne}
					alt="Desert road with sandstone formations"
					title="Desert road with sandstone formations"
					class="w-full rounded-xl object-cover h-auto"
				/>
				<img
					src={landscapeTwo}
					alt="Clear turquoise ocean water at a beach"
					title="Clear turquoise ocean water"
					class="w-full rounded-xl object-cover h-auto"
				/>
				<img
					src={landscapeThree}
					alt="Night sky over snowy mountains"
					title="Night sky over snowy mountains"
					class="w-full rounded-xl object-cover h-auto"
				/>
			</div>
		</ImageGallery>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Article Markup"
			description="The component enhances only descendant images and leaves surrounding HTML as authored."
			class="max-w-3xl"
			code={`<ImageGallery>
	<article>
		<h3>Field notes</h3>
		<p>Existing prose stays in place.</p>
		<img src="/mountain.jpg" alt="Mountain valley" title="First light" />
		<img src="/house.jpg" alt="Concrete house" title="Glass and concrete" />
	</article>
</ImageGallery>`}
		>
			<ImageGallery>
				<article class="grid gap-5">
					<div>
						<p class="text-neutral/60 text-sm font-medium">Field notes</p>
						<h3 class="mt-1 text-2xl font-semibold">Two scenes, one gallery</h3>
						<p class="text-neutral/60 mt-2 max-w-prose">
							The wrapper keeps the article structure intact while image descendants become gallery
							triggers.
						</p>
					</div>
					<div class="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
						<img
							src={articleOne}
							alt="Mountain valley at sunrise"
							title="First light over the valley"
							class="h-72 w-full rounded-xl object-cover"
						/>
						<img
							src={articleTwo}
							alt="Concrete house with large glass windows"
							title="Glass and concrete"
							class="h-72 w-full rounded-xl object-cover"
						/>
					</div>
				</article>
			</ImageGallery>
		</ComponentCard>

		<ComponentCard
			title="Controlled"
			description="Bind open and activeIndex when an external control should open the zoomed viewer."
			class="max-w-4xl"
			code={`let open = $state(false);
let activeIndex = $state(1);

<Button onclick={() => { activeIndex = 1; open = true; }}>
	Open second image
</Button>

<ImageGallery bind:open bind:activeIndex>
	<img src="/one.jpg" alt="First image" />
	<img src="/two.jpg" alt="Second image" />
</ImageGallery>`}
		>
			<div class="grid gap-4">
				<Button
					variant="outline"
					onclick={() => {
						controlledIndex = 1;
						controlledOpen = true;
					}}
				>
					Open second image
				</Button>
				<ImageGallery bind:open={controlledOpen} bind:activeIndex={controlledIndex}>
					<div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
						<img
							src={landscapeOne}
							alt="Desert road with sandstone formations"
							title="Desert road"
							class="h-48 w-full rounded-xl object-cover"
						/>
						<img
							src={landscapeTwo}
							alt="Clear turquoise ocean water at a beach"
							title="Clear ocean water"
							class="h-48 w-full rounded-xl object-cover"
						/>
						<img
							src={landscapeThree}
							alt="Night sky over snowy mountains"
							title="Night sky"
							class="h-48 w-full rounded-xl object-cover"
						/>
					</div>
				</ImageGallery>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Custom Caption"
			description="Use the caption slot when the zoom layer needs richer context."
			class="max-w-4xl"
			code={`<ImageGallery>
	<img src="/one.jpg" alt="Desert road" title="Desert road" />

	{#snippet caption({ activeImage, activeIndex, images })}
		<span>{activeIndex + 1} / {images.length} - {activeImage?.caption}</span>
	{/snippet}
</ImageGallery>`}
		>
			<ImageGallery>
				<div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
					<img
						src={landscapeOne}
						alt="Desert road with sandstone formations"
						title="Road through sandstone formations"
						class="h-52 w-full rounded-xl object-cover"
					/>
					<img
						src={landscapeTwo}
						alt="Clear turquoise ocean water at a beach"
						title="Turquoise water at low tide"
						class="h-52 w-full rounded-xl object-cover"
					/>
					<img
						src={landscapeThree}
						alt="Night sky over snowy mountains"
						title="Stars above a snowy ridge"
						class="h-52 w-full rounded-xl object-cover"
					/>
				</div>

				{#snippet caption({ activeImage, activeIndex, images })}
					<span>
						{activeIndex + 1} / {images.length} - {activeImage?.caption}
					</span>
				{/snippet}
			</ImageGallery>
		</ComponentCard>
	{/snippet}
</DocPage>
