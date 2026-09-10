<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Table } from 'svelai/table';

	const leaders = [
		{ rank: 1, name: 'Maya Chen', team: 'Design', points: 2840 },
		{ rank: 2, name: 'Sam Rivera', team: 'Engineering', points: 2620 },
		{ rank: 3, name: 'Alex Morgan', team: 'Product', points: 2480 },
		{ rank: 4, name: 'Jordan Lee', team: 'Research', points: 2140 },
		{ rank: 5, name: 'Nina Patel', team: 'Engineering', points: 1980 }
	];
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header class="text-center">
		<Chip color="warning">The weekly leaderboard</Chip>
		<h2 class="mt-lg text-3xl font-semibold">A little friendly momentum.</h2>
		<p class="mt-sm text-sm text-neutral/60">Celebrate the people moving the team forward.</p>
	</header>
	<div class="grid items-end gap-lg sm:grid-cols-3">
		{#each [leaders[1], leaders[0], leaders[2]] as member (member)}{#if member}<Card
					variant={member.rank === 1 ? 'soft' : 'outline'}
					color={member.rank === 1 ? 'primary' : 'neutral'}
					><div class="grid justify-items-center gap-md py-lg text-center">
						<Chip color={member.rank === 1 ? 'warning' : 'neutral'}>#{member.rank}</Chip><Avatar
							user={{ name: member.name }}
							size="large"
						/>
						<h3 class="font-semibold">{member.name}</h3>
						<strong class={member.rank === 1 ? 'text-4xl' : 'text-3xl'}>{member.points}</strong>
						<p class="text-xs text-neutral/60">contribution points</p>
					</div></Card
				>{/if}{/each}
	</div>
	<Card title="This week’s standings"
		><Table
			header={{ rank: 'Rank', name: 'Contributor', team: 'Team', points: 'Points' }}
			items={leaders.map((member) => ({
				cells: {
					rank: '#' + member.rank,
					name: member.name,
					team: member.team,
					points: String(member.points)
				}
			}))}
		/></Card
	>
</Stack>
