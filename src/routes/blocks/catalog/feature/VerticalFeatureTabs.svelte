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
	let active = $state(0);
	const descriptions = [
		'Make the next step visible without losing sight of the bigger outcome.',
		'Keep the useful signals close, so the team knows when to stay the course and when to adjust.',
		'Bring the right people into the work with the context they need to contribute.'
	];
</script>

<section class="flex flex-col gap-xl p-lg md:p-xl">
	<Heading as="h2" size="h2" weight="bold">The right view for the work ahead.</Heading>
	<div class="grid gap-xl md:grid-cols-3">
		<div class="flex flex-col gap-xl">
			<Tabbar
				items={['Plan the work', 'Follow progress', 'Bring people in']}
				bind:value={active}
				orientation="vertical"
			/>
			<p class="text-neutral/70">{descriptions[active]}</p>
			<Button href="/blocks" variant="link" class="self-start" suffix={arrowRightIcon}
				>Explore the patterns</Button
			>
		</div>
		<Card
			class="md:col-span-2 min-h-80"
			variant="outline"
			title={['Project plan', 'Sprint overview', 'The project team'][active]}
			><Stack gap="lg"
				>{#if active === 0}<div class="grid gap-md sm:grid-cols-3">
						{#each ['Explore', 'Make', 'Refine'] as column, index (column)}<div
								class="flex flex-col gap-md rounded-lg bg-surface-recessed p-lg"
							>
								<Chip size="small" variant="outline">{column}</Chip>
								<p class="rounded-lg bg-surface p-md text-sm">
									{['Interview five customers', 'Build the core workflow', 'Review the details'][
										index
									]}
								</p>
							</div>{/each}
					</div>{:else if active === 1}<div class="grid gap-lg sm:grid-cols-2">
						<Stat label="Completed" value="18 / 24" trend="A steady week" variant="ghost" /><Stat
							label="Next review"
							value="Friday"
							description="10:00 · Team session"
							variant="ghost"
						/>
					</div>
					<Meter label="Sprint complete" value={{ value: 75, color: 'success' }} />{:else}<div
						class="flex flex-col gap-lg"
					>
						{#each [{ name: 'Maya Chen', role: 'Product design' }, { name: 'Theo Park', role: 'Engineering' }, { name: 'Nora Ellis', role: 'Research' }] as person (person.name)}<div
								class="flex items-center gap-lg"
							>
								<Avatar user={person} />
								<div class="flex-1">
									<strong>{person.name}</strong>
									<p class="text-sm text-neutral/60">{person.role}</p>
								</div>
								<Chip size="small" variant="soft">Member</Chip>
							</div>{/each}
					</div>{/if}</Stack
			></Card
		>
	</div>
</section>
