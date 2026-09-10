<script lang="ts">
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { ProgressCircle } from 'svelai/progress-circle';
	import { Stat } from 'svelai/stat';
</script>

<section class="grid gap-lg p-lg md:grid-cols-3 md:p-xl">
	<Card
		class="md:col-span-2"
		title="See what is moving"
		description="Product engagement · Last 7 days"
		><div
			class="flex h-48 items-end gap-md"
			aria-label="Weekly engagement: 32, 48, 40, 67, 60, 82, 94 percent"
		>
			{#each [32, 48, 40, 67, 60, 82, 94] as value, index (value)}<div
					class="flex h-full flex-1 flex-col justify-end gap-sm"
				>
					<div class="rounded-t-lg bg-primary" style:height={value + '%'}></div>
					<span class="text-center text-xs text-neutral/50"
						>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span
					>
				</div>{/each}
		</div></Card
	>
	<Card color="primary" variant="soft"
		><div class="flex h-full flex-col justify-between gap-xl">
			<Chip class="self-start" variant="outline">This month</Chip><Stat
				value="+24.8%"
				label="More meaningful sessions"
				variant="ghost"
			/>
			<p>Know what helps people find their next step.</p>
		</div></Card
	>
	<Card title="A complete picture" variant="outline"
		><div class="flex items-center gap-lg">
			<ProgressCircle value={87} diameter={88} label="87 percent activation" />
			<div>
				<strong class="text-3xl">87%</strong>
				<p class="text-sm text-neutral/60">Activation rate</p>
			</div>
		</div></Card
	>
	<Card class="md:col-span-2" title="Every signal has a story"
		><div class="grid gap-md sm:grid-cols-2">
			<div class="rounded-lg border border-neutral-muted p-lg">
				<Chip size="small" color="success">Milestone</Chip>
				<p class="mt-md font-medium">10,000 projects created</p>
				<p class="text-sm text-neutral/60">A little progress, every day.</p>
			</div>
			<div class="rounded-lg border border-neutral-muted p-lg">
				<Chip size="small">Insight</Chip>
				<p class="mt-md font-medium">Teams return 3× a week</p>
				<p class="text-sm text-neutral/60">A rhythm that keeps work moving.</p>
			</div>
		</div></Card
	>
</section>
