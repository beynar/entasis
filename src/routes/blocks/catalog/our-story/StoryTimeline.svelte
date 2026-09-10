<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Timeline } from 'svelai/timeline';
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
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="grid gap-xl md:grid-cols-[1fr_2fr]">
		<div class="flex flex-col gap-xl md:sticky md:top-xl md:self-start">
			<header class="flex flex-col gap-lg">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary">Since 2016</p>
				<Heading size="h2" weight="bold">Built slowly.<br />Made to last.</Heading>
				<p class="max-w-2xl text-neutral/65">
					A decade of learning what makes an object useful, beautiful, and worth keeping.
				</p>
			</header>
			<img
				src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
				alt="A place to pause"
				loading="lazy"
				class="aspect-[4/3] w-full rounded-lg object-cover"
			/>
		</div>
		<Timeline
			items={chapters.map((chapter) => ({
				id: chapter.label,
				title: chapter.title,
				date: chapter.label,
				description: chapter.body
			}))}
			variant="card"
			density="large"
			color="primary"
		/>
	</div>
</section>
