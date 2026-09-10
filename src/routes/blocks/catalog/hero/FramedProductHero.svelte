<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Heading } from 'svelai/heading';
	import { Meter } from 'svelai/meter';
	import { Stat } from 'svelai/stat';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
</script>

<section class="flex flex-col gap-xl p-lg md:p-xl">
	<div class="grid items-end gap-xl md:grid-cols-3">
		<Heading as="h2" size="h1" weight="bold" class="md:col-span-2"
			>Make space for<br />your best work.</Heading
		>
		<div class="flex flex-col items-start gap-lg">
			<p class="text-neutral/70">
				One shared workspace for the plans, people, and details that move a project forward.
			</p>
			<Button href="/blocks" suffix={arrowRightIcon}>Explore the possibilities</Button>
		</div>
	</div>
	<div class="rounded-2xl border border-neutral-muted bg-surface-recessed p-md">
		<Card title="The next chapter" description="Quarterly planning · Product team"
			><div class="grid gap-lg md:grid-cols-3">
				<div class="flex flex-col gap-md md:col-span-2">
					<Heading as="h3" size="h4">The work, with a little perspective.</Heading>
					<p class="text-neutral/60">Connect the next small step to the outcome it helps create.</p>
					<Meter label="Quarterly progress" value={{ value: 68, color: 'primary' }} />
				</div>
				<Stat
					label="Shared outcomes"
					value="8"
					description="A focused quarter ahead"
					variant="soft"
					color="primary"
				/>
			</div></Card
		>
	</div>
	<div class="grid gap-lg border-t border-neutral-muted pt-xl md:grid-cols-3">
		{#each [{ title: 'Plan with intention', text: 'Start with a clear, shared outcome.' }, { title: 'Keep the context', text: 'Bring decisions closer to the work.' }, { title: 'Build momentum', text: 'Make the next step easy to see.' }] as feature, index (feature.title)}<div
				class="flex gap-lg"
			>
				<span class="text-sm text-primary">0{index + 1}</span>
				<div>
					<Heading as="h3" size="h5">{feature.title}</Heading>
					<p class="mt-sm text-sm text-neutral/60">{feature.text}</p>
				</div>
			</div>{/each}
	</div>
</section>
