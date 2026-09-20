<script lang="ts">
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { Separator } from 'entasis/separator';
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-5xl flex-col">
	<Chip class="self-start" variant="outline">Product strategy</Chip><Heading
		as="h2"
		size="h1"
		weight="bold">A clear direction for a meaningful next step.</Heading
	>
	<p class="text-neutral/70 max-w-3xl text-xl">
		We help teams turn a promising idea into a shared point of view, with enough evidence to act.
	</p>
	<Separator />
	<div class="gap-xl grid md:grid-cols-3">
		<Heading as="h3" size="h4">Start with the right question.</Heading>
		<div class="gap-lg flex flex-col md:col-span-2">
			<p class="text-neutral/70">
				A product strategy connects the problem worth solving to the people who feel it. It makes
				the choices visible, including the work that can wait.
			</p>
			<p class="text-neutral/70">
				We work closely with your team to understand the current experience, test the assumptions
				that matter, and shape a direction that can guide real decisions.
			</p>
		</div>
	</div>
	<Card variant="soft" color="primary" title="What you leave with"
		><div class="gap-lg grid sm:grid-cols-3">
			<div>
				<strong>A shared brief</strong>
				<p class="mt-sm text-sm">One clear problem and a useful outcome.</p>
			</div>
			<div>
				<strong>A point of view</strong>
				<p class="mt-sm text-sm">The evidence behind the chosen direction.</p>
			</div>
			<div>
				<strong>A practical next step</strong>
				<p class="mt-sm text-sm">A focused plan to make the idea tangible.</p>
			</div>
		</div></Card
	><Button href="/docs" variant="outline" class="self-start">Explore the approach</Button>
</section>
