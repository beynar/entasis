<script lang="ts">
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	const people = [
		{
			name: 'Maya Chen',
			role: 'Product design',
			bio: 'Finds the simplest path through a complicated problem.',
			location: 'Paris'
		},
		{
			name: 'Theo Park',
			role: 'Engineering',
			bio: 'Cares about the details that make a product dependable.',
			location: 'Copenhagen'
		},
		{
			name: 'Nora Ellis',
			role: 'Research',
			bio: 'Asks the question that opens up a better direction.',
			location: 'Toronto'
		},
		{
			name: 'Ari Costa',
			role: 'Product strategy',
			bio: 'Connects a promising idea to a practical next step.',
			location: 'Lisbon'
		}
	];
</script>

<section class="flex flex-col gap-xl p-lg md:p-xl">
	<div class="mx-auto max-w-2xl text-center">
		<Chip variant="outline">The people behind the work</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Different perspectives. Shared care.</Heading
		>
		<p class="mt-lg text-neutral/70">
			A small example team, brought together by a love of making useful things.
		</p>
	</div>
	<div class="grid gap-xl sm:grid-cols-2 lg:grid-cols-4">
		{#each people as person (person.name)}<div
				class="flex flex-col items-center gap-lg text-center"
			>
				<div class="flex size-32 items-center justify-center rounded-full bg-primary-muted">
					<Avatar size="large" user={person} />
				</div>
				<div>
					<Heading as="h3" size="h4">{person.name}</Heading>
					<p class="mt-sm text-sm text-primary">{person.role}</p>
				</div>
				<p class="text-sm text-neutral/60">{person.bio}</p>
				<Chip size="small" variant="outline">{person.location}</Chip>
			</div>{/each}
	</div>
	<Button href="/docs" variant="outline" class="self-center">Explore how we work</Button>
</section>
