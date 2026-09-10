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

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="grid gap-xl md:grid-cols-[15rem_1fr]">
		<aside class="flex flex-col gap-xl md:sticky md:top-xl md:self-start">
			<Avatar size="large" user={{ name: 'Maya Chen' }} /><Heading size="h3"
				>Maya’s fieldnotes</Heading
			><Chip class="w-fit" variant="soft">Featured creator</Chip>
			<p class="text-neutral/65">
				A photographer collecting quiet moments, changing light, and reasons to take the long way
				home.
			</p>
			<p class="text-sm text-neutral/50">12 collections · Paris, France</p>
			<Button href="/docs" variant="outline">Explore the stories ↗</Button>
		</aside>
		<div class="grid gap-lg sm:grid-cols-2">
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
