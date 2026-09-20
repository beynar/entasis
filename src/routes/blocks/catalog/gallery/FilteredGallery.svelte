<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Tabbar } from 'entasis/tabbar';
	import { ImageZoom } from 'entasis/image-zoom';
	import { Chip } from 'entasis/chip';
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
	let category = $state('All');
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Image library
		</p>
		<Heading size="h2" weight="bold">Places, carefully collected.</Heading>
	</header>
	<Tabbar items={['All', 'Landscape', 'Coast', 'Architecture']} bind:value={category} />
	<div class="gap-xl grid sm:grid-cols-2 lg:grid-cols-3">
		{#each photos.filter((photo) => category === 'All' || photo.category === category) as photo (photo.title)}<figure
				class="gap-lg flex flex-col"
			>
				<ImageZoom
					><img
						src={photo.src}
						alt={photo.title}
						loading="lazy"
						class="aspect-square w-full rounded-lg object-cover"
					/></ImageZoom
				>
				<figcaption class="gap-md flex items-center justify-between">
					<h3 class="font-medium">{photo.title}</h3>
					<Chip size="small" variant="soft" color="neutral">{photo.category}</Chip>
				</figcaption>
			</figure>{/each}
	</div>
</section>
