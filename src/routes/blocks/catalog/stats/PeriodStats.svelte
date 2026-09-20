<script lang="ts">
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { SegmentedControl } from 'entasis/segmented-control';
	import { Stat } from 'entasis/stat';
	let period = $state<'month' | 'quarter'>('month');
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl items-center md:grid-cols-2">
	<div class="gap-xl flex flex-col items-start">
		<Chip variant="soft">Keep the useful signals close</Chip><Heading
			as="h2"
			size="h2"
			weight="bold">A clearer picture of the work.</Heading
		>
		<p class="text-neutral/70">
			Switch the period to see how a few steady weeks add up to a meaningful quarter.
		</p>
		<SegmentedControl
			label="Reporting period"
			bind:value={period}
			items={[
				{ value: 'month', label: 'This month' },
				{ value: 'quarter', label: 'This quarter' }
			]}
		/>
	</div>
	<div class="gap-md grid sm:grid-cols-2">
		<Stat
			label="Projects completed"
			value={period === 'month' ? '8' : '24'}
			trend={period === 'month' ? '+2 from last month' : '+6 from last quarter'}
			trendDirection="up"
			variant="outline"
		/><Stat
			label="Customer conversations"
			value={period === 'month' ? '32' : '104'}
			description="Useful context from real people"
			variant="outline"
		/><Stat
			label="Ideas tested"
			value={period === 'month' ? '14' : '46'}
			description="A question made tangible"
			variant="outline"
		/><Stat
			label="Team satisfaction"
			value={period === 'month' ? '94%' : '92%'}
			trend="A steady working rhythm"
			trendDirection="up"
			variant="outline"
		/>
	</div>
</section>
