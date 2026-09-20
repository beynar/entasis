<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Accordion } from 'entasis/accordion';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl md:grid-cols-3">
	<div class="gap-xl flex flex-col md:col-span-2">
		<Chip class="self-start" variant="outline">Interface design</Chip><Heading
			as="h2"
			size="h1"
			weight="bold">Make the useful feel effortless.</Heading
		>
		<p class="text-neutral/70 text-lg">
			A good interface carries the context, makes the choice clear, and gets out of the way at the
			right moment.
		</p>
		<Heading as="h3" size="h3">From the flow to the final detail</Heading>
		<p class="text-neutral/70">
			We shape the structure and interaction around the way people think about their work. Then we
			bring the same care to the type, spacing, states, and small transitions that make the whole
			experience feel coherent.
		</p>
		<Accordion
			items={[
				{
					id: 'structure',
					title: 'Structure and flow',
					content: 'A clear model for the pages, actions, and information the product needs.'
				},
				{
					id: 'system',
					title: 'Visual language',
					content: 'A considered set of type, color, geometry, and component decisions.'
				},
				{
					id: 'detail',
					title: 'Interaction detail',
					content:
						'The feedback, empty states, and transitions that help people move with confidence.'
				}
			]}
			icon="plus-minus"
		/>
	</div>
	<aside class="gap-lg flex flex-col">
		<Card variant="soft" color="primary" title="The engagement"
			><Stack gap="lg"
				><dl class="gap-md grid text-sm">
					<dt class="text-neutral/70">Typical focus</dt>
					<dd>One core product workflow</dd>
					<dt class="text-neutral/70">Working rhythm</dt>
					<dd>Weekly review sessions</dd>
					<dt class="text-neutral/70">Outputs</dt>
					<dd>Designs, prototype, and system notes</dd>
				</dl>
				<Button href="/blocks" variant="outline">See interface examples</Button></Stack
			></Card
		><Card variant="outline" title="Related expertise"
			><Stack gap="lg"
				><Button href="/docs" variant="link" suffix={arrowRightIcon}>Product foundations</Button
				><Button href="/components" variant="link" suffix={arrowRightIcon}>Component systems</Button
				></Stack
			></Card
		>
	</aside>
</section>
