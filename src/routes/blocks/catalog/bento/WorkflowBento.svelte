<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { AvatarGroup } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { Meter } from 'entasis/meter';
	import { Stat } from 'entasis/stat';
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="max-w-xl">
		<Heading as="h2" size="h2" weight="bold">From the first brief to the final detail.</Heading>
		<p class="mt-lg text-neutral/70">Give every part of the project a clear home.</p>
	</div>
	<div class="gap-lg grid md:grid-cols-2">
		<Card title="A clear path forward" description="Turn a big idea into small, useful steps."
			><div class="gap-sm flex flex-col">
				{#each ['Write the brief', 'Explore directions', 'Review the prototype'] as task, index (task)}<div
						class="gap-md bg-surface-recessed p-md flex items-center rounded-lg"
					>
						<Chip size="small" color={index < 2 ? 'success' : 'primary'}
							>{index < 2 ? 'Done' : 'Next'}</Chip
						><span>{task}</span>
					</div>{/each}
			</div></Card
		>
		<Card title="Room in the budget" description="Know where you stand before you commit."
			><Stack gap="lg"
				><Stat label="Available this month" value="$8,420" variant="ghost" /><Meter
					label="Budget allocated"
					value={64}
					color="primary"
				/>
				<p class="text-neutral/70 text-sm">$15,000 of $23,420 allocated</p></Stack
			></Card
		>
		<Card title="The right rhythm" variant="soft" color="primary"
			><Stack gap="lg"
				><div class="gap-sm grid grid-cols-5">
					{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as day, index (day)}<div
							class="gap-md bg-surface px-xs py-md flex min-w-0 flex-col items-center rounded-lg"
						>
							<span class="text-neutral/70 text-xs">{day}</span><strong class="text-2xl"
								>{14 + index}</strong
							><span
								class={index === 2
									? 'bg-primary size-2 rounded-full'
									: 'bg-neutral-muted size-2 rounded-full'}
							></span>
						</div>{/each}
				</div>
				<p>Build a schedule that leaves space for the work.</p></Stack
			></Card
		>
		<Card title="One team, every discipline" variant="outline"
			><Stack gap="lg"
				><AvatarGroup
					size="large"
					items={[
						{ name: 'Maya Chen' },
						{ name: 'Theo Park' },
						{ name: 'Nora Ellis' },
						{ name: 'Jules Bernard' }
					]}
				/>
				<p class="text-neutral/70">
					Bring the right perspective into the room, wherever that room happens to be.
				</p></Stack
			></Card
		>
	</div>
</section>
