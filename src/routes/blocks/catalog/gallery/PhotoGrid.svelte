<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { ImageZoom } from 'entasis/image-zoom';
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
			Collected moments
		</p>
		<Heading size="h2" weight="bold">The places between.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			A small collection of landscapes, light, and places to pause.
		</p>
	</header>
	<div class="gap-xl grid sm:grid-cols-2 lg:grid-cols-3">
		{#each photos as photo, i (photo.title)}<figure class="gap-lg flex flex-col">
				<ImageZoom
					><img
						src={photo.src}
						alt={photo.title}
						loading="lazy"
						class="aspect-[4/5] w-full rounded-lg object-cover"
					/></ImageZoom
				>
				<figcaption class="gap-md flex justify-between text-sm">
					<span>{photo.title}</span><span class="text-neutral/65">0{i + 1}</span>
				</figcaption>
			</figure>{/each}
	</div>
</section>
