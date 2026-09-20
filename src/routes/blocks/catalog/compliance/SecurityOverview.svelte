<script lang="ts">
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { shieldCheckIcon } from 'entasis/icons/shieldCheck';
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl items-center md:grid-cols-2">
	<div class="gap-xl flex flex-col">
		<span class="text-primary-readable">{@render shieldCheckIcon({ size: 42 })}</span><Heading
			as="h2"
			size="h1"
			weight="bold">Trust should be easy to understand.</Heading
		>
		<p class="text-neutral/70 text-lg">
			Give your customers a clear view of your security practices, current reviews, and the work
			still ahead.
		</p>
		<Button href="/docs" variant="outline" class="self-start" suffix={arrowRightIcon}
			>Explore the documentation</Button
		>
		<p class="text-neutral/65 text-xs">
			Illustrative statuses; these are not certifications of Entasis.
		</p>
	</div>
	<div class="gap-lg flex flex-col">
		{#each [{ name: 'SOC 2 Type II', initials: 'SOC', status: 'In review', detail: 'Independent controls review in progress.' }, { name: 'ISO 27001', initials: 'ISO', status: 'Planned', detail: 'Information security framework assessment.' }, { name: 'Privacy program', initials: 'DPA', status: 'Documented', detail: 'Data handling, retention, and access policies.' }] as framework (framework.name)}<Card
				variant="outline"
				><div class="gap-lg flex items-start">
					<div
						class="border-neutral-muted flex size-16 shrink-0 items-center justify-center rounded-full border font-semibold"
					>
						{framework.initials}
					</div>
					<div class="gap-sm flex flex-1 flex-col">
						<div class="gap-sm flex flex-wrap items-center justify-between">
							<strong>{framework.name}</strong><Chip size="small" variant="soft" color="neutral"
								>{framework.status}</Chip
							>
						</div>
						<p class="text-neutral/70 text-sm">{framework.detail}</p>
					</div>
				</div></Card
			>{/each}
	</div>
</section>
