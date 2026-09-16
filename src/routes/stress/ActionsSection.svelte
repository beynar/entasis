<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import { ButtonGroup } from '$lib/components/ButtonGroup/index.js';
	import { Chip } from '$lib/components/Chip/index.js';
	import { Kbd } from '$lib/components/Kbd/index.js';
	import { SegmentedControl } from '$lib/components/SegmentedControl/index.js';
	import { ToggleButton } from '$lib/components/ToggleButton/index.js';
	import { ToggleButtonGroup } from '$lib/components/ToggleButtonGroup/index.js';
	import { checkIcon } from '$lib/components/Icons/check.js';
	import { plusIcon } from '$lib/components/Icons/plus.js';
	import { starIcon } from '$lib/components/Icons/star.js';
	import type { Sizes } from '$lib/types/theme.js';
	import Matrix from './Matrix.svelte';
	import Section from './Section.svelte';
	import { colors, sizes } from './fixtures.js';

	let { size = 'normal' }: { size?: Sizes } = $props();

	const buttonVariants = ['solid', 'outline', 'soft', 'ghost', 'link'] as const;
	const chipVariants = ['solid', 'outline', 'soft'] as const;
	const toggleVariants = ['outline', 'ghost'] as const;
	const segmentedVariants = ['normal', 'pill'] as const;

	const segmentedItems = [
		{ value: 'day', label: 'Day' },
		{ value: 'week', label: 'Week' },
		{ value: 'month', label: 'Month' }
	];
</script>

<Section
	id="actions"
	title="Actions"
	description="Button, ButtonGroup, ToggleButton, ToggleButtonGroup, SegmentedControl, Chip, Kbd."
>
	{#each buttonVariants as variant (variant)}
		<Matrix caption="Button — variant {variant}" varies="color (7 roles)">
			{#each colors as color (color)}
				<Button {variant} {color} {size} prefix={checkIcon}>{color}</Button>
			{/each}
		</Matrix>
	{/each}

	<Matrix caption="Button" varies="size, squared, fullWidth" layout="stack">
		<div class="gap-sm flex flex-wrap items-center">
			{#each sizes as buttonSize (buttonSize)}
				<Button variant="solid" color="primary" size={buttonSize}>{buttonSize}</Button>
			{/each}
			{#each sizes as buttonSize (buttonSize)}
				<Button
					variant="outline"
					color="primary"
					size={buttonSize}
					squared
					prefix={plusIcon}
					label="Add"
				/>
			{/each}
		</div>
		<Button variant="soft" color="info" {size} fullWidth>Full width</Button>
	</Matrix>

	<Matrix caption="Button" varies="state (disabled, loading), variant">
		{#each buttonVariants as variant (variant)}
			<Button {variant} color="primary" {size} disabled>{variant} disabled</Button>
		{/each}
		{#each buttonVariants as variant (variant)}
			<Button {variant} color="primary" {size} loading>{variant} loading</Button>
		{/each}
	</Matrix>

	<Matrix caption="Button" varies="link rendering (href)">
		<Button {size} href="#actions" variant="link" color="primary">Anchor link</Button>
		<Button {size} href="#actions" variant="outline" color="neutral" suffix={starIcon}>
			Anchor button
		</Button>
	</Matrix>

	{#each buttonVariants as variant (variant)}
		<Matrix caption="ButtonGroup — variant {variant}" varies="color">
			{#each colors as color (color)}
				<ButtonGroup
					{variant}
					{color}
					{size}
					items={[{ children: 'Cut' }, { children: 'Copy' }, { children: 'Paste' }]}
				/>
			{/each}
		</Matrix>
	{/each}

	<Matrix caption="ButtonGroup" varies="size, disabled">
		{#each sizes as groupSize (groupSize)}
			<ButtonGroup
				variant="outline"
				color="neutral"
				size={groupSize}
				items={[{ children: 'One' }, { children: 'Two' }]}
			/>
		{/each}
		<ButtonGroup
			variant="outline"
			color="neutral"
			{size}
			disabled
			items={[{ children: 'One' }, { children: 'Two' }]}
		/>
	</Matrix>

	{#each toggleVariants as variant (variant)}
		<Matrix caption="ToggleButton — variant {variant}" varies="color, pressed state">
			{#each colors as color (color)}
				<ToggleButton {variant} {color} {size} defaultValue={true}>{color} on</ToggleButton>
			{/each}
			{#each colors as color (color)}
				<ToggleButton {variant} {color} {size}>{color} off</ToggleButton>
			{/each}
		</Matrix>
	{/each}

	<Matrix caption="ToggleButton" varies="size, disabled">
		{#each sizes as toggleSize (toggleSize)}
			<ToggleButton variant="outline" color="primary" size={toggleSize} defaultValue={true}>
				{toggleSize}
			</ToggleButton>
		{/each}
		<ToggleButton variant="outline" color="primary" {size} disabled>disabled</ToggleButton>
	</Matrix>

	<Matrix caption="ToggleButtonGroup" varies="color, joined, type" layout="stack">
		<div class="gap-sm flex flex-wrap items-center">
			{#each colors as color (color)}
				<ToggleButtonGroup
					label="Text formatting {color}"
					{color}
					{size}
					variant="outline"
					joined
					items={[
						{ value: 'bold', children: 'B' },
						{ value: 'italic', children: 'I' },
						{ value: 'underline', children: 'U' }
					]}
					defaultValue={['bold']}
				/>
			{/each}
		</div>
		<div class="gap-sm flex flex-wrap items-center">
			<ToggleButtonGroup
				label="Single select"
				type="single"
				color="primary"
				{size}
				variant="ghost"
				items={[
					{ value: 'left', children: 'Left' },
					{ value: 'center', children: 'Center' }
				]}
				defaultValue="left"
			/>
			<ToggleButtonGroup
				label="Disabled group"
				color="neutral"
				{size}
				variant="outline"
				disabled
				items={[
					{ value: 'one', children: 'One' },
					{ value: 'two', children: 'Two' }
				]}
			/>
		</div>
	</Matrix>

	{#each segmentedVariants as variant (variant)}
		<Matrix caption="SegmentedControl — variant {variant}" varies="color">
			{#each colors as color (color)}
				<SegmentedControl
					{variant}
					{color}
					{size}
					label="Range {color} {variant}"
					items={segmentedItems}
					defaultValue="week"
				/>
			{/each}
		</Matrix>
	{/each}

	<Matrix caption="SegmentedControl" varies="size, disabled">
		{#each sizes as controlSize (controlSize)}
			<SegmentedControl
				color="primary"
				size={controlSize}
				label="Range {controlSize}"
				items={segmentedItems}
				defaultValue="day"
			/>
		{/each}
		<SegmentedControl
			color="neutral"
			{size}
			disabled
			label="Range disabled"
			items={segmentedItems}
			defaultValue="day"
		/>
	</Matrix>

	{#each chipVariants as variant (variant)}
		<Matrix caption="Chip — variant {variant}" varies="color">
			{#each colors as color (color)}
				<Chip {variant} {color} {size}>{color}</Chip>
			{/each}
		</Matrix>
	{/each}

	<Matrix caption="Chip" varies="size, prefix, disabled, href">
		{#each sizes as chipSize (chipSize)}
			<Chip variant="soft" color="primary" size={chipSize} prefix={starIcon}>{chipSize}</Chip>
		{/each}
		<Chip variant="solid" color="neutral" {size} disabled>disabled</Chip>
		<Chip variant="outline" color="info" {size} href="#actions">link chip</Chip>
	</Matrix>

	<Matrix caption="Kbd" varies="color, size">
		{#each colors as color (color)}
			<Kbd {color} {size} keys={['Meta', 'K']} />
		{/each}
		{#each sizes as kbdSize (kbdSize)}
			<Kbd color="neutral" size={kbdSize} keys={['Ctrl', 'Shift', 'P']} />
		{/each}
	</Matrix>
</Section>
