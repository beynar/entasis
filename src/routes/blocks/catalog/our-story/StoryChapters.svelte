<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Tabs } from 'entasis/tabs';
	import { Chip } from 'entasis/chip';
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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">Our story</p>
		<Heading size="h2" weight="bold">A few chapters. One simple idea.</Heading>
	</header>
	<Tabs items={chapters}
		>{#snippet children({ item: chapter, index })}<div class="gap-xl py-xl grid md:grid-cols-2">
				<img
					src={photos[index].src}
					alt={photos[index].title}
					loading="lazy"
					class="aspect-[4/3] w-full rounded-lg object-cover"
				/>
				<div class="gap-xl flex flex-col justify-center">
					<Chip class="w-fit" variant="soft">{chapter.tag}</Chip><Heading size="h3"
						>{chapter.title}</Heading
					>
					<p class="text-neutral/65 text-lg leading-relaxed">{chapter.body}</p>
				</div>
			</div>{/snippet}</Tabs
	>
</section>
