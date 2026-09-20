<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { keyIcon } from 'entasis/icons/key';
	import { listChecksIcon } from 'entasis/icons/listChecks';
	import { shieldCheckIcon } from 'entasis/icons/shieldCheck';
	const practices = [
		{
			title: 'Access with intention',
			description:
				'Give people the permissions they need, with clear ownership for each workspace.',
			icon: keyIcon
		},
		{
			title: 'A clear audit trail',
			description: 'Keep meaningful changes visible so the team can understand what happened.',
			icon: listChecksIcon
		},
		{
			title: 'Privacy in the details',
			description: 'Explain what you collect, why you collect it, and how long you keep it.',
			icon: shieldCheckIcon
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-6xl flex-col">
	<div class="mx-auto max-w-2xl text-center">
		<Chip variant="outline">Trust, by design</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Good work needs a dependable foundation.</Heading
		>
		<p class="mt-lg text-neutral/70">
			An example trust section for explaining how your product protects the people who use it.
		</p>
	</div>
	<div class="gap-lg grid md:grid-cols-3">
		{#each practices as practice (practice.title)}<Card variant="outline"
				><Stack gap="lg"
					><span class="text-primary-readable">{@render practice.icon({ size: 32 })}</span><Heading
						as="h3"
						size="h4">{practice.title}</Heading
					>
					<p class="text-neutral/70 text-sm">{practice.description}</p></Stack
				></Card
			>{/each}
	</div>
	<div
		class="gap-lg bg-surface-recessed p-lg flex flex-wrap items-center justify-between rounded-lg"
	>
		<p class="text-neutral/70 text-sm">Example framework status</p>
		<div class="gap-md flex flex-wrap">
			<Chip variant="outline" color="neutral">SOC 2 · In review</Chip><Chip
				variant="outline"
				color="neutral">ISO 27001 · Planned</Chip
			><Chip variant="outline" color="neutral">Privacy · Documented</Chip>
		</div>
		<Button href="/docs" variant="link">Read the documentation</Button>
	</div>
</section>
