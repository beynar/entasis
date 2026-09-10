<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { AvatarGroup } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Meter } from 'svelai/meter';
	import { Stat } from 'svelai/stat';
	import { Tabbar } from 'svelai/tabbar';
	let active = $state(0);
</script>

<section class="flex flex-col items-center gap-xl overflow-hidden p-lg md:p-xl">
	<Chip variant="outline">One place for the work that matters</Chip><Heading
		as="h2"
		size="h1"
		weight="bold"
		align="center"
		class="max-w-3xl">A little more clarity.<br />A lot more possibility.</Heading
	>
	<p class="max-w-xl text-center text-lg text-neutral/70">
		Bring your projects, people, and progress into one thoughtful workspace.
	</p>
	<div class="flex flex-wrap justify-center gap-md">
		<Button href="/components" size="large">Start building</Button><Button
			href="/docs"
			size="large"
			variant="outline">See how it works</Button
		>
	</div>
	<Card class="w-full max-w-5xl" variant="outline"
		><Stack gap="xl"
			><div class="flex flex-wrap items-center justify-between gap-lg">
				<strong>Northstar workspace</strong><AvatarGroup
					size="small"
					items={[{ name: 'Maya Chen' }, { name: 'Theo Park' }, { name: 'Nora Ellis' }]}
				/>
			</div>
			<Tabbar items={['Overview', 'Projects', 'Team']} bind:value={active} />{#if active === 0}<div
					class="grid gap-md sm:grid-cols-3"
				>
					<Stat label="Active projects" value="12" /><Stat
						label="Completed this week"
						value="28"
					/><Stat label="Team members" value="16" />
				</div>
				<Meter
					label="Quarterly goals"
					value={{ value: 72, color: 'primary' }}
				/>{:else if active === 1}<div class="grid gap-md sm:grid-cols-3">
					{#each ['Website refresh', 'Customer portal', 'Design system'] as project, index (project)}<Card
							variant="soft"
							title={project}
							><Stack gap="xl"
								><Chip class="self-start" size="small" color={index === 1 ? 'success' : 'primary'}
									>{index === 1 ? 'In review' : 'In progress'}</Chip
								><Meter value={{ value: [60, 90, 45][index], color: 'primary' }} /></Stack
							></Card
						>{/each}
				</div>{:else}<div class="grid gap-lg sm:grid-cols-3">
					{#each ['Maya Chen', 'Theo Park', 'Nora Ellis'] as name (name)}<div
							class="flex items-center gap-md rounded-lg bg-surface-recessed p-lg"
						>
							<Avatar user={{ name }} /><strong class="text-sm">{name}</strong>
						</div>{/each}
				</div>{/if}</Stack
		></Card
	>
</section>
