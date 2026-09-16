<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Meter } from 'svelai/meter';
	import { Stat } from 'svelai/stat';
	import { Tabbar } from 'svelai/tabbar';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	const tabs = ['Plan the work', 'Follow progress', 'Bring people in'];
	let active = $state(tabs[0]);
	const activeIndex = $derived(Math.max(0, tabs.indexOf(active)));
	const descriptions = [
		'Make the next step visible without losing sight of the bigger outcome.',
		'Keep the useful signals close, so the team knows when to stay the course and when to adjust.',
		'Bring the right people into the work with the context they need to contribute.'
	];
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<Heading as="h2" size="h2" weight="bold">The right view for the work ahead.</Heading>
	<div class="gap-xl grid md:grid-cols-3">
		<div class="gap-xl flex flex-col">
			<Tabbar items={tabs} bind:value={active} orientation="vertical" />
			<p class="text-neutral/70">{descriptions[activeIndex]}</p>
			<Button href="/blocks" variant="link" class="self-start" suffix={arrowRightIcon}
				>Explore the patterns</Button
			>
		</div>
		<Card
			class="min-h-80 md:col-span-2"
			variant="outline"
			title={['Project plan', 'Sprint overview', 'The project team'][activeIndex]}
			><Stack gap="lg"
				>{#if active === 'Plan the work'}<div class="gap-md grid sm:grid-cols-3">
						{#each ['Explore', 'Make', 'Refine'] as column, index (column)}<div
								class="gap-md bg-surface-recessed p-lg flex flex-col rounded-lg"
							>
								<Chip size="small" variant="outline">{column}</Chip>
								<p class="bg-surface p-md rounded-lg text-sm">
									{['Interview five customers', 'Build the core workflow', 'Review the details'][
										index
									]}
								</p>
							</div>{/each}
					</div>{:else if active === 'Follow progress'}<div class="gap-lg grid sm:grid-cols-2">
						<Stat label="Completed" value="18 / 24" trend="A steady week" variant="ghost" /><Stat
							label="Next review"
							value="Friday"
							description="10:00 · Team session"
							variant="ghost"
						/>
					</div>
					<Meter label="Sprint complete" value={75} color="success" />{:else}<div
						class="gap-lg flex flex-col"
					>
						{#each [{ name: 'Maya Chen', role: 'Product design' }, { name: 'Theo Park', role: 'Engineering' }, { name: 'Nora Ellis', role: 'Research' }] as person (person.name)}<div
								class="gap-lg flex items-center"
							>
								<Avatar name={person.name} />
								<div class="flex-1">
									<strong>{person.name}</strong>
									<p class="text-neutral/70 text-sm">{person.role}</p>
								</div>
								<Chip size="small" variant="soft">Member</Chip>
							</div>{/each}
					</div>{/if}</Stack
			></Card
		>
	</div>
</section>
