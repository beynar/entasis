<script lang="ts">
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Heading } from 'entasis/heading';
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="gap-xl grid md:grid-cols-2">
		<Heading as="h2" size="h1" weight="bold">Less friction.<br />More possibility.</Heading>
		<p class="text-neutral/70 self-end text-lg">
			We believe a small team with the right tools can do extraordinary work. Our job is to put
			those tools within reach.
		</p>
	</div>
	<div class="gap-lg grid md:grid-cols-2">
		<Card color="primary" variant="soft" title="What drives us"
			><div class="gap-xl flex flex-col">
				<span class="text-6xl font-light">01</span><Heading as="h3" size="h3"
					>Clarity is a competitive advantage.</Heading
				>
				<p>
					Every feature starts with a real conversation. We remove what distracts and keep what
					helps a team move forward.
				</p>
			</div></Card
		>
		<Card variant="outline" title="How we work"
			><div class="gap-xl flex flex-col">
				<span class="text-6xl font-light">02</span><Heading as="h3" size="h3"
					>Care is in the details.</Heading
				>
				<p>
					Fast is useful. Thoughtful is lasting. We take the time to get the interactions right,
					from the first click to the final handoff.
				</p>
			</div></Card
		>
	</div>
	<Button href="/docs" variant="outline" class="self-start">Meet the principles</Button>
</section>
