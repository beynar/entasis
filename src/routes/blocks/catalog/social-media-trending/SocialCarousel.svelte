<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Carousel } from 'entasis/carousel';
	import { Avatar } from 'entasis/avatar';
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
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			From the community
		</p>
		<Heading size="h2" weight="bold">Good places. Good company.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			A collection of moments shared by the Fieldnotes community.
		</p>
	</header>
	<Carousel
		items={photos}
		layout={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
		navigationButton={{ color: 'neutral' }}
		>{#snippet children({ item: photo, index })}<article class="gap-lg flex flex-col">
				<img
					src={photo.src}
					alt={photo.title}
					loading="lazy"
					class="aspect-[3/4] w-full rounded-lg object-cover"
				/>
				<div class="gap-md flex items-center justify-between">
					<div class="gap-md flex items-center">
						<Avatar
							size="small"
							name={['Maya Chen', 'Sam Rivera', 'Alex Morgan'][index % 3]}
						/><span class="text-sm"
							>@{['mayainframes', 'samoutside', 'alexwanders'][index % 3]}</span
						>
					</div>
					<Chip size="small" variant="soft" color="neutral">{photo.category}</Chip>
				</div>
			</article>{/snippet}</Carousel
	>
</section>
