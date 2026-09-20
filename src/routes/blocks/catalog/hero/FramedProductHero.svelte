<script lang="ts">
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Heading } from 'entasis/heading';
	import { Meter } from 'entasis/meter';
	import { Stat } from 'entasis/stat';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="gap-xl grid items-end md:grid-cols-3">
		<Heading as="h2" size="h1" weight="bold" class="md:col-span-2"
			>Make space for<br />your best work.</Heading
		>
		<div class="gap-lg flex flex-col items-start">
			<p class="text-neutral/70">
				One shared workspace for the plans, people, and details that move a project forward.
			</p>
			<Button href="/blocks" suffix={arrowRightIcon}>Explore the possibilities</Button>
		</div>
	</div>
	<div class="border-neutral-muted bg-surface-recessed p-md rounded-2xl border">
		<Card title="The next chapter" description="Quarterly planning · Product team"
			><div class="gap-lg grid md:grid-cols-3">
				<div class="gap-md flex flex-col md:col-span-2">
					<Heading as="h3" size="h4">The work, with a little perspective.</Heading>
					<p class="text-neutral/70">Connect the next small step to the outcome it helps create.</p>
					<Meter label="Quarterly progress" value={68} color="primary" />
				</div>
				<Stat
					label="Shared outcomes"
					value="8"
					description="A focused quarter ahead"
					variant="outline"
				/>
			</div></Card
		>
	</div>
	<div class="gap-lg border-neutral-muted pt-xl grid border-t md:grid-cols-3">
		{#each [{ title: 'Plan with intention', text: 'Start with a clear, shared outcome.' }, { title: 'Keep the context', text: 'Bring decisions closer to the work.' }, { title: 'Build momentum', text: 'Make the next step easy to see.' }] as feature, index (feature.title)}<div
				class="gap-lg flex"
			>
				<span class="text-primary-readable text-sm">0{index + 1}</span>
				<div>
					<Heading as="h3" size="h5">{feature.title}</Heading>
					<p class="mt-sm text-neutral/70 text-sm">{feature.text}</p>
				</div>
			</div>{/each}
	</div>
</section>
