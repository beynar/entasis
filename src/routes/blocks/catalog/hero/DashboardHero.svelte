<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Avatar } from 'entasis/avatar';
	import { AvatarGroup } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { Meter } from 'entasis/meter';
	import { Stat } from 'entasis/stat';
	import { Tabbar } from 'entasis/tabbar';
	let active = $state('Overview');
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col items-center overflow-hidden">
	<Chip variant="outline">One place for the work that matters</Chip><Heading
		as="h2"
		size="h1"
		weight="bold"
		align="center"
		class="max-w-3xl">A little more clarity.<br />A lot more possibility.</Heading
	>
	<p class="text-neutral/70 max-w-xl text-center text-lg">
		Bring your projects, people, and progress into one thoughtful workspace.
	</p>
	<div class="gap-md flex flex-wrap justify-center">
		<Button href="/components" size="large">Start building</Button><Button
			href="/docs"
			size="large"
			variant="outline">See how it works</Button
		>
	</div>
	<Card class="w-full max-w-5xl" variant="outline"
		><Stack gap="xl"
			><div class="gap-lg flex flex-wrap items-center justify-between">
				<strong>Northstar workspace</strong><AvatarGroup
					size="small"
					items={[{ name: 'Maya Chen' }, { name: 'Theo Park' }, { name: 'Nora Ellis' }]}
				/>
			</div>
			<Tabbar
				items={['Overview', 'Projects', 'Team']}
				bind:value={active}
			/>{#if active === 'Overview'}<div class="gap-md grid sm:grid-cols-3">
					<Stat label="Active projects" value="12" /><Stat
						label="Completed this week"
						value="28"
					/><Stat label="Team members" value="16" />
				</div>
				<Meter
					label="Quarterly goals"
					value={72}
					color="primary"
				/>{:else if active === 'Projects'}<div class="gap-md grid sm:grid-cols-3">
					{#each ['Website refresh', 'Customer portal', 'Design system'] as project, index (project)}<Card
							variant="soft"
							title={project}
							><Stack gap="xl"
								><Chip class="self-start" size="small" color={index === 1 ? 'success' : 'primary'}
									>{index === 1 ? 'In review' : 'In progress'}</Chip
								><Meter value={[60, 90, 45][index]} color="primary" /></Stack
							></Card
						>{/each}
				</div>{:else}<div class="gap-lg grid sm:grid-cols-3">
					{#each ['Maya Chen', 'Theo Park', 'Nora Ellis'] as name (name)}<div
							class="gap-md bg-surface-recessed p-lg flex items-center rounded-lg"
						>
							<Avatar {name} /><strong class="text-sm">{name}</strong>
						</div>{/each}
				</div>{/if}</Stack
		></Card
	>
</section>
