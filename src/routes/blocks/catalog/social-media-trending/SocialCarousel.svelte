<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Carousel } from 'svelai/carousel';
	import { Avatar } from 'svelai/avatar';
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
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">From the community</p>
		<Heading size="h2" weight="bold">Good places. Good company.</Heading>
		<p class="max-w-2xl text-neutral/65">
			A collection of moments shared by the Fieldnotes community.
		</p>
	</header>
	<Carousel
		items={photos}
		layout={{ default: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
		navigationButton={{ color: 'neutral' }}
		>{#snippet children({ item: photo, index })}<article class="flex flex-col gap-lg">
				<img
					src={photo.src}
					alt={photo.title}
					loading="lazy"
					class="aspect-[3/4] w-full rounded-lg object-cover"
				/>
				<div class="flex gap-md items-center justify-between">
					<div class="flex gap-md items-center">
						<Avatar
							size="small"
							user={{ name: ['Maya Chen', 'Sam Rivera', 'Alex Morgan'][index % 3] }}
						/><span class="text-sm"
							>@{['mayainframes', 'samoutside', 'alexwanders'][index % 3]}</span
						>
					</div>
					<Chip size="small" variant="soft" color="neutral">{photo.category}</Chip>
				</div>
			</article>{/snippet}</Carousel
	>
</section>
