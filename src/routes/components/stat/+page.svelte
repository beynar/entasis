<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { Stat } from '$lib/components/Stat/index.js';
	import { colors, sizes, variants } from '$lib/utils/tokens.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import type { Density } from '$lib/types/theme.js';
	import { chartLineUpIcon } from '$lib/components/Icons/chartLineUp.js';
	import { checkCircleIcon } from '$lib/components/Icons/checkCircle.js';
	import { databaseIcon } from '$lib/components/Icons/database.js';
	import { dotsThreeVerticalIcon } from '$lib/components/Icons/dotsThreeVertical.js';
	import { hourglassIcon } from '$lib/components/Icons/hourglass.js';
	import { lightningIcon } from '$lib/components/Icons/lightning.js';
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
			options: ['compact', 'normal', 'comfortable']
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
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
	] as const satisfies ReadonlyArray<{ value: Density; label: string }>;
	let statDensity = $state<Density>('normal');
</script>

<DocPage
	title="Stat"
	subtitle="A compact metric surface with label, value, unit, trend, description, indicator, and action parts."
	component="Stat"
	features={[
		'order prop places and hides every region',
		'Unit slot rides the value baseline',
		'Trend icon stays neutral, direction arrow is automatic',
		'Decorative indicator plus a separate action button',
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
				value="184"
				unit="ms"
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
			description="order lists the regions to render, in sequence. A region left out is not rendered — that is how the separator is switched on, and how the description moves above the hairline."
			class="!min-h-[280px]"
			code={`<!-- default: ['label', 'value', 'indicator', 'trend', 'description'] -->
<Stat label="Tasks" value="147" unit="task" trend="12 completed today" trendDirection="up" description="Across every project" />

<!-- description above the hairline, trend last -->
<Stat
	order={['label', 'value', 'description', 'separator', 'trend']}
	label="Tasks"
	value="147"
	unit="task"
	description="Across every project"
	trend="12 completed today"
	trendDirection="up"
/>

<!-- value only -->
<Stat order={['value']} label="Ignored" value="147" unit="task" />`}
		>
			<div class="grid w-full max-w-4xl gap-4 md:grid-cols-3">
				<Stat
					variant="outline"
					label="Default order"
					value="147"
					unit="task"
					trend="12 completed today"
					trendDirection="up"
					description="Across every project"
				/>
				<Stat
					variant="outline"
					order={['label', 'value', 'description', 'separator', 'trend']}
					label="Description first"
					value="147"
					unit="task"
					description="Across every project"
					trend="12 completed today"
					trendDirection="up"
				/>
				<Stat variant="outline" order={['value']} label="Dropped" value="147" unit="task" />
			</div>
		</ComponentCard>

		<ComponentCard
			description="trendIcon leads in neutral ink, the trend text carries the tone, and the direction arrow comes from trendDirection."
			class="!min-h-[280px]"
			code={`<Stat label="Throughput" value="147" unit="task" trend="12 more than last week" trendDirection="up">
	{#snippet trendIcon()}
		{@render lightningIcon()}
	{/snippet}
</Stat>

<Stat label="Overdue" value="8" unit="task" trend="3 more than last week" trendDirection="down">
	{#snippet trendIcon()}
		{@render hourglassIcon()}
	{/snippet}
</Stat>

<Stat label="Reviewed" value="92" unit="task" trend="holding steady" trendDirection="neutral">
	{#snippet trendIcon()}
		{@render checkCircleIcon()}
	{/snippet}
</Stat>`}
		>
			<div class="grid w-full max-w-4xl gap-4 md:grid-cols-3">
				<Stat
					variant="outline"
					label="Throughput"
					value="147"
					unit="task"
					trend="12 more than last week"
					trendDirection="up"
				>
					{#snippet trendIcon()}
						{@render lightningIcon()}
					{/snippet}
				</Stat>
				<Stat
					variant="outline"
					label="Overdue"
					value="8"
					unit="task"
					trend="3 more than last week"
					trendDirection="down"
				>
					{#snippet trendIcon()}
						{@render hourglassIcon()}
					{/snippet}
				</Stat>
				<Stat
					variant="outline"
					label="Reviewed"
					value="92"
					unit="task"
					trend="holding steady"
					trendDirection="neutral"
				>
					{#snippet trendIcon()}
						{@render checkCircleIcon()}
					{/snippet}
				</Stat>
			</div>
		</ComponentCard>

		<ComponentCard
			description="action is a ghost icon button in the top-right corner with its own handler and label. The indicator stays decorative, so a card can show a status and a menu affordance at once."
			class="!min-h-[280px]"
			code={`<Stat
	label="Open tasks"
	value="147"
	unit="task"
	indicator="Live"
	indicatorVariant="badge"
	indicatorColor="success"
	actionLabel="More actions for Open tasks"
	onAction={() => openMenu()}
	order={['label', 'value', 'indicator', 'description', 'separator', 'trend']}
	description="Across every project"
	trend="12 completed today"
	trendDirection="up"
>
	{#snippet action()}
		{@render dotsThreeVerticalIcon()}
	{/snippet}
</Stat>`}
		>
			<div class="grid w-full max-w-4xl gap-4 md:grid-cols-3">
				<Stat
					variant="outline"
					label="Open tasks"
					value="147"
					unit="task"
					indicator="Live"
					indicatorVariant="badge"
					indicatorColor="success"
					actionLabel="More actions for Open tasks"
					onAction={() => undefined}
					order={['label', 'value', 'indicator', 'description', 'separator', 'trend']}
					description="Across every project"
					trend="12 completed today"
					trendDirection="up"
				>
					{#snippet action()}
						{@render dotsThreeVerticalIcon()}
					{/snippet}
				</Stat>
				<Stat
					variant="outline"
					label="Action only"
					value="42"
					unit="task"
					actionLabel="More actions for Action only"
					onAction={() => undefined}
					trend="stable"
				>
					{#snippet action()}
						{@render dotsThreeVerticalIcon()}
					{/snippet}
				</Stat>
				<Stat
					variant="outline"
					label="Disabled action"
					value="0"
					unit="task"
					indicatorVariant="icon"
					indicatorColor="info"
					actionLabel="More actions for Disabled action"
					actionDisabled
					onAction={() => undefined}
					trend="nothing queued"
				>
					{#snippet indicator()}
						{@render chartLineUpIcon()}
					{/snippet}
					{#snippet action()}
						{@render dotsThreeVerticalIcon()}
					{/snippet}
				</Stat>
			</div>
		</ComponentCard>

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
	order={['label', 'value', 'indicator', 'separator', 'trend', 'description']}
>
	{#snippet indicator()}
		{@render usersIcon()}
	{/snippet}
	{#snippet trendIcon()}
		{@render trendUpIcon()}
	{/snippet}
	{#snippet trend()}
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
					order={['label', 'value', 'indicator', 'separator', 'trend', 'description']}
				>
					{#snippet indicator()}
						{@render usersIcon()}
					{/snippet}
					{#snippet trendIcon()}
						{@render trendUpIcon()}
					{/snippet}
					{#snippet trend()}
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
					order={['label', 'value', 'indicator', 'separator', 'trend', 'description']}
				>
					{#snippet trendIcon()}
						{@render receiptIcon()}
					{/snippet}
					{#snippet trend()}
						No collection delay
					{/snippet}
				</Stat>
			</div>
		</ComponentCard>

		<ComponentCard
			description="size scales the typography and icons only — label, value, unit, trend, indicator, and action."
			class="!min-h-[320px]"
			code={`{#each sizes as size}
	<Stat
		{size}
		label={size + ' storage'}
		value="68"
		unit="%"
		indicatorVariant="icon"
		indicatorColor="primary"
		trend="8 points available"
	>
		{#snippet indicator()}
			{@render databaseIcon()}
		{/snippet}
		{#snippet trendIcon()}
			{@render percentIcon()}
		{/snippet}
	</Stat>
{/each}`}
		>
			<div class="grid w-full max-w-4xl gap-4">
				{#each sizes as size (size)}
					<Stat
						{size}
						label={size + ' storage'}
						value="68"
						unit="%"
						indicatorVariant="icon"
						indicatorColor="primary"
						trend="8 points available"
					>
						{#snippet indicator()}
							{@render databaseIcon()}
						{/snippet}
						{#snippet trendIcon()}
							{@render percentIcon()}
						{/snippet}
					</Stat>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="density scales the padding and gaps — compact for dense dashboards, comfortable for roomy detail surfaces. Combine freely with size."
			class="!min-h-[280px]"
			code={`<SegmentedControl items={densities} bind:value={density} />
<Stat {density} label="Storage used" value="68" unit="%" ... />`}
		>
			<div class="flex w-full flex-col items-center gap-5">
				<SegmentedControl
					items={densitySegments}
					bind:value={statDensity}
					size="small"
					label="Stat density"
				/>
				<Stat
					density={statDensity}
					class="w-full max-w-sm"
					label="Storage used"
					value="68"
					unit="%"
					indicatorVariant="icon"
					indicatorColor="primary"
					description="Same type, scaled spacing"
					order={['label', 'value', 'indicator', 'separator', 'trend', 'description']}
					trend="8 points available"
				>
					{#snippet indicator()}
						{@render databaseIcon()}
					{/snippet}
					{#snippet trendIcon()}
						{@render percentIcon()}
					{/snippet}
				</Stat>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Indicator variants are decorative only: plain icons, framed icons, and compact badges."
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

<Stat label="Badge" value="12" indicator="SLA" indicatorVariant="badge" indicatorColor="warning" trend="Needs review" />`}
		>
			<div class="grid w-full max-w-4xl gap-4 md:grid-cols-3">
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
					indicator="SLA"
					indicatorVariant="badge"
					indicatorColor="warning"
					trend="Needs review"
				/>
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
			indicator={color.slice(0, 1).toUpperCase()}
			indicatorVariant="badge"
			indicatorColor={color}
		/>
	{/each}
{/each}`}
		>
			<div class="grid w-full max-w-5xl gap-4 md:grid-cols-4">
				{#each statVariants as variant (variant)}
					{#each colors.slice(0, 4) as color (color)}
						<Stat
							{variant}
							{color}
							label={color}
							value={variant}
							trend="semantic surface"
							indicator={color.slice(0, 1).toUpperCase()}
							indicatorVariant="badge"
							indicatorColor={color}
						/>
					{/each}
				{/each}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
