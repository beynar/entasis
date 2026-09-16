<script lang="ts">
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { ProgressCircle } from 'svelai/progress-circle';
	import { Stat } from 'svelai/stat';
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-5xl flex-col">
	<div class="text-center">
		<Chip variant="outline">A quarter in perspective</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">See the progress behind the plans.</Heading
		>
	</div>
	<div class="gap-xl grid items-center md:grid-cols-2">
		<div class="relative mx-auto flex size-72 items-center justify-center">
			<ProgressCircle value={84} diameter={280} label="84 percent of quarterly goals complete" />
			<div class="absolute text-center">
				<strong class="text-6xl">84%</strong>
				<p class="mt-sm text-neutral/70 text-sm">of quarterly goals</p>
			</div>
		</div>
		<div class="gap-lg flex flex-col">
			<Stat
				label="Outcomes delivered"
				value="21 of 25"
				trend="A focused final stretch"
				trendDirection="up"
				variant="outline"
			/><Stat
				label="Projects on track"
				value="12"
				description="Clear ownership across the team"
				variant="outline"
			/><Stat
				label="Next shared review"
				value="Friday"
				description="Make the next decision together"
				variant="outline"
			/>
		</div>
	</div>
	<p class="text-neutral/65 text-center text-xs">Illustrative workspace metrics.</p>
</section>
