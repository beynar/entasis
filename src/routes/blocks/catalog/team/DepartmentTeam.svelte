<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	const people = [
		{ name: 'Maya Chen', role: 'Product designer', department: 'Design', city: 'Paris' },
		{ name: 'Theo Park', role: 'Frontend engineer', department: 'Engineering', city: 'Copenhagen' },
		{ name: 'Nora Ellis', role: 'User researcher', department: 'Research', city: 'Toronto' },
		{ name: 'Ari Costa', role: 'Design director', department: 'Design', city: 'Lisbon' },
		{ name: 'Jules Bernard', role: 'Platform engineer', department: 'Engineering', city: 'Lyon' },
		{ name: 'Sam Rivera', role: 'Product researcher', department: 'Research', city: 'Barcelona' }
	];
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-xl p-lg md:p-xl">
	<div class="flex flex-wrap items-end justify-between gap-lg">
		<div>
			<Chip variant="soft">One team</Chip><Heading as="h2" size="h2" weight="bold" class="mt-xl"
				>The right people, close to the work.</Heading
			>
		</div>
		<p class="max-w-sm text-sm text-neutral/60">
			A connected mix of designers, engineers, and curious minds.
		</p>
	</div>
	<div class="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
		{#each people as person (person.name)}<Card variant="outline" density="small"
				><Stack gap="lg"
					><div class="flex items-center gap-lg">
						<Avatar user={person} />
						<div class="min-w-0 flex-1">
							<Heading as="h3" size="h5">{person.name}</Heading>
							<p class="mt-sm text-xs text-neutral/60">{person.role}</p>
						</div>
					</div>
					<div class="flex items-center justify-between gap-md">
						<Chip
							size="small"
							variant="soft"
							color={person.department === 'Design'
								? 'primary'
								: person.department === 'Engineering'
									? 'secondary'
									: 'neutral'}>{person.department}</Chip
						><span class="text-xs text-neutral/50">{person.city}</span>
					</div></Stack
				></Card
			>{/each}
	</div>
</section>
