<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
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
	<div class="gap-xl grid md:grid-cols-[15rem_1fr]">
		<aside class="gap-xl md:top-xl flex flex-col md:sticky md:self-start">
			<Avatar size="large" name="Maya Chen" /><Heading size="h3">Maya’s fieldnotes</Heading><Chip
				class="w-fit"
				variant="soft">Featured creator</Chip
			>
			<p class="text-neutral/65">
				A photographer collecting quiet moments, changing light, and reasons to take the long way
				home.
			</p>
			<p class="text-neutral/65 text-sm">12 collections · Paris, France</p>
			<Button href="/docs" variant="outline">Explore the stories ↗</Button>
		</aside>
		<div class="gap-lg grid sm:grid-cols-2">
			{#each photos.slice(0, 4) as photo (photo.title)}<ImageZoom
					><img
						src={photo.src}
						alt={photo.title}
						loading="lazy"
						class="aspect-square w-full rounded-lg object-cover"
					/></ImageZoom
				>{/each}
		</div>
	</div>
</section>
