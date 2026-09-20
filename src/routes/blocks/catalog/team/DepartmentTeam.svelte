<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Avatar } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	const people = [
		{ name: 'Maya Chen', role: 'Product designer', department: 'Design', city: 'Paris' },
		{ name: 'Theo Park', role: 'Frontend engineer', department: 'Engineering', city: 'Copenhagen' },
		{ name: 'Nora Ellis', role: 'User researcher', department: 'Research', city: 'Toronto' },
		{ name: 'Ari Costa', role: 'Design director', department: 'Design', city: 'Lisbon' },
		{ name: 'Jules Bernard', role: 'Platform engineer', department: 'Engineering', city: 'Lyon' },
		{ name: 'Sam Rivera', role: 'Product researcher', department: 'Research', city: 'Barcelona' }
	];
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-6xl flex-col">
	<div class="gap-lg flex flex-wrap items-end justify-between">
		<div>
			<Chip variant="soft">One team</Chip><Heading as="h2" size="h2" weight="bold" class="mt-xl"
				>The right people, close to the work.</Heading
			>
		</div>
		<p class="text-neutral/70 max-w-sm text-sm">
			A connected mix of designers, engineers, and curious minds.
		</p>
	</div>
	<div class="gap-md grid sm:grid-cols-2 lg:grid-cols-3">
		{#each people as person (person.name)}<Card variant="outline" density="compact"
				><Stack gap="lg"
					><div class="gap-lg flex items-center">
						<Avatar name={person.name} />
						<div class="min-w-0 flex-1">
							<Heading as="h3" size="h5">{person.name}</Heading>
							<p class="mt-sm text-neutral/70 text-xs">{person.role}</p>
						</div>
					</div>
					<div class="gap-md flex items-center justify-between">
						<Chip
							size="small"
							variant="soft"
							color={person.department === 'Design'
								? 'primary'
								: person.department === 'Engineering'
									? 'secondary'
									: 'neutral'}>{person.department}</Chip
						><span class="text-neutral/65 text-xs">{person.city}</span>
					</div></Stack
				></Card
			>{/each}
	</div>
</section>
