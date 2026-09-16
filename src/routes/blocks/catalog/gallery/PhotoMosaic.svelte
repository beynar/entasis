<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { ImageZoom } from 'svelai/image-zoom';
	import { Chip } from 'svelai/chip';
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
			Light / Form / Place
		</p>
		<Heading size="h2" weight="bold">A different point of view.</Heading>
	</header>
	<div class="gap-lg grid sm:grid-cols-3">
		{#each photos.slice(0, 5) as photo, i (photo.title)}<figure
				class={i === 0 ? 'relative sm:col-span-2 sm:row-span-2' : 'relative'}
			>
				<ImageZoom class="block w-full"
					><img
						src={photo.src}
						alt={photo.title}
						loading="lazy"
						class="aspect-square w-full rounded-lg object-cover"
					/></ImageZoom
				>
				<figcaption class="bottom-lg left-lg pointer-events-none absolute">
					<Chip size="small" color="neutral" variant="solid">{photo.title}</Chip>
				</figcaption>
			</figure>{/each}
	</div>
</section>
