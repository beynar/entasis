<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Meter } from 'svelai/meter';
	import { Select } from 'svelai/select';

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

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Card title="A team moving forward" description="Weekly contributions toward our shared goals."
		><Stack gap="lg">
			<div class="flex flex-wrap items-center justify-between gap-md">
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
					class="border-b border-neutral-muted pb-lg"
				>
					<div class="flex flex-wrap items-center justify-between gap-md">
						<div class="flex items-center gap-md">
							<span class="w-6 text-sm font-semibold text-neutral/50">{index + 1}</span><Avatar
								user={{ name: member.name }}
							/>
							<div>
								<strong class="text-sm">{member.name}</strong>
								<p class="text-xs text-neutral/60">{member.team}</p>
							</div>
						</div>
						<strong class="tabular-nums">{member.score} pts</strong>
					</div>
					<Meter
						value={{ value: member.score, color: index === 0 ? 'primary' : 'neutral' }}
						max={period === 'week' ? 100 : 400}
					/>
				</Stack>{/each}
		</Stack></Card
	>
</Stack>
