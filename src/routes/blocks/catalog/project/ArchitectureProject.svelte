<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Carousel } from 'svelai/carousel';
	const photos = [
		{
			title: 'Desert light',
			src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1100&q=80',
			category: 'Landscape'
		},
		{
			title: 'Quiet coast',
			src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1100&q=80',
			category: 'Coast'
		},
		{
			title: 'Mountain night',
			src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1100&q=80',
			category: 'Landscape'
		},
		{
			title: 'Alpine morning',
			src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1100&q=80',
			category: 'Landscape'
		},
		{
			title: 'A place to pause',
			src: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1100&q=80',
			category: 'Architecture'
		},
		{
			title: 'Northern reflections',
			src: 'https://images.unsplash.com/photo-1477322524744-0eece9e79640?auto=format&fit=crop&w=1100&q=80',
			category: 'Coast'
		}
	];
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Architecture / Residential
		</p>
		<Heading size="h2" weight="bold">A place to pause.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			A small residence with a generous relationship to its surroundings.
		</p>
	</header>
	<Carousel
		items={photos.filter(
			(photo) => photo.category === 'Architecture' || photo.category === 'Landscape'
		)}
		layout={1}
		navigationButton={{ color: 'neutral' }}
		pagination={{ variant: 'dots', color: 'primary' }}
		>{#snippet children({ item: photo })}<img
				src={photo.src}
				alt={photo.title}
				loading="lazy"
				class="aspect-[16/7] w-full rounded-lg object-cover"
			/>{/snippet}</Carousel
	>
	<div class="gap-xl grid md:grid-cols-[1fr_2fr]">
		<dl class="gap-xl grid grid-cols-2 text-sm">
			<div>
				<dt class="text-neutral/65">Area</dt>
				<dd>180 m²</dd>
			</div>
			<div>
				<dt class="text-neutral/65">Completed</dt>
				<dd>2026</dd>
			</div>
			<div>
				<dt class="text-neutral/65">Studio</dt>
				<dd>Field Architecture</dd>
			</div>
			<div>
				<dt class="text-neutral/65">Approach</dt>
				<dd>Adaptive reuse</dd>
			</div>
		</dl>
		<div class="gap-xl flex flex-col">
			<Heading size="h3">A dialogue with the landscape.</Heading>
			<p class="text-neutral/65 leading-relaxed">
				The project makes the most of what was already there. Existing walls frame new views,
				natural materials meet simple details, and every room finds a different quality of light.
			</p>
		</div>
	</div>
</section>
