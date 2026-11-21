<script lang="ts">
	import { Sparkline } from '$lib/components/Sparkline/index.js';
	import type { SparklineAnimation, SparklineVariant } from '$lib/components/Sparkline/index.js';
	import Button from '$lib/components/Button/Button.svelte';
	import Stat from '$lib/components/Stat/Stat.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const variants: SparklineVariant[] = ['line', 'area', 'bar', 'dot'];
	const colors = ['current', 'primary', 'success', 'danger', 'info'] as const;
	const animations: SparklineAnimation[] = ['draw', 'grow', 'fade', 'none'];
	const easings = ['enter', 'standard', 'linear', 'backOut', 'elasticOut', 'bounceOut'] as const;

	const controls = createComponentControls([
		{ name: 'variant', type: 'segmented', label: 'Variant', value: 'area', options: variants },
		{ name: 'size', type: 'segmented', label: 'Size', value: 'normal', options: sizes },
		{ name: 'color', type: 'segmented', label: 'Color', value: 'primary', options: colors },
		{
			name: 'width',
			type: 'slider',
			label: 'Width',
			value: 360,
			min: 96,
			max: 640,
			step: 8,
			showValue: true
		},
		{
			name: 'height',
			type: 'slider',
			label: 'Height',
			value: 96,
			min: 24,
			max: 200,
			step: 4,
			showValue: true
		},
		{
			name: 'curved',
			type: 'switch',
			label: 'Curved',
			value: true,
			visible: (value) => value.variant === 'line' || value.variant === 'area'
		},
		{
			name: 'animation',
			type: 'segmented',
			label: 'Animation',
			value: 'draw',
			options: animations
		},
		{
			name: 'duration',
			type: 'slider',
			label: 'Duration',
			value: 500,
			min: 0,
			max: 2000,
			step: 50,
			showValue: true
		},
		{ name: 'easing', type: 'segmented', label: 'Easing', value: 'enter', options: easings },
		{ name: 'markers', type: 'switch', label: 'Markers', value: false },
		{
			name: 'tooltip',
			type: 'segmented',
			label: 'Tooltip',
			value: 'series',
			options: ['off', 'series', 'neutral', 'danger', 'info']
		},
		{ name: 'showTrend', type: 'switch', label: 'Trend', value: false }
	]);
	const color = $derived(controls.value.color === 'current' ? undefined : controls.value.color);
	const curved = $derived(
		controls.value.curved &&
			(controls.value.variant === 'line' || controls.value.variant === 'area')
	);
	const box = $derived(`width: ${controls.value.width}px; height: ${controls.value.height}px`);

	// Weekly signups over six months: a rise with its dips.
	const signups = [
		42, 48, 45, 53, 61, 57, 50, 58, 66, 72, 68, 79, 74, 70, 82, 91, 86, 95, 88, 97, 104, 99, 112,
		118
	];
	const weeks = signups.map((_, index) => `Week ${index + 1}`);

	const between = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
	let replay = $state(0);
	let usageData = $state(signups);
	const shuffle = () => {
		usageData = usageData.map((value) => Math.max(10, value + between(-25, 25)));
	};

	const usageCode = $derived(
		[
			`<Sparkline`,
			`\tdata={signups}`,
			`\tlabels={weeks}`,
			controls.value.variant === 'line' ? '' : `\tvariant="${controls.value.variant}"`,
			controls.value.size === 'normal' ? '' : `\tsize="${controls.value.size}"`,
			color ? `\tcolor="${color}"` : '',
			curved ? '\tcurved' : '',
			controls.value.markers ? `\tmarkers={['min', 'max', 'last']}` : '',
			controls.value.tooltip === 'off'
				? ''
				: controls.value.tooltip === 'series'
					? '\ttooltip'
					: `\ttooltip="${controls.value.tooltip}"`,
			controls.value.showTrend ? '\tshowTrend' : '',
			controls.value.animation === 'draw' ? '' : `\tanimation="${controls.value.animation}"`,
			controls.value.duration === 500 ? '' : `\tduration={${controls.value.duration}}`,
			controls.value.easing === 'enter' ? '' : `\teasing="${controls.value.easing}"`,
			`\tstyle="${box}"`,
			'/>'
		]
			.filter(Boolean)
			.join('\n')
	);

	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	let visits = $state([120, 132, 101, 134, 190, 230, 210]);
	const total = $derived(visits.reduce((sum, value) => sum + value, 0));
	const nextWeek = () => {
		visits = visits.map((value) => Math.max(20, value + between(-60, 60)));
	};
	const addDay = () => {
		visits = [...visits.slice(1), Math.max(20, visits[visits.length - 1] + between(-60, 60))];
	};

	const revenue = [1200, 1350, 990, 1640, 1480, 1720, 1610, 1880];
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
	const usd = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const;
	const balance = [4, 2.5, -1, -3, 1.5, 3, -0.5, 2];

	const services = [
		{ name: 'API', latency: [82, 90, 85, 120, 95, 88, 84, 86], color: 'success' },
		{ name: 'Search', latency: [140, 150, 210, 260, 240, 300, 280, 320], color: 'danger' },
		{ name: 'Billing', latency: [60, 64, 58, 62, 61, 59, 63, 60], color: 'info' }
	] as const;
</script>

<DocPage
	title="Sparkline"
	subtitle="A small chart with no axes, read at a glance beside a figure: line, area, bars or dots."
	component="Sparkline"
	features={[
		'line, area, bar and dot variants',
		'Stretches to any size, strokes keep their weight',
		'Markers for the lowest, highest, first and last value',
		'Tooltip on the value under the pointer',
		'Trend arrow and sparklineTrend in the vocabulary of Stat',
		'Draws in, and moves to new values, unless motion is reduced',
		'Accessible name summarizes the series'
	]}
>
	<ComponentCard {controls} class="sm:!py-16" code={usageCode}>
		<div class="mt-10 flex flex-col items-center gap-6">
			{#key replay}
				<Sparkline
					data={usageData}
					labels={weeks}
					variant={controls.value.variant}
					size={controls.value.size}
					{color}
					{curved}
					markers={controls.value.markers ? ['min', 'max', 'last'] : []}
					tooltip={controls.value.tooltip === 'off'
						? false
						: controls.value.tooltip === 'series'
							? true
							: controls.value.tooltip}
					showTrend={controls.value.showTrend}
					animation={controls.value.animation}
					duration={controls.value.duration}
					easing={controls.value.easing}
					label="Weekly signups"
					style={box}
				/>
			{/key}
			<div class="flex gap-2">
				<Button size="small" variant="outline" onclick={() => replay++}>Replay</Button>
				<Button size="small" variant="outline" onclick={shuffle}>Shuffle</Button>
			</div>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="In a Stat, the sparkline prop draws it across the card. A change of values with the same length moves each value to its new place; a change of length is drawn at once."
			class="!min-h-[280px] !items-start"
			code={`<script>
	let visits = $state([120, 132, 101, 134, 190, 230, 210]);
${'</' + 'script>'}

<Stat
	label="Visits"
	value={visits.reduce((sum, value) => sum + value, 0)}
	sparkline={{ data: visits, labels: days, variant: 'area', color: 'primary', curved: true, tooltip: true }}
/>`}
		>
			<div class="flex w-full max-w-sm flex-col gap-4">
				<div class="flex flex-wrap gap-3">
					<Button variant="outline" onclick={nextWeek}>Next week</Button>
					<Button variant="outline" onclick={addDay}>Next day</Button>
				</div>
				<Stat
					label="Visits"
					value={total}
					description="Last 7 days"
					sparkline={{
						data: visits,
						labels: days,
						variant: 'area',
						color: 'primary',
						curved: true,
						tooltip: true
					}}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Four ways to draw a series. Bars stand on zero; the other variants run from the lowest value to the highest."
			code={`<Sparkline {data} variant="line" curved />
<Sparkline {data} variant="area" color="primary" />
<Sparkline {data} variant="bar" />
<Sparkline {data} variant="dot" />`}
		>
			<div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
				{#each variants as variant (variant)}
					<div class="flex flex-col items-center gap-2">
						<Sparkline
							data={revenue}
							{variant}
							curved={variant === 'line'}
							color={variant === 'area' ? 'primary' : undefined}
							size="large"
							tooltip
							labels={months}
							format={usd}
						/>
						<span class="text-neutral/70 text-xs">{variant}</span>
					</div>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="markers put a dot on the lowest value, the highest, the first and the last. showTrend adds an arrow for the way the series goes. tooltip shows the value under the pointer after its label."
			code={`<Sparkline
	data={revenue}
	labels={months}
	markers={['min', 'max', 'last']}
	showTrend
	tooltip
	format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
	size="large"
/>`}
		>
			<Sparkline
				data={revenue}
				labels={months}
				markers={['min', 'max', 'last']}
				showTrend
				tooltip
				format={usd}
				size="large"
				label="Revenue"
			/>
		</ComponentCard>

		<ComponentCard
			description="Width and height classes stretch the box. The series stretches with it; the line and the dots keep their weight."
			code={`<Sparkline data={revenue} variant="area" curved tooltip class="h-24 w-full" />
<Sparkline data={revenue} variant="dot" class="h-12 w-full" />`}
		>
			<div class="flex w-full max-w-2xl flex-col gap-6">
				<Sparkline
					data={revenue}
					labels={months}
					variant="area"
					curved
					tooltip
					format={usd}
					class="h-24 w-full"
				/>
				<Sparkline data={revenue} variant="dot" class="h-12 w-full" />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Bars stand on zero: a negative value hangs under it."
			code={`<Sparkline data={[4, 2.5, -1, -3, 1.5, 3, -0.5, 2]} variant="bar" tooltip size="large" />`}
		>
			<Sparkline data={balance} variant="bar" tooltip size="large" label="Net balance" />
		</ComponentCard>

		<ComponentCard
			description="In a row of a table or a list, beside the figure it explains. min and max fix the scale, so the rows compare."
			code={`{#each services as service}
	<div class="flex items-center justify-between gap-4">
		<span>{service.name}</span>
		<Sparkline data={service.latency} color={service.color} min={0} max={320} />
	</div>
{/each}`}
		>
			<div class="divide-neutral-muted flex w-full max-w-sm flex-col divide-y">
				{#each services as service (service.name)}
					<div class="flex items-center justify-between gap-4 py-2 text-sm">
						<span class="font-medium">{service.name}</span>
						<span class="flex items-center gap-3">
							<span class="text-neutral/70 tabular-nums"
								>{service.latency[service.latency.length - 1]} ms</span
							>
							<Sparkline
								data={service.latency}
								color={service.color}
								min={0}
								max={320}
								label="{service.name} latency"
							/>
						</span>
					</div>
				{/each}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
