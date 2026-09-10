<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Carousel } from 'svelai/carousel';
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
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Out of office</p>
		<Heading size="h2" weight="bold">Follow the light.</Heading>
		<p class="max-w-2xl text-neutral/65">
			A visual field notebook. Move through the collection at your own pace.
		</p>
	</header>
	<Carousel
		items={photos}
		layout={{ default: 1 }}
		navigationButton={{ color: 'neutral' }}
		dots={{ color: 'primary' }}
		>{#snippet children({ item: photo, index })}<figure class="flex flex-col gap-xl">
				<img
					src={photo.src}
					alt={photo.title}
					loading="lazy"
					class="aspect-video w-full rounded-lg object-cover"
				/>
				<figcaption class="flex items-center justify-between gap-lg">
					<div>
						<h3 class="text-xl font-medium">{photo.title}</h3>
						<p class="mt-sm text-sm text-neutral/55">{photo.category} / Field collection</p>
					</div>
					<Chip variant="outline" color="neutral">{index + 1} / {photos.length}</Chip>
				</figcaption>
			</figure>{/snippet}</Carousel
	>
</section>
