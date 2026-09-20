<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Timeline } from 'entasis/timeline';
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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="gap-xl grid md:grid-cols-[1fr_2fr]">
		<div class="gap-xl md:top-xl flex flex-col md:sticky md:self-start">
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					Since 2016
				</p>
				<Heading size="h2" weight="bold">Built slowly.<br />Made to last.</Heading>
				<p class="text-neutral/65 max-w-2xl">
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
			density="comfortable"
			color="primary"
		/>
	</div>
</section>
