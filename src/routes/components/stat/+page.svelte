<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { Stat } from '$lib/components/Stat/index.js';
	import { colors, sizes, variants } from '$lib/utils/tokens.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Button from '$lib/components/Button/Button.svelte';
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
		},
		{
			name: 'number',
			type: 'segmented',
			label: 'Number',
			value: 'flow',
			options: ['flow', 'blur', 'off']
		},
		{
			name: 'sparkline',
			type: 'segmented',
			label: 'Sparkline',
			value: 'area',
			options: ['area', 'line', 'bar', 'none']
		},
		{
			name: 'bleed',
			type: 'switch',
			label: 'Bleed',
			value: true,
			visible: (value) => value.sparkline !== 'none'
		}
	]);

	// The usage cards follow twelve months; "Next month" adds one and drops the oldest, so the
	// figure, its sparkline and its trend move together.
	const usageMonths = $state([
		'Dec',
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov'
	]);
	let usageRevenue = $state([
		28400, 30100, 29200, 32800, 34100, 33500, 36900, 35200, 38800, 41600, 37650, 45231
	]);
	let usageChurn = $state([
		0.041, 0.039, 0.04, 0.037, 0.035, 0.036, 0.033, 0.034, 0.031, 0.029, 0.032, 0.024
	]);
	let usageLatency = $state([196, 188, 191, 179, 185, 182, 190, 176, 183, 187, 181, 184]);
	const latest = (history: number[]) => history[history.length - 1];
	const change = (history: number[]) => latest(history) / history[history.length - 2] - 1;
	// A rate changes by points: 3.2% to 2.4% is -0.8%, not -25%.
	const points = (history: number[]) => latest(history) - history[history.length - 2];
	const signedPercent = new Intl.NumberFormat('en-US', {
		style: 'percent',
		maximumFractionDigits: 1,
		signDisplay: 'exceptZero'
	});
	const direction = (value: number, steady = 0) =>
		value > steady ? 'up' : value < -steady ? 'down' : 'neutral';
	const nextUsageMonth = () => {
		const roll = <T,>(history: T[], next: T) => [...history.slice(1), next];
		const month = usageMonths[0];
		usageMonths.push(month);
		usageMonths.shift();
		usageRevenue = roll(usageRevenue, Math.max(0, latest(usageRevenue) + between(-4000, 5500)));
		usageChurn = roll(usageChurn, Math.max(0.005, latest(usageChurn) + between(-5, 4) / 1000));
		usageLatency = roll(usageLatency, Math.max(90, latest(usageLatency) + between(-14, 14)));
	};
	const usageNumber = $derived(
		controls.value.number === 'off' ? { animated: false } : { variant: controls.value.number }
	);
	const usageSparkline = (data: number[], color?: 'primary' | 'danger' | 'info') =>
		controls.value.sparkline === 'none'
			? undefined
			: {
					data,
					labels: usageMonths,
					variant: controls.value.sparkline,
					color,
					curved: controls.value.sparkline !== 'bar',
					tooltip: true
				};

	const densitySegments = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
	] as const satisfies ReadonlyArray<{ value: Density; label: string }>;
	let statDensity = $state<Density>('normal');

	const usd = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const;
	const percent = { style: 'percent', minimumFractionDigits: 1 } as const;

	const numberModes = [
		{ value: 'flow', label: 'Flow' },
		{ value: 'blur', label: 'Blur' },
		{ value: 'off', label: 'Off' }
	] as const;
	let numberMode = $state<(typeof numberModes)[number]['value']>('flow');
	const liveNumber = $derived(numberMode === 'off' ? { animated: false } : { variant: numberMode });
	const between = (min: number, max: number) => min + Math.round(Math.random() * (max - min));
	let liveRevenue = $state(45231);
	let liveOrders = $state(1284);
	let liveConversion = $state(0.032);
	const nextMonth = () => {
		liveRevenue = Math.max(0, liveRevenue + between(-6000, 9000));
		liveOrders = Math.max(0, liveOrders + between(-120, 240));
		liveConversion = Math.max(0, liveConversion + between(-6, 8) / 1000);
	};

	const months = [
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
		'Jan',
		'Feb'
	];
	let revenueHistory = $state([
		31200, 33800, 32900, 36400, 38100, 37200, 40500, 42900, 41800, 44100, 43600, 45231
	]);
	let retentionHistory = $state([
		0.81, 0.82, 0.815, 0.83, 0.84, 0.835, 0.85, 0.86, 0.855, 0.87, 0.875, 0.88
	]);
	let ordersHistory = $state([62, 48, 75, 90, 58, 84, 102, 96, 71, 110, 88, 124]);
	const shiftIn = (history: number[], next: number) => [...history.slice(1), next];
	const nextSeries = () => {
		const revenue = revenueHistory[revenueHistory.length - 1];
		const retention = retentionHistory[retentionHistory.length - 1];
		const orders = ordersHistory[ordersHistory.length - 1];
		revenueHistory = shiftIn(revenueHistory, Math.max(0, revenue + between(-3000, 4000)));
		retentionHistory = shiftIn(
			retentionHistory,
			Math.min(0.99, retention + between(-8, 12) / 1000)
		);
		ordersHistory = shiftIn(ordersHistory, Math.max(10, orders + between(-40, 40)));
	};
</script>

<DocPage
	title="Stat"
	subtitle="A compact metric surface with label, value, unit, trend, description, indicator, and action parts."
	component="Stat"
	features={[
		'A numeric value animates each change through AnimatedNumber',
		'sparkline prop draws a Sparkline across the card',
		'order prop places and hides every region',
		'Unit slot rides the value baseline',
		'Trend icon stays neutral, direction arrow is automatic',
		'Decorative indicator plus a separate action button',
		'Theme parts for every visual slot'
	]}
>
	<ComponentCard
		{controls}
		class="!min-h-[320px] !items-start"
		code={`<script>
	let revenue = $state([28400, 30100, /* … */ 37650, 45231]);
${'</' + 'script>'}

<Stat
	size="${controls.value.size}"
	density="${controls.value.density}"
	variant="${controls.value.variant}"
	label="Revenue"
	value={revenue.at(-1)}
	animatedNumber={{ ${controls.value.number === 'off' ? 'animated: false' : `variant: '${controls.value.number}'`}, format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } }}
	trend="${signedPercent.format(change(usageRevenue))}"
	description="Compared with last month"${
		controls.value.sparkline === 'none'
			? ''
			: `
	sparkline={{ data: revenue, labels: months, variant: '${controls.value.sparkline}', color: 'primary'${controls.value.sparkline === 'bar' ? '' : ', curved: true'}, tooltip: true }}${controls.value.bleed ? '\n\tsparklineBleed' : ''}`
	}
>
	{#snippet indicator()}
		{@render trendUpIcon()}
	{/snippet}
</Stat>`}
	>
		<div class="flex w-full max-w-4xl flex-col gap-4">
			<div>
				<Button variant="outline" onclick={nextUsageMonth}>Next month</Button>
			</div>
			<div class="grid w-full gap-4 md:grid-cols-3">
				<Stat
					size={controls.value.size}
					density={controls.value.density}
					variant={controls.value.variant}
					label="Revenue"
					value={latest(usageRevenue)}
					animatedNumber={{ ...usageNumber, format: usd }}
					trend={signedPercent.format(change(usageRevenue))}
					trendDirection={direction(change(usageRevenue))}
					description="Compared with last month"
					sparkline={usageSparkline(usageRevenue, 'primary')}
					sparklineBleed={controls.value.bleed}
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
					value={latest(usageChurn)}
					animatedNumber={{ ...usageNumber, format: percent }}
					trend={signedPercent.format(points(usageChurn))}
					trendDirection={direction(points(usageChurn))}
					indicatorColor="danger"
					description="Account loss rate"
					sparkline={usageSparkline(usageChurn, 'danger')}
					sparklineBleed={controls.value.bleed}
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
					value={latest(usageLatency)}
					animatedNumber={usageNumber}
					unit="ms"
					trend={Math.abs(change(usageLatency)) < 0.03
						? 'stable'
						: signedPercent.format(change(usageLatency))}
					trendDirection={direction(change(usageLatency), 0.03)}
					indicatorVariant="icon"
					indicatorColor="info"
					description="P95 API latency"
					sparkline={usageSparkline(usageLatency, 'info')}
					sparklineBleed={controls.value.bleed}
				>
					{#snippet indicator()}
						{@render timerIcon()}
					{/snippet}
				</Stat>
			</div>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="A numeric value is drawn by AnimatedNumber, so each change is animated. animatedNumber sets its props (variant, format, locale, prefix, suffix, duration); false writes the plain number. A string or a snippet is drawn as it is."
			class="!min-h-[280px] !items-start"
			code={`<Stat label="Revenue" value={revenue} animatedNumber={{ format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } }} />
<Stat label="Orders" value={orders} />
<Stat label="Conversion" value={conversion} animatedNumber={{ variant: 'blur', format: { style: 'percent', minimumFractionDigits: 1 } }} />

<!-- formatted, no animation -->
<Stat label="Conversion" value={conversion} animatedNumber={{ animated: false, format: { style: 'percent' } }} />

<!-- no AnimatedNumber at all: the number in the I18n locale, as plain text -->
<Stat label="Orders" value={orders} animatedNumber={false} />`}
		>
			<div class="flex w-full max-w-4xl flex-col gap-4">
				<div class="flex flex-wrap items-center gap-3">
					<SegmentedControl items={numberModes} bind:value={numberMode} />
					<Button variant="outline" onclick={nextMonth}>Next month</Button>
				</div>
				<div class="grid w-full gap-4 md:grid-cols-3">
					<Stat
						label="Revenue"
						value={liveRevenue}
						animatedNumber={{ ...liveNumber, format: usd }}
						description="This month"
					/>
					<Stat
						label="Orders"
						value={liveOrders}
						animatedNumber={liveNumber}
						description="This month"
					/>
					<Stat
						label="Conversion"
						value={liveConversion}
						animatedNumber={{ ...liveNumber, format: percent }}
						description="Visits that ordered"
					/>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			description="sparkline draws a Sparkline across the card: the values, or Sparkline props with their data. It takes the card's size and ink, its label, and the format of animatedNumber; without a trendDirection, the trend takes the way the series goes."
			class="!min-h-[320px] !items-start"
			code={`<Stat
	label="Revenue"
	value={revenue.at(-1)}
	animatedNumber={{ format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } }}
	trend="vs last month"
	sparkline={{ data: revenue, labels: months, variant: 'area', color: 'primary', curved: true, tooltip: true }}
/>
<Stat
	label="Retention"
	value={retention.at(-1)}
	animatedNumber={{ format: { style: 'percent', minimumFractionDigits: 1 } }}
	trend="vs last month"
	sparkline={{ data: retention, labels: months, color: 'success', markers: ['last'], tooltip: true }}
/>
<Stat label="Orders" value={orders.at(-1)} unit="order" sparkline={{ data: orders, variant: 'bar', color: 'info', tooltip: true }} />`}
		>
			<div class="flex w-full max-w-4xl flex-col gap-4">
				<div>
					<Button variant="outline" onclick={nextSeries}>Next month</Button>
				</div>
				<div class="grid w-full gap-4 md:grid-cols-3">
					<Stat
						label="Revenue"
						value={revenueHistory[revenueHistory.length - 1]}
						animatedNumber={{ format: usd }}
						trend="vs last month"
						sparkline={{
							data: revenueHistory,
							labels: months,
							variant: 'area',
							color: 'primary',
							curved: true,
							tooltip: true
						}}
					/>
					<Stat
						label="Retention"
						value={retentionHistory[retentionHistory.length - 1]}
						animatedNumber={{ format: percent }}
						trend="vs last month"
						sparkline={{
							data: retentionHistory,
							labels: months,
							color: 'success',
							markers: ['last'],
							tooltip: true
						}}
					/>
					<Stat
						label="Orders"
						value={ordersHistory[ordersHistory.length - 1]}
						unit="order"
						sparkline={{
							data: ordersHistory,
							labels: months,
							variant: 'bar',
							color: 'info',
							tooltip: true
						}}
					/>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			description="order lists the regions to render, in sequence. A region left out is not rendered — that is how the separator is switched on, and how the description moves above the hairline."
			class="!min-h-[280px]"
			code={`<!-- default: ['label', 'value', 'indicator', 'trend', 'description', 'sparkline'] -->
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
			description="Surface colors and variants use the same semantic token model as the rest of Entasis."
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
