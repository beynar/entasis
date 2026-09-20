<script lang="ts">
	import { Alert } from '$lib/components/Alert/index.js';
	import { Avatar, AvatarGroup } from '$lib/components/Avatar/index.js';
	import { Card } from '$lib/components/Card/index.js';
	import { Code } from '$lib/components/Code/index.js';
	import { Diff } from '$lib/components/Diff/index.js';
	import { Empty } from '$lib/components/Empty/index.js';
	import { Heading } from '$lib/components/Heading/index.js';
	import { Markdown } from '$lib/components/Markdown/index.js';
	import { MetadataList } from '$lib/components/MetadataList/index.js';
	import { Meter } from '$lib/components/Meter/index.js';
	import { ProgressCircle } from '$lib/components/ProgressCircle/index.js';
	import { QRCode } from '$lib/components/QRCode/index.js';
	import { Rating } from '$lib/components/Rating/index.js';
	import { Separator } from '$lib/components/Separator/index.js';
	import { Skeleton } from '$lib/components/Skeleton/index.js';
	import { Spinner } from '$lib/components/Spinner/index.js';
	import { SpinnerText } from '$lib/components/SpinnerText/index.js';
	import { Stat } from '$lib/components/Stat/index.js';
	import { Timeline } from '$lib/components/Timeline/index.js';
	import { plusIcon } from '$lib/components/Icons/plus.js';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import Matrix from './Matrix.svelte';
	import Section from './Section.svelte';
	import {
		avatarItems,
		colors,
		sampleCode,
		sampleMarkdown,
		samplePatch,
		sizes
	} from './fixtures.js';

	let { size = 'normal', density = 'normal' }: { size?: Sizes; density?: Density } = $props();

	const alertVariants = ['solid', 'outline', 'soft'] as const;
	const cardVariants = ['solid', 'outline', 'soft', 'ghost'] as const;
	const statVariants = ['solid', 'outline', 'soft', 'ghost'] as const;
	const spinnerVariants = ['default', 'grid', 'pulse', 'puff', 'lines', 'circles'] as const;
	const timelineVariants = ['ghost', 'card', 'outline', 'soft'] as const;
	const headingSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

	const timelineItems = [
		{ id: 1, title: 'Draft created', date: 'Mar 2', description: 'Initial outline.' },
		{
			id: 2,
			title: 'Review',
			date: 'Mar 5',
			description: 'Two approvals.',
			color: 'info' as const
		},
		{ id: 3, title: 'Published', date: 'Mar 9', color: 'success' as const }
	];

	const metadataItems = [
		{ key: 'owner', title: 'Owner', value: 'Ari Martin', type: 'text' as const },
		{ key: 'updated', title: 'Updated', value: new Date(2026, 2, 9), type: 'date' as const },
		{ key: 'public', title: 'Public', value: true, type: 'boolean' as const },
		{ key: 'tags', title: 'Tags', value: ['design', 'system'], type: 'chips' as const }
	];
</script>

<Section
	id="display"
	title="Display"
	description="Avatar, Card, Alert, Skeleton, Stat, Meter, ProgressCircle, Spinner, Rating, Code, Markdown, Heading, Separator, Timeline, MetadataList, Empty, QRCode, Diff."
>
	<Matrix caption="Avatar" varies="size, image vs initials, loading">
		{#each sizes as avatarSize (avatarSize)}
			<Avatar size={avatarSize} name="Ari Martin" />
		{/each}
		<Avatar {size} name="Sam Lee" loading />
	</Matrix>

	<Matrix caption="AvatarGroup" varies="size, max">
		{#each sizes as avatarSize (avatarSize)}
			<AvatarGroup size={avatarSize} items={avatarItems} max={3} />
		{/each}
		<AvatarGroup {size} items={avatarItems} />
	</Matrix>

	{#each alertVariants as variant (variant)}
		<Matrix caption="Alert — variant {variant}" varies="color" layout="grid" class="items-start">
			{#each colors as color (color)}
				<Alert
					{variant}
					{color}
					{size}
					title="Alert {color}"
					description="A short supporting sentence."
				/>
			{/each}
		</Matrix>
	{/each}

	<Matrix caption="Alert" varies="size, dismissible" layout="grid" class="items-start">
		{#each sizes as alertSize (alertSize)}
			<Alert
				variant="soft"
				color="info"
				size={alertSize}
				title="Size {alertSize}"
				description="Supporting copy."
			/>
		{/each}
		<Alert
			variant="outline"
			color="warning"
			{size}
			dismissible
			title="Dismissible"
			description="Has a close affordance."
		/>
	</Matrix>

	{#each cardVariants as variant (variant)}
		<Matrix caption="Card — variant {variant}" varies="color" layout="grid" class="items-start">
			{#each colors as color (color)}
				<Card
					{variant}
					{color}
					{size}
					{density}
					title="Card {color}"
					description="Card description line."
					content="Body content sits under the header."
				/>
			{/each}
		</Matrix>
	{/each}

	<Matrix caption="Card" varies="size, density, href" layout="grid" class="items-start">
		{#each sizes as cardSize (cardSize)}
			<Card
				variant="outline"
				color="neutral"
				size={cardSize}
				title="Size {cardSize}"
				content="Body copy."
			/>
		{/each}
		<Card
			variant="soft"
			color="primary"
			{size}
			href="#display"
			title="Linked card"
			content="Renders as an anchor."
		/>
	</Matrix>

	<Matrix caption="Skeleton" varies="color" layout="stack">
		{#each colors as color (color)}
			<Skeleton {color} class="h-3 w-full rounded-full" />
		{/each}
	</Matrix>

	{#each statVariants as variant (variant)}
		<Matrix caption="Stat — variant {variant}" varies="color" layout="grid" class="items-start">
			{#each colors as color (color)}
				<Stat
					{variant}
					{color}
					{size}
					{density}
					label="Revenue"
					value="$45.2k"
					trend="+12.4%"
					trendDirection="up"
					description="vs last month"
				/>
			{/each}
		</Matrix>
	{/each}

	<Matrix caption="Stat" varies="trendDirection, size" layout="grid" class="items-start">
		<Stat variant="outline" {size} label="Up" value="8,492" trend="+8.1%" trendDirection="up" />
		<Stat variant="outline" {size} label="Down" value="184ms" trend="-24ms" trendDirection="down" />
		<Stat variant="outline" {size} label="Flat" value="12" trend="0%" trendDirection="neutral" />
		{#each sizes as statSize (statSize)}
			<Stat variant="soft" color="primary" size={statSize} label="Size {statSize}" value="42" />
		{/each}
	</Matrix>

	<Matrix caption="Meter" varies="color, size, steps, legend" layout="stack">
		{#each colors as color (color)}
			<Meter {size} {color} label={color} value={62} showIndicatorAs="percentage" />
		{/each}
		{#each sizes as meterSize (meterSize)}
			<Meter size={meterSize} label="Size {meterSize}" value={45} color="primary" />
		{/each}
		<Meter
			{size}
			label="Stacked"
			showLegend
			value={[
				{ value: 30, color: 'primary', label: 'Design' },
				{ value: 25, color: 'info', label: 'Engineering' },
				{ value: 15, color: 'warning', label: 'Ops' }
			]}
		/>
	</Matrix>

	<Matrix caption="ProgressCircle" varies="color, size, value">
		{#each colors as color (color)}
			<ProgressCircle {color} {size} value={62} label="Progress {color}" />
		{/each}
		{#each sizes as circleSize (circleSize)}
			<ProgressCircle color="primary" size={circleSize} value={35} label="Size {circleSize}" />
		{/each}
		<ProgressCircle color="neutral" {size} label="Indeterminate" />
	</Matrix>

	{#each spinnerVariants as variant (variant)}
		<Matrix caption="Spinner — variant {variant}" varies="color, size">
			{#each colors as color (color)}
				<Spinner {variant} {color} {size} label="Loading {color}" />
			{/each}
			{#each sizes as spinnerSize (spinnerSize)}
				<Spinner {variant} color="neutral" size={spinnerSize} label="Size {spinnerSize}" />
			{/each}
		</Matrix>
	{/each}

	<Matrix caption="SpinnerText" varies="transition, shimmer, color, size" layout="stack">
		<SpinnerText {size} texts={['Collecting data', 'Rendering matrix', 'Almost there']} />
		<SpinnerText
			{size}
			transition="reveal"
			shimmer
			color="primary"
			texts={['Reveal transition', 'With shimmer']}
		/>
		{#each sizes as textSize (textSize)}
			<SpinnerText size={textSize} texts={['Size ' + textSize]} />
		{/each}
	</Matrix>

	<Matrix caption="Rating" varies="color, size, value, interactive">
		{#each colors as color (color)}
			<Rating {color} {size} value={3.5} max={5} />
		{/each}
		{#each sizes as ratingSize (ratingSize)}
			<Rating color="warning" size={ratingSize} value={4} />
		{/each}
		<Rating color="warning" {size} value={2} interactive />
		<Rating color="warning" {size} value={2} disabled />
	</Matrix>

	<Matrix caption="Heading" varies="size (h1-h6), weight, align, muted" layout="stack">
		{#each headingSizes as headingSize (headingSize)}
			<Heading size={headingSize}>Heading {headingSize}</Heading>
		{/each}
		<Heading size="h4" weight="light">Light weight</Heading>
		<Heading size="h4" weight="bold" underline>Bold underlined</Heading>
		<Heading size="h4" muted align="center">Muted centered</Heading>
	</Matrix>

	<Matrix caption="Separator" varies="orientation, color, align, children" layout="stack">
		{#each colors as color (color)}
			<Separator {color} />
		{/each}
		<Separator color="neutral">or</Separator>
		<Separator color="primary" align="start">Section</Separator>
		<div class="gap-md flex h-12 items-center">
			<span class="text-neutral/60 text-xs">left</span>
			<Separator orientation="vertical" color="neutral" />
			<span class="text-neutral/60 text-xs">right</span>
		</div>
	</Matrix>

	{#each timelineVariants as variant (variant)}
		<Matrix
			caption="Timeline — variant {variant}"
			varies="color, placement"
			layout="grid"
			class="items-start"
		>
			<Timeline {variant} {size} {density} color="primary" items={timelineItems} />
			<Timeline
				{variant}
				{size}
				{density}
				color="neutral"
				placement="alternate"
				items={timelineItems}
			/>
			<Timeline
				{variant}
				{size}
				{density}
				color="info"
				orientation="horizontal"
				items={timelineItems}
			/>
		</Matrix>
	{/each}

	<Matrix caption="MetadataList" varies="columns, size, density" layout="grid" class="items-start">
		<MetadataList {size} {density} items={metadataItems} title="Document" />
		<MetadataList {size} {density} items={metadataItems} columns={2} title="Two columns" />
		{#each sizes as listSize (listSize)}
			<MetadataList size={listSize} {density} items={metadataItems} title="Size {listSize}" />
		{/each}
	</Matrix>

	<Matrix
		caption="Empty"
		varies="mode, mediaVariant, bordered, size"
		layout="grid"
		class="items-start"
	>
		<Empty
			{size}
			title="No projects"
			description="Create your first project to get started."
			actions={[{ content: 'New project', color: 'primary', prefix: plusIcon }]}
		/>
		<Empty
			{size}
			mode="card"
			bordered
			media={folderIcon}
			mediaVariant="icon"
			title="Card mode"
			description="Bordered empty surface."
		/>
		{#each sizes as emptySize (emptySize)}
			<Empty size={emptySize} title="Size {emptySize}" description="Supporting copy." />
		{/each}
	</Matrix>

	<Matrix caption="QRCode" varies="color, size">
		{#each colors as color (color)}
			<QRCode value="https://entasis.dev" {color} {size} label="QR {color}" />
		{/each}
		{#each sizes as qrSize (qrSize)}
			<QRCode value="https://entasis.dev" color="neutral" size={qrSize} label="QR {qrSize}" />
		{/each}
	</Matrix>

	<Matrix caption="Code" varies="showLineNumbers, wrap, header" layout="grid" class="items-start">
		<Code code={sampleCode} language="ts" title="greet.ts" />
		<Code code={sampleCode} language="ts" showLineNumbers showHeader={false} />
		<Code code={sampleCode} language="ts" wrap copyable={false} />
	</Matrix>

	<Matrix caption="Markdown" varies="size" layout="grid" class="items-start">
		{#each sizes as mdSize (mdSize)}
			<Markdown size={mdSize} content={sampleMarkdown} />
		{/each}
	</Matrix>

	<Matrix caption="Diff" varies="diffStyle, lineNumbers" layout="stack">
		<Diff patch={samplePatch} lineNumbers />
		<Diff patch={samplePatch} diffStyle="split" />
	</Matrix>
</Section>
