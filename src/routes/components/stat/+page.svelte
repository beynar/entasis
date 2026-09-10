<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { Stat } from '$lib/components/Stat/index.js';
	import { colors, sizes, variants } from '$lib/utils/tokens.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import type { Density } from '$lib/types/theme.js';
	import { chartLineUpIcon } from '$lib/components/Icons/chartLineUp.js';
	import { databaseIcon } from '$lib/components/Icons/database.js';
	import { dotsThreeIcon } from '$lib/components/Icons/dotsThree.js';
	import { percentIcon } from '$lib/components/Icons/percent.js';
	import { receiptIcon } from '$lib/components/Icons/receipt.js';
	import { sealCheckIcon } from '$lib/components/Icons/sealCheck.js';
	import { timerIcon } from '$lib/components/Icons/timer.js';
	import { trendDownIcon } from '$lib/components/Icons/trendDown.js';
	import { trendUpIcon } from '$lib/components/Icons/trendUp.js';
	import { usersIcon } from '$lib/components/Icons/users.js';

	const statVariants = variants;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'solid',
			options: statVariants
		}
	]);

	const densitySegments = [
		{ value: 'small', label: 'Small' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Large' }
	] as const satisfies ReadonlyArray<{ value: Density; label: string }>;
	let statDensity = $state<Density>('normal');
</script>

<DocPage
	title="Stat"
	subtitle="A compact metric surface with label, value, trend, description, and indicator parts."
	component="Stat"
	features={[
		'Props and named snippets for composition',
		'Single public component export',
		'Semantic trend and indicator colors',
		'Action indicators render as real buttons',
		'Theme parts for every visual slot'
	]}
>
	<ComponentCard
		{controls}
		class="!min-h-[280px] !items-start"
		code={`<Stat size="${controls.value.size}" density="${controls.value.density}" variant="${controls.value.variant}" label="Revenue" value="$45,231" trend="+20.1%" trendDirection="up" description="Compared with last month">
	{#snippet indicator()}
		{@render trendUpIcon()}
	{/snippet}
</Stat>`}
	>
		<div class="grid w-full max-w-4xl gap-4 md:grid-cols-3">
			<Stat
				size={controls.value.size}
				density={controls.value.density}
				variant={controls.value.variant}
				label="Revenue"
				value="$45,231"
				trend="+20.1%"
				trendDirection="up"
				description="Compared with last month"
			>
				{#snippet indicator()}
					{@render trendUpIcon()}
				{/snippet}
			</Stat>
			<Stat
				size={controls.value.size}
				density={controls.value.density}
				variant={controls.value.variant}
				label="Churn"
				value="2.4%"
				trend="-0.8%"
				trendDirection="down"
				indicatorColor="danger"
				description="Account loss rate"
			>
				{#snippet indicator()}
					{@render trendDownIcon()}
				{/snippet}
			</Stat>
			<Stat
				size={controls.value.size}
				density={controls.value.density}
				variant={controls.value.variant}
				label="Response"
				value="184ms"
				trend="stable"
				indicatorVariant="icon"
				indicatorColor="info"
				description="P95 API latency"
			>
				{#snippet indicator()}
					{@render timerIcon()}
				{/snippet}
			</Stat>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Named snippets customize the metric while keeping a single Stat component."
			class="!min-h-[280px]"
			code={`<Stat
	size="large"
	label="Active users"
	value="24,892"
	indicatorVariant="icon"
	indicatorColor="info"
	trendDirection="up"
	description="Trailing 30 days across all workspaces"
	showSeparator
>
	{#snippet indicator()}
		{@render usersIcon()}
	{/snippet}
	{#snippet trend()}
		{@render trendUpIcon()}
		12.4% growth
	{/snippet}
</Stat>`}
		>
			<div class="grid w-full max-w-4xl gap-4 md:grid-cols-2">
				<Stat
					size="large"
					label="Active users"
					value="24,892"
					indicatorVariant="icon"
					indicatorColor="info"
					trendDirection="up"
					description="Trailing 30 days across all workspaces"
					showSeparator
				>
					{#snippet indicator()}
						{@render usersIcon()}
					{/snippet}
					{#snippet trend()}
						{@render trendUpIcon()}
						12.4% growth
					{/snippet}
				</Stat>

				<Stat
					size="large"
					label="Paid invoices"
					value="1,284"
					indicator="Live"
					indicatorVariant="badge"
					indicatorColor="success"
					description="Settlement window remains within target"
					showSeparator
				>
					{#snippet trend()}
						{@render receiptIcon()}
						No collection delay
					{/snippet}
				</Stat>
			</div>
		</ComponentCard>

		<ComponentCard
			description="size scales the typography and icons only — label, value, trend, and indicator."
			class="!min-h-[320px]"
			code={`{#each sizes as size}
	<Stat
		{size}
		label={size + ' storage'}
		value="68%"
		indicatorVariant="icon"
		indicatorColor="primary"
	>
		{#snippet indicator()}
			{@render databaseIcon()}
		{/snippet}
		{#snippet trend()}
			{@render percentIcon()}
			8 points available
		{/snippet}
	</Stat>
{/each}`}
		>
			<div class="grid w-full max-w-4xl gap-4">
				{#each sizes as size}
					<Stat
						{size}
						label={size + ' storage'}
						value="68%"
						indicatorVariant="icon"
						indicatorColor="primary"
					>
						{#snippet indicator()}
							{@render databaseIcon()}
						{/snippet}
						{#snippet trend()}
							{@render percentIcon()}
							8 points available
						{/snippet}
					</Stat>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="density scales the padding and gaps — small for dense dashboards, large for roomy detail surfaces. Combine freely with size."
			class="!min-h-[280px]"
			code={`<SegmentedControl items={densities} bind:value={density} />
<Stat {density} label="Storage used" value="68%" ... />`}
		>
			<div class="flex w-full flex-col items-center gap-5">
				<SegmentedControl
					items={densitySegments}
					bind:value={statDensity}
					size="small"
					ariaLabel="Stat density"
				/>
				<Stat
					density={statDensity}
					class="w-full max-w-sm"
					label="Storage used"
					value="68%"
					indicatorVariant="icon"
					indicatorColor="primary"
					description="Same type, scaled spacing"
					showSeparator
				>
					{#snippet indicator()}
						{@render databaseIcon()}
					{/snippet}
					{#snippet trend()}
						{@render percentIcon()}
						8 points available
					{/snippet}
				</Stat>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Indicator variants cover plain icons, framed icons, compact badges, and actions."
			class="!min-h-[280px]"
			code={`<Stat label="Default" value="98.2" trend="Healthy">
	{#snippet indicator()}
		{@render sealCheckIcon()}
	{/snippet}
</Stat>

<Stat label="Icon" value="42" indicatorVariant="icon" indicatorColor="info" trend="Queued">
	{#snippet indicator()}
		{@render chartLineUpIcon()}
	{/snippet}
</Stat>

<Stat label="Badge" value="12" indicatorVariant="badge" indicatorColor="warning" trend="Needs review">
	{#snippet indicator()}
		SLA
	{/snippet}
</Stat>

<Stat
	label="Action"
	value="7"
	trend="Open tasks"
	indicatorVariant="action"
	indicatorColor="neutral"
	onclick={() => undefined}
	indicatorLabel="Open actions"
>
	{#snippet indicator()}
		{@render dotsThreeIcon()}
	{/snippet}
</Stat>`}
		>
			<div class="grid w-full max-w-4xl gap-4 md:grid-cols-4">
				<Stat label="Default" value="98.2" trend="Healthy">
					{#snippet indicator()}
						{@render sealCheckIcon()}
					{/snippet}
				</Stat>
				<Stat label="Icon" value="42" indicatorVariant="icon" indicatorColor="info" trend="Queued">
					{#snippet indicator()}
						{@render chartLineUpIcon()}
					{/snippet}
				</Stat>
				<Stat
					label="Badge"
					value="12"
					indicatorVariant="badge"
					indicatorColor="warning"
					trend="Needs review"
				>
					{#snippet indicator()}
						SLA
					{/snippet}
				</Stat>
				<Stat
					label="Action"
					value="7"
					trend="Open tasks"
					indicatorVariant="action"
					indicatorColor="neutral"
					onclick={() => undefined}
					indicatorLabel="Open actions"
				>
					{#snippet indicator()}
						{@render dotsThreeIcon()}
					{/snippet}
				</Stat>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Surface colors and variants use the same semantic token model as the rest of Svelai."
			class="!min-h-[420px]"
			code={`{#each statVariants as variant}
	{#each colors.slice(0, 4) as color}
		<Stat
			{variant}
			{color}
			label={color}
			value={variant}
			trend="semantic surface"
			indicatorVariant="badge"
			indicatorColor={color}
		>
			{#snippet indicator()}
				{color.slice(0, 1).toUpperCase()}
			{/snippet}
		</Stat>
	{/each}
{/each}`}
		>
			<div class="grid w-full max-w-5xl gap-4 md:grid-cols-4">
				{#each statVariants as variant}
					{#each colors.slice(0, 4) as color}
						<Stat
							{variant}
							{color}
							label={color}
							value={variant}
							trend="semantic surface"
							indicatorVariant="badge"
							indicatorColor={color}
						>
							{#snippet indicator()}
								{color.slice(0, 1).toUpperCase()}
							{/snippet}
						</Stat>
					{/each}
				{/each}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
