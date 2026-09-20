<script lang="ts">
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { ProgressCircle } from 'entasis/progress-circle';
	import { Stat } from 'entasis/stat';
</script>

<section class="gap-lg p-lg md:p-xl grid md:grid-cols-3">
	<Card
		class="md:col-span-2"
		title="See what is moving"
		description="Product engagement · Last 7 days"
		><div
			class="gap-md flex h-48 items-end"
			aria-label="Weekly engagement: 32, 48, 40, 67, 60, 82, 94 percent"
		>
			{#each [32, 48, 40, 67, 60, 82, 94] as value, index (value)}<div
					class="gap-sm flex h-full flex-1 flex-col justify-end"
				>
					<div class="bg-primary rounded-t-lg" style:height={value + '%'}></div>
					<span class="text-neutral/65 text-center text-xs"
						>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span
					>
				</div>{/each}
		</div></Card
	>
	<Card color="primary" variant="soft"
		><div class="gap-xl flex h-full flex-col justify-between">
			<Chip class="self-start" variant="outline">This month</Chip><Stat
				value="+24.8%"
				label="More meaningful sessions"
				variant="ghost"
			/>
			<p>Know what helps people find their next step.</p>
		</div></Card
	>
	<Card title="A complete picture" variant="outline"
		><div class="gap-lg flex items-center">
			<ProgressCircle value={87} diameter={88} label="87 percent activation" />
			<div>
				<strong class="text-3xl">87%</strong>
				<p class="text-neutral/70 text-sm">Activation rate</p>
			</div>
		</div></Card
	>
	<Card class="md:col-span-2" title="Every signal has a story"
		><div class="gap-md grid sm:grid-cols-2">
			<div class="border-neutral-muted p-lg rounded-lg border">
				<Chip size="small" color="success">Milestone</Chip>
				<p class="mt-md font-medium">10,000 projects created</p>
				<p class="text-neutral/70 text-sm">A little progress, every day.</p>
			</div>
			<div class="border-neutral-muted p-lg rounded-lg border">
				<Chip size="small">Insight</Chip>
				<p class="mt-md font-medium">Teams return 3× a week</p>
				<p class="text-neutral/70 text-sm">A rhythm that keeps work moving.</p>
			</div>
		</div></Card
	>
</section>
