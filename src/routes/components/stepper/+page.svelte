<script lang="ts">
	import Stepper from '$lib/components/Stepper/Stepper.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const stepperModes = ['classic', 'vertical'] as const;
	const controls = createComponentControls([
		{
			name: 'mode',
			type: 'segmented',
			label: 'Mode',
			value: 'classic',
			options: stepperModes
		}
	]);

	type StepperItem = {
		title: string;
		description: string;
		content: string;
		icon: string;
	};

	type StepperPanel = {
		eyebrow: string;
		title: string;
		description: string;
		detail: string;
		height: string;
		card: string;
		accent: string;
		text: string;
		chips: string[];
	};

	let items = $state<StepperItem[]>([
		{
			title: 'Step 1',
			description: 'Start the flow.',
			content: 'First step content.',
			icon: 'chevron'
		},
		{
			title: 'Step 2',
			description: 'Continue the flow.',
			content: 'Second step content.',
			icon: 'chevron'
		},
		{
			title: 'Step 3',
			description: 'Finish the flow.',
			content: 'Third step content.',
			icon: 'chevron'
		}
	]);

	let syncedStep = $state(0);

	const syncedPanels = [
		{
			eyebrow: 'Brief',
			title: 'Collect the signal',
			description: 'A compact panel for the first step.',
			detail: 'Both steppers read the same activeStep value.',
			height: 'min-h-[170px]',
			card: 'border-primary/30 bg-primary/10',
			accent: 'bg-primary',
			text: 'text-primary',
			chips: ['shared state', 'compact']
		},
		{
			eyebrow: 'Work',
			title: 'Expand with content',
			description: 'This step is intentionally taller, so the outer Stepper height should grow.',
			detail:
				'Use the controls inside either panel. The sibling Stepper should move and resize without blocking clicks.',
			height: 'min-h-[270px]',
			card: 'border-success/30 bg-success/10',
			accent: 'bg-success',
			text: 'text-success',
			chips: ['dynamic height', 'clickable controls', 'sync']
		},
		{
			eyebrow: 'Review',
			title: 'Settle back down',
			description: 'The final step is shorter again to show the height contraction.',
			detail: 'Previous remains clickable even after the track has translated.',
			height: 'min-h-[210px]',
			card: 'border-warning/40 bg-warning/10',
			accent: 'bg-warning',
			text: 'text-warning',
			chips: ['contract', 'finish']
		}
	] satisfies [StepperPanel, StepperPanel, StepperPanel];

	const usageCode = $derived(`<script lang="ts">
	const items = [
		{
			title: 'Collect the signal',
			height: 'min-h-[170px]',
			card: 'border-primary/30 bg-primary/10',
			accent: 'bg-primary',
			text: 'text-primary'
		},
		{
			title: 'Expand with content',
			height: 'min-h-[270px]',
			card: 'border-success/30 bg-success/10',
			accent: 'bg-success',
			text: 'text-success'
		},
		{
			title: 'Settle back down',
			height: 'min-h-[210px]',
			card: 'border-warning/40 bg-warning/10',
			accent: 'bg-warning',
			text: 'text-warning'
		}
	];
${'</' + 'script>'}

<Stepper {items} mode="${controls.value.mode}" class="w-full rounded-lg border border-neutral-muted bg-surface/30">
	{#snippet children({ stepper, item, index })}
		<div class="p-3">
			<div class="{item.card} {item.height} grid gap-4 rounded-md border p-5">
				<p class="{item.text} text-xs font-semibold uppercase tracking-wide">
					Step {index + 1}
				</p>
				<h3 class="text-2xl font-semibold">{item.title}</h3>
				<div class="mt-auto flex gap-2">
					{#if index > 0}
						<button onclick={() => stepper.previous()}>Previous</button>
					{/if}
					{#if index < items.length - 1}
						<button class={item.accent} onclick={() => stepper.next()}>Next</button>
					{/if}
				</div>
			</div>
		</div>
	{/snippet}
</Stepper>`;
</script>

<DocPage
	title="Stepper"
	subtitle="Indicates progress through a sequence of steps."
	component="Stepper"
	features={[
		'Bindable activeStep and stepper state',
		'tabpanel by default, neutral panels when needed',
		'Animated height and horizontal slide',
		'Repeated children snippet payload'
	]}
>
	<ComponentCard
		{controls}
		description="Each panel can carry its own content and height; the Stepper follows the active panel."
		code={usageCode}
	>
		<Stepper
			items={syncedPanels}
			mode={controls.value.mode}
			class="w-full rounded-lg border border-neutral-muted bg-surface/30"
		>
			{#snippet children({ stepper, item, index })}
				<div class="p-3">
					<div class="{item.card} {item.height} grid gap-4 rounded-md border p-5">
						<div class="flex items-start justify-between gap-4">
							<div>
								<p class="{item.text} text-xs font-semibold uppercase tracking-wide">
									Usage / {item.eyebrow}
								</p>
								<h3 class="mt-1 text-2xl font-semibold">{item.title}</h3>
							</div>
							<div class="{item.accent} h-12 w-12 rounded-full"></div>
						</div>

						<p class="text-neutral/60 max-w-xl">{item.description}</p>

						<div class="flex flex-wrap gap-2">
							{#each item.chips as chip}
								<span class="{item.text} bg-surface/60 rounded px-2 py-1 text-xs">
									{chip}
								</span>
							{/each}
						</div>

						<div class="mt-auto flex gap-2">
							{#if index > 0}
								<button class="rounded bg-surface/70 px-3 py-1.5" onclick={() => stepper.previous()}
									>previous</button
								>
							{/if}
							{#if index < syncedPanels.length - 1}
								<button class="{item.accent} rounded px-3 py-1.5" onclick={() => stepper.next()}
									>next</button
								>
							{/if}
						</div>
					</div>
				</div>
			{/snippet}
		</Stepper>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Two steppers share activeStep while each step drives its own panel height."
			class="!items-start"
		>
			<div class="grid w-full gap-5">
				<div class="flex flex-wrap gap-2">
					{#each items as item, index}
						{@const panel = syncedPanels[index] ?? syncedPanels[0]}
						<button
							class="rounded border px-3 py-1.5 text-sm font-medium transition {syncedStep === index
								? `${panel.card} ${panel.text}`
								: 'border-neutral-muted bg-neutral-muted/60 text-neutral/60'}"
							onclick={() => {
								syncedStep = index;
							}}
						>
							{item.title}
						</button>
					{/each}
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<Stepper
						bind:value={syncedStep}
						{items}
						class="rounded-lg border border-neutral-muted bg-surface/30"
					>
						{#snippet children({ stepper, item, index })}
							{@const panel = syncedPanels[index] ?? syncedPanels[0]}
							<div class="p-3">
								<div class="{panel.card} {panel.height} grid gap-4 rounded-md border p-5">
									<div class="flex items-center justify-between gap-3">
										<div>
											<p class="{panel.text} text-xs font-semibold uppercase tracking-wide">
												Left stepper / {panel.eyebrow}
											</p>
											<h3 class="mt-1 text-2xl font-semibold">{item.title}</h3>
										</div>
										<div class="{panel.accent} h-10 w-10 rounded-full"></div>
									</div>

									<div class="grid gap-2">
										<p class="text-lg font-medium">{panel.title}</p>
										<p class="text-neutral/60 max-w-xl">{panel.description}</p>
									</div>

									<div class="flex flex-wrap gap-2">
										{#each panel.chips as chip}
											<span class="{panel.text} bg-surface/60 rounded px-2 py-1 text-xs">
												{chip}
											</span>
										{/each}
									</div>

									<div class="mt-auto flex gap-2">
										{#if index > 0}
											<button
												class="rounded bg-surface/70 px-3 py-1.5"
												onclick={() => stepper.previous()}>previous</button
											>
										{/if}
										{#if index < items.length - 1}
											<button
												class="{panel.accent} rounded px-3 py-1.5"
												onclick={() => stepper.next()}>next</button
											>
										{/if}
									</div>
								</div>
							</div>
						{/snippet}
					</Stepper>

					<Stepper
						bind:value={syncedStep}
						{items}
						class="rounded-lg border border-neutral-muted bg-surface/30"
					>
						{#snippet children({ stepper, item, index })}
							{@const panel = syncedPanels[index] ?? syncedPanels[0]}
							<div class="p-3">
								<div class="{panel.card} {panel.height} grid gap-4 rounded-md border p-5">
									<div class="flex items-center justify-between gap-3">
										<div>
											<p class="{panel.text} text-xs font-semibold uppercase tracking-wide">
												Right stepper / {panel.eyebrow}
											</p>
											<h3 class="mt-1 text-2xl font-semibold">{item.title}</h3>
										</div>
										<div class="{panel.accent} h-10 w-1 rounded-full"></div>
									</div>

									<div class="grid gap-2">
										<p class="text-lg font-medium">{item.content}</p>
										<p class="text-neutral/60 max-w-xl">{panel.detail}</p>
									</div>

									<div class="grid gap-2 text-sm">
										<div class="bg-surface/50 h-2 overflow-hidden rounded-full">
											<div
												class="{panel.accent} h-full"
												style:width={`${(index + 1) * 33.33}%`}
											></div>
										</div>
										<p class="text-neutral/60">Active panel {index + 1} of 3</p>
									</div>

									<div class="mt-auto flex gap-2">
										{#if index > 0}
											<button
												class="rounded bg-surface/70 px-3 py-1.5"
												onclick={() => stepper.previous()}>previous</button
											>
										{/if}
										{#if index < items.length - 1}
											<button
												class="{panel.accent} rounded px-3 py-1.5"
												onclick={() => stepper.next()}>next</button
											>
										{/if}
									</div>
								</div>
							</div>
						{/snippet}
					</Stepper>
				</div>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
