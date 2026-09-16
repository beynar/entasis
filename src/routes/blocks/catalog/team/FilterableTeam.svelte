<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Tabbar } from 'svelai/tabbar';
	import { TextInput } from 'svelai/text-input';
	let query = $state<string | null>('');
	let active = $state('Everyone');
	const departments = ['Everyone', 'Design', 'Engineering', 'Research'];
	const people = [
		{ name: 'Maya Chen', role: 'Product designer', department: 'Design', city: 'Paris' },
		{ name: 'Theo Park', role: 'Frontend engineer', department: 'Engineering', city: 'Copenhagen' },
		{ name: 'Nora Ellis', role: 'User researcher', department: 'Research', city: 'Toronto' },
		{ name: 'Ari Costa', role: 'Design director', department: 'Design', city: 'Lisbon' },
		{ name: 'Jules Bernard', role: 'Platform engineer', department: 'Engineering', city: 'Lyon' },
		{ name: 'Sam Rivera', role: 'Product researcher', department: 'Research', city: 'Barcelona' }
	];
	const filtered = $derived(
		people.filter(
			(person) =>
				(active === 'Everyone' || person.department === active) &&
				`${person.name} ${person.role}`.toLowerCase().includes((query ?? '').toLowerCase())
		)
	);
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="gap-lg flex flex-wrap items-end justify-between">
		<Heading as="h2" size="h2" weight="bold">Meet the people making it happen.</Heading><TextInput
			label="Search the team"
			placeholder="Name or role"
			bind:value={query}
		/>
	</div>
	<Tabbar items={departments} bind:value={active} />
	<div class="gap-lg grid sm:grid-cols-2 lg:grid-cols-3">
		{#each filtered as person (person.name)}<Card variant="outline"
				><Stack gap="lg"
					><Avatar size="large" name={person.name} /><Heading as="h3" size="h4"
						>{person.name}</Heading
					>
					<p class="text-neutral/70 text-sm">{person.role}</p>
					<div class="gap-sm flex items-center justify-between">
						<Chip size="small" variant="soft">{person.department}</Chip><span
							class="text-neutral/65 text-xs">{person.city}</span
						>
					</div></Stack
				></Card
			>{/each}
	</div>
	{#if filtered.length === 0}<Card variant="soft"
			><Stack gap="lg"
				><Heading as="h3" size="h4">No teammates match that search.</Heading>
				<p class="text-neutral/70">Try a different name or choose another department.</p>
				<Button
					variant="outline"
					class="self-start"
					onclick={() => {
						query = '';
						active = 'Everyone';
					}}>Clear filters</Button
				></Stack
			></Card
		>{/if}
</section>
