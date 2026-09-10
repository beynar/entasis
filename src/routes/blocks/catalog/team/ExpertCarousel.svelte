<script lang="ts">
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Carousel } from 'svelai/carousel';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	const people = [
		{
			name: 'Maya Chen',
			role: 'Product design',
			experience: '12 years',
			bio: 'Turning complex workflows into interfaces that feel quietly obvious.',
			focus: 'Focus · Research-led product design'
		},
		{
			name: 'Theo Park',
			role: 'Engineering',
			experience: '10 years',
			bio: 'Building the systems that let a team move quickly without losing care.',
			focus: 'Focus · Interface architecture'
		},
		{
			name: 'Nora Ellis',
			role: 'Research',
			experience: '8 years',
			bio: 'Finding the useful question and listening closely to what follows.',
			focus: 'Focus · Customer understanding'
		},
		{
			name: 'Ari Costa',
			role: 'Strategy',
			experience: '14 years',
			bio: 'Helping teams agree on a direction they can actually put to work.',
			focus: 'Focus · Product positioning'
		}
	];
</script>

<section class="flex flex-col gap-xl overflow-hidden p-lg md:p-xl">
	<div class="flex flex-wrap items-end justify-between gap-lg">
		<div class="max-w-xl">
			<Chip variant="outline">Meet your collaborators</Chip><Heading
				as="h2"
				size="h2"
				weight="bold"
				class="mt-xl">A little experience. A lot of curiosity.</Heading
			>
		</div>
		<Button href="/docs" variant="outline">Explore our approach</Button>
	</div>
	<Carousel
		items={people}
		layout={{ default: 1, md: 2, lg: 3 }}
		navigationButton={{ color: 'neutral' }}
		dots={{ color: 'primary' }}
		>{#snippet children({ item })}<Card variant="outline"
				><div class="flex min-h-80 flex-col gap-xl">
					<div class="flex items-start justify-between gap-lg">
						<Avatar size="large" user={item} /><Chip size="small" variant="outline"
							>{item.experience}</Chip
						>
					</div>
					<div>
						<Heading as="h3" size="h3">{item.name}</Heading>
						<p class="mt-md text-sm text-primary">{item.role}</p>
					</div>
					<p class="flex-1 text-neutral/70">{item.bio}</p>
					<Separator />
					<p class="text-xs text-neutral/50">{item.focus}</p>
				</div></Card
			>{/snippet}</Carousel
	>
</section>
