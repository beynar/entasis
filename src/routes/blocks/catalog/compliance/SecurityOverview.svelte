<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { shieldCheckIcon } from 'svelai/icons/shieldCheck';
</script>

<section class="mx-auto grid max-w-6xl items-center gap-xl p-lg md:grid-cols-2 md:p-xl">
	<div class="flex flex-col gap-xl">
		<span class="text-primary">{@render shieldCheckIcon({ size: 42 })}</span><Heading
			as="h2"
			size="h1"
			weight="bold">Trust should be easy to understand.</Heading
		>
		<p class="text-lg text-neutral/70">
			Give your customers a clear view of your security practices, current reviews, and the work
			still ahead.
		</p>
		<Button href="/docs" variant="outline" class="self-start" suffix={arrowRightIcon}
			>Explore the documentation</Button
		>
		<p class="text-xs text-neutral/50">
			Illustrative statuses; these are not certifications of Svelai.
		</p>
	</div>
	<div class="flex flex-col gap-lg">
		{#each [{ name: 'SOC 2 Type II', initials: 'SOC', status: 'In review', detail: 'Independent controls review in progress.' }, { name: 'ISO 27001', initials: 'ISO', status: 'Planned', detail: 'Information security framework assessment.' }, { name: 'Privacy program', initials: 'DPA', status: 'Documented', detail: 'Data handling, retention, and access policies.' }] as framework (framework.name)}<Card
				variant="outline"
				><div class="flex items-start gap-lg">
					<div
						class="flex size-16 shrink-0 items-center justify-center rounded-full border border-neutral-muted font-semibold"
					>
						{framework.initials}
					</div>
					<div class="flex flex-1 flex-col gap-sm">
						<div class="flex flex-wrap items-center justify-between gap-sm">
							<strong>{framework.name}</strong><Chip size="small" variant="soft" color="neutral"
								>{framework.status}</Chip
							>
						</div>
						<p class="text-sm text-neutral/60">{framework.detail}</p>
					</div>
				</div></Card
			>{/each}
	</div>
</section>
