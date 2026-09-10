<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Tabs } from 'svelai/tabs';
	import { Chip } from 'svelai/chip';
	const chapters = [
		{
			label: '2016',
			title: 'A table. A few tools. An idea.',
			body: 'We started by making the things we wanted to live with: useful, quiet objects that could earn their place in a home.',
			tag: 'The beginning'
		},
		{
			label: '2020',
			title: 'A workshop with an open door.',
			body: 'A shared space brought makers, designers, and curious neighbors together. The collection grew through those conversations.',
			tag: 'Finding our people'
		},
		{
			label: '2026',
			title: 'Still making room for good things.',
			body: 'Our team has grown, but the question remains the same: can we make something worth keeping?',
			tag: 'The next chapter'
		}
	];
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
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Our story</p>
		<Heading size="h2" weight="bold">A few chapters. One simple idea.</Heading>
	</header>
	<Tabs items={chapters}
		>{#snippet children({ item: chapter, index })}<div class="grid gap-xl py-xl md:grid-cols-2">
				<img
					src={photos[index].src}
					alt={photos[index].title}
					loading="lazy"
					class="aspect-[4/3] w-full rounded-lg object-cover"
				/>
				<div class="flex flex-col gap-xl justify-center">
					<Chip class="w-fit" variant="soft">{chapter.tag}</Chip><Heading size="h3"
						>{chapter.title}</Heading
					>
					<p class="text-lg leading-relaxed text-neutral/65">{chapter.body}</p>
				</div>
			</div>{/snippet}</Tabs
	>
</section>
