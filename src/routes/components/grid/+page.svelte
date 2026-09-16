<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { Grid, GridSpan } from '$lib/components/Grid/index.js';
	import { Stack } from '$lib/components/Stack/index.js';
	import { resolveContainerBreakpoint } from '$lib/components/Theme/responsive.js';
	import { chartLineUpIcon } from '$lib/components/Icons/chartLineUp.js';
	import { clockIcon } from '$lib/components/Icons/clock.js';
	import { usersThreeIcon } from '$lib/components/Icons/usersThree.js';

	const metrics = [
		{
			label: 'Revenue',
			value: '$42.8k',
			change: '+12.4%',
			icon: chartLineUpIcon,
			color: 'primary'
		},
		{
			label: 'Active users',
			value: '8,429',
			change: '+8.1%',
			icon: usersThreeIcon,
			color: 'success'
		},
		{ label: 'Cycle time', value: '2.4d', change: '-0.6d', icon: clockIcon, color: 'warning' }
	] as const;
	const metricIconClasses = {
		primary: 'bg-primary/12 text-primary-readable',
		success: 'bg-success/12 text-success-readable',
		warning: 'bg-warning/12 text-warning'
	} as const;

	const panels = Array.from({ length: 6 }, (_, index) => index + 1);
	const layoutGaps = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
	const controls = createComponentControls([
		{
			name: 'hostWidth',
			type: 'slider',
			label: 'Host width',
			value: 720,
			min: 280,
			max: 1200,
			step: 20,
			showValue: true
		},
		{
			name: 'gap',
			type: 'segmented',
			label: 'Gap',
			value: 'xl',
			options: layoutGaps
		}
	]);

	// The host is capped by the preview, so the label reads the width the grid was really handed.
	let measuredWidth = $state(0);
	const activeBreakpoint = $derived(resolveContainerBreakpoint(measuredWidth));
</script>

<DocPage
	title="Grid"
	subtitle="Builds fixed, intrinsic or per-breakpoint CSS grids that reflow by their own width."
	component="Grid"
	features={[
		'Fixed and responsive columns',
		'Per-breakpoint columns and gaps',
		'Steps on the grid width, not the viewport',
		'Auto-fill or auto-fit behavior',
		'Maximum responsive column count',
		'Independent row and column gaps',
		'Implicit row sizing for spans'
	]}
>
	<ComponentCard
		{controls}
		description="One metric grid, resized by its host. The steps are the grid's own width: xs below 36rem, then sm 36rem, md 42rem, lg 56rem, xl 72rem."
		class="min-h-[420px]"
		code={`<Grid columns={{ xs: 1, sm: 2, lg: 3 }} gap="${controls.value.gap}">
	{#each metrics as metric}
		<article class="rounded-lg border p-4">
			<span>{metric.label}</span>
			<strong>{metric.value}</strong>
		</article>
	{/each}
</Grid>`}
	>
		<Stack gap="md" align="center" width="100%">
			<span class="text-neutral/70 font-mono text-[11px]">
				{measuredWidth}px wide → {activeBreakpoint}
			</span>
			<div
				bind:clientWidth={measuredWidth}
				style:width="{controls.value.hostWidth}px"
				class="max-w-full"
			>
				<Grid columns={{ xs: 1, sm: 2, lg: 3 }} gap={controls.value.gap}>
					{#each metrics as metric (metric.label)}
						<Stack gap="xl" padding="xl" class="border-neutral-muted bg-surface rounded-lg border">
							<Stack orientation="horizontal" align="center" justify="between">
								<span class="text-neutral/70 text-xs font-medium">{metric.label}</span>
								<span
									class="{metricIconClasses[
										metric.color
									]} flex size-8 items-center justify-center rounded-md"
								>
									{@render metric.icon({ class: 'size-4' })}
								</span>
							</Stack>
							<Stack gap="xs">
								<strong class="text-neutral text-2xl">{metric.value}</strong>
								<span class="text-success-readable text-xs">{metric.change} this month</span>
							</Stack>
						</Stack>
					{/each}
				</Grid>
			</div>
		</Stack>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Narrow host, wide host"
			description="The same grid twice. Breakpoints measure the box the grid was given, so the one in a 320px column stays single-file while the full-width one runs four across."
			code={`<Grid columns={{ xs: 1, sm: 2, lg: 4 }} gap={{ xs: 'sm', lg: 'lg' }}>
	{#each panels as panel}
		<div>Panel {panel}</div>
	{/each}
</Grid>`}
		>
			<Stack gap="xl" width="100%">
				<Stack gap="sm">
					<span class="text-neutral/70 font-mono text-[11px]">320px host</span>
					<div class="w-[320px] max-w-full">
						<Grid columns={{ xs: 1, sm: 2, lg: 4 }} gap={{ xs: 'sm', lg: 'lg' }}>
							{#each panels.slice(0, 4) as panel (panel)}
								<div
									class="border-neutral-muted bg-surface text-neutral flex min-h-16 items-center justify-center rounded-md border text-sm"
								>
									Panel {panel}
								</div>
							{/each}
						</Grid>
					</div>
				</Stack>
				<Stack gap="sm">
					<span class="text-neutral/70 font-mono text-[11px]">full-width host</span>
					<Grid columns={{ xs: 1, sm: 2, lg: 4 }} gap={{ xs: 'sm', lg: 'lg' }}>
						{#each panels.slice(0, 4) as panel (panel)}
							<div
								class="border-neutral-muted bg-surface text-neutral flex min-h-16 items-center justify-center rounded-md border text-sm"
							>
								Panel {panel}
							</div>
						{/each}
					</Grid>
				</Stack>
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Fixed columns"
			description="Numeric columns create equal tracks with min-width protection."
			code={`<Grid columns={3} gap="lg">
	<div>One</div>
	<div>Two</div>
	<div>Three</div>
</Grid>`}
		>
			<Grid columns={3} gap="lg" width="100%" maxWidth={720}>
				{#each panels.slice(0, 3) as panel (panel)}
					<div
						class="border-neutral-muted bg-surface-raised text-neutral flex min-h-24 items-center justify-center rounded-md border text-sm font-medium"
					>
						{panel}
					</div>
				{/each}
			</Grid>
		</ComponentCard>

		<ComponentCard
			title="Responsive tracks"
			description="Minimum track width determines when columns wrap; max prevents over-expansion on wide screens. This object is a track configuration, not a breakpoint record."
			code={`<Grid columns={{ minWidth: 140, max: 4 }} gap="lg">
	{#each items as item}
		<div>{item}</div>
	{/each}
</Grid>`}
		>
			<Grid columns={{ minWidth: 140, max: 4 }} gap="lg" width="100%" maxWidth={840}>
				{#each panels as panel (panel)}
					<div
						class="border-neutral-muted bg-surface text-neutral flex min-h-20 items-center justify-center rounded-md border text-sm"
					>
						Panel {panel}
					</div>
				{/each}
			</Grid>
		</ComponentCard>

		<ComponentCard
			title="Spans that follow the grid"
			description="A GridSpan has no width of its own to measure, so its breakpoints are the grid's: the feature panel is a full row until the grid reaches 42rem."
			code={`<Grid columns={{ xs: 1, md: 3 }} gap="lg">
	<GridSpan columns={{ xs: 'full', md: 2 }}>Featured</GridSpan>
	<GridSpan>Sidebar</GridSpan>
</Grid>`}
		>
			<Grid columns={{ xs: 1, md: 3 }} gap="lg" width="100%" maxWidth={840}>
				<GridSpan columns={{ xs: 'full', md: 2 }}>
					<div
						class="border-neutral-muted bg-surface-raised text-neutral flex min-h-24 items-center justify-center rounded-md border text-sm font-medium"
					>
						Featured
					</div>
				</GridSpan>
				<GridSpan>
					<div
						class="border-neutral-muted bg-surface text-neutral flex min-h-24 items-center justify-center rounded-md border text-sm"
					>
						Sidebar
					</div>
				</GridSpan>
			</Grid>
		</ComponentCard>

		<ComponentCard
			title="Auto-fill and auto-fit"
			description="Fill preserves empty tracks; fit collapses them so present items stretch."
			code={`<Grid columns={{ minWidth: 150, repeat: 'fill' }} gap="lg">...</Grid>
<Grid columns={{ minWidth: 150, repeat: 'fit' }} gap="lg">...</Grid>`}
		>
			<Stack gap="xl" width="100%" maxWidth={780}>
				<Stack gap="md">
					<span class="text-neutral/70 font-mono text-[11px]">fill</span>
					<Grid columns={{ minWidth: 150, repeat: 'fill' }} gap="lg">
						<div class="bg-primary/12 text-primary-readable rounded-md p-4 text-center text-sm">
							Alpha
						</div>
						<div class="bg-secondary/12 text-secondary rounded-md p-4 text-center text-sm">
							Beta
						</div>
					</Grid>
				</Stack>
				<Stack gap="md">
					<span class="text-neutral/70 font-mono text-[11px]">fit</span>
					<Grid columns={{ minWidth: 150, repeat: 'fit' }} gap="lg">
						<div class="bg-primary/12 text-primary-readable rounded-md p-4 text-center text-sm">
							Alpha
						</div>
						<div class="bg-secondary/12 text-secondary rounded-md p-4 text-center text-sm">
							Beta
						</div>
					</Grid>
				</Stack>
			</Stack>
		</ComponentCard>
	{/snippet}
</DocPage>
