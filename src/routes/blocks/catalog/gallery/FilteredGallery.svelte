<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Tabbar } from 'svelai/tabbar';
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
	let category = $state(0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Image library</p>
		<Heading size="h2" weight="bold">Places, carefully collected.</Heading>
	</header>
	<Tabbar items={['All', 'Landscape', 'Coast', 'Architecture']} bind:value={category} />
	<div class="grid gap-xl sm:grid-cols-2 lg:grid-cols-3">
		{#each photos.filter((photo) => category === 0 || photo.category === ['', 'Landscape', 'Coast', 'Architecture'][category]) as photo (photo.title)}<figure
				class="flex flex-col gap-lg"
			>
				<ImageZoom
					><img
						src={photo.src}
						alt={photo.title}
						loading="lazy"
						class="aspect-square w-full rounded-lg object-cover"
					/></ImageZoom
				>
				<figcaption class="flex items-center justify-between gap-md">
					<h3 class="font-medium">{photo.title}</h3>
					<Chip size="small" variant="soft" color="neutral">{photo.category}</Chip>
				</figcaption>
			</figure>{/each}
	</div>
</section>
