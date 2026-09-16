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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Out of office
		</p>
		<Heading size="h2" weight="bold">Follow the light.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			A visual field notebook. Move through the collection at your own pace.
		</p>
	</header>
	<Carousel
		items={photos}
		layout={1}
		navigationButton={{ color: 'neutral' }}
		pagination={{ variant: 'dots', color: 'primary' }}
		>{#snippet children({ item: photo, index })}<figure class="gap-xl flex flex-col">
				<img
					src={photo.src}
					alt={photo.title}
					loading="lazy"
					class="aspect-video w-full rounded-lg object-cover"
				/>
				<figcaption class="gap-lg flex items-center justify-between">
					<div>
						<h3 class="text-xl font-medium">{photo.title}</h3>
						<p class="mt-sm text-neutral/65 text-sm">{photo.category} / Field collection</p>
					</div>
					<Chip variant="outline" color="neutral">{index + 1} / {photos.length}</Chip>
				</figcaption>
			</figure>{/snippet}</Carousel
	>
</section>
