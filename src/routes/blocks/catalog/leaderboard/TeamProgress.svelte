<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Avatar } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Meter } from 'entasis/meter';
	import { Select } from 'entasis/select';

	let period = $state<string | null>('week');
	const members = [
		{ name: 'Maya Chen', team: 'Design', week: 92, month: 328 },
		{ name: 'Sam Rivera', team: 'Engineering', week: 86, month: 374 },
		{ name: 'Alex Morgan', team: 'Product', week: 78, month: 296 },
		{ name: 'Jordan Lee', team: 'Research', week: 64, month: 282 }
	];
	let ranked = $derived(
		members
			.map((member) => ({ ...member, score: period === 'week' ? member.week : member.month }))
			.sort((a, b) => b.score - a.score)
	);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card title="A team moving forward" description="Weekly contributions toward our shared goals."
		><Stack gap="lg">
			<div class="gap-md flex flex-wrap items-center justify-between">
				<Chip color="primary">Top contributors</Chip><Select
					label="Period"
					bind:value={period}
					items={[
						{ value: 'week', label: 'This week' },
						{ value: 'month', label: 'This month' }
					]}
				/>
			</div>
			{#each ranked as member, index (member)}<Stack
					gap="md"
					class="border-neutral-muted pb-lg border-b"
				>
					<div class="gap-md flex flex-wrap items-center justify-between">
						<div class="gap-md flex items-center">
							<span class="text-neutral/65 w-6 text-sm font-semibold">{index + 1}</span><Avatar
								name={member.name}
							/>
							<div>
								<strong class="text-sm">{member.name}</strong>
								<p class="text-neutral/70 text-xs">{member.team}</p>
							</div>
						</div>
						<strong class="tabular-nums">{member.score} pts</strong>
					</div>
					<Meter
						value={member.score}
						color={index === 0 ? 'primary' : 'neutral'}
						max={period === 'week' ? 100 : 400}
					/>
				</Stack>{/each}
		</Stack></Card
	>
</Stack>
