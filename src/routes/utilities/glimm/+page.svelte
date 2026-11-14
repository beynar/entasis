<script lang="ts">
	import Chip from '$lib/components/Chip/Chip.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import Card from '$lib/components/Card/Card.svelte';
	import Stack from '$lib/components/Stack/Stack.svelte';
	import {
		glimm,
		type GlimmDirection,
		type GlimmOptions,
		type GlimmPalette,
		type GlimmPreset
	} from '$lib/utils/glimm/index.js';
	import type { Colors } from '$lib/types/theme.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const colors = ['primary', 'secondary', 'info', 'success', 'warning', 'danger', 'neutral'];
	const presets = ['default', 'reveal', 'glint', 'ripple', 'double', 'split', 'wave'];
	const palettes = ['color', 'spectrum', 'prism', 'berry', 'lagoon', 'citrus', 'azure', 'ember'];
	const directions = ['ltr', 'rtl', 'ttb', 'btt'] as const;
	const controls = createComponentControls([
		{ name: 'color', type: 'segmented', label: 'Color', value: 'primary', options: colors },
		{ name: 'preset', type: 'segmented', label: 'Preset', value: 'default', options: presets },
		{ name: 'palette', type: 'segmented', label: 'Palette', value: 'color', options: palettes },
		{ name: 'direction', type: 'segmented', label: 'Direction', value: 'ltr', options: directions }
	]);

	const sweepOptions = $derived<GlimmOptions>({
		color: controls.value.color as Colors,
		preset:
			controls.value.preset === 'default' ? undefined : (controls.value.preset as GlimmPreset),
		palette:
			controls.value.palette === 'color' ? undefined : (controls.value.palette as GlimmPalette),
		direction: controls.value.direction as GlimmDirection
	});

	type Plan = { name: string; price: string; features: string[] };
	const plans: Plan[] = [
		{ name: 'Free', price: '€0', features: ['3 projects', 'Community support', '1 GB storage'] },
		{
			name: 'Pro',
			price: '€24',
			features: ['Unlimited projects', 'Priority support', '100 GB storage']
		}
	];
	let planIndex = $state(0);
	const plan = $derived(plans[planIndex]);
	let planCard = $state<HTMLElement | null>(null);

	const switchPlan = () => {
		if (!planCard) return;
		glimm(planCard, { ...sweepOptions, change: () => (planIndex = 1 - planIndex) });
	};

	let highlightCard = $state<HTMLElement | null>(null);
	const highlight = () => {
		if (highlightCard) glimm(highlightCard, sweepOptions);
	};

	const reports = [
		{ week: 'Week 45', line: 'Revenue is up 12% on last week.' },
		{ week: 'Week 46', line: 'Revenue is down 3% on last week.' }
	];
	let reportIndex = $state(0);
	let presetCard = $state<HTMLElement | null>(null);
	const playPreset = (preset: GlimmPreset) => {
		if (!presetCard) return;
		glimm(presetCard, { ...sweepOptions, preset, change: () => (reportIndex = 1 - reportIndex) });
	};

	let rippleCount = $state(0);
	let rippleCard = $state<HTMLElement | null>(null);
	const ripple = (event: MouseEvent) => {
		if (!rippleCard) return;
		glimm(rippleCard, {
			...sweepOptions,
			preset: 'ripple',
			origin: event,
			change: () => (rippleCount += 1)
		});
	};

	let saving = $state(false);
	let savedCount = $state(0);
	let asyncCard = $state<HTMLElement | null>(null);
	const save = () => {
		if (!asyncCard || saving) return;
		saving = true;
		glimm(asyncCard, {
			...sweepOptions,
			change: async () => {
				await new Promise((resolve) => setTimeout(resolve, 900));
				savedCount += 1;
				saving = false;
			}
		});
	};

	const optionsCode = $derived(
		[
			`color: '${controls.value.color}'`,
			controls.value.preset !== 'default' && `preset: '${controls.value.preset}'`,
			controls.value.palette !== 'color' && `palette: '${controls.value.palette}'`,
			controls.value.direction !== 'ltr' && `direction: '${controls.value.direction}'`
		]
			.filter(Boolean)
			.join(',\n\t')
	);
</script>

<DocPage
	title="Glimm"
	subtitle="Plays a glimm sweep over any element: an iridescent WebGL band crosses it, and a change made with it lands behind the band while the content ahead still shows the old one."
	features={[
		'One function call on an element, no wrapper component',
		'The new content shows behind the band, the old one ahead of it',
		'Drawn above dialogs, clipped to rounded corners and scroll containers',
		'Coloured by the theme: a semantic role, or several blended along the band',
		'Six shapes: a band, a corner glint, a ring from a click, bands closing in or opening out, a wave',
		'Reduced motion and missing WebGL apply the change at once'
	]}
>
	<ComponentCard
		{controls}
		description="Pass the update as `change`: it runs as the sweep starts, and the band reveals its result."
		code={`import { glimm } from 'entasis/glimm';

glimm(card, {
	${optionsCode},
	change: () => (plan = plan === 'free' ? 'pro' : 'free')
});`}
	>
		<Stack gap="md" class="w-full max-w-sm">
			<Card bind:ref={planCard} title="{plan.name} plan" description="Billed monthly">
				<Stack gap="sm">
					<p class="text-3xl font-semibold">
						{plan.price}<span class="text-neutral/70 text-sm font-normal"> / month</span>
					</p>
					<ul class="text-sm">
						{#each plan.features as feature (feature)}
							<li>{feature}</li>
						{/each}
					</ul>
				</Stack>
			</Card>
			<Button onclick={switchPlan}>
				{planIndex === 0 ? 'Upgrade to Pro' : 'Back to Free'}
			</Button>
		</Stack>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Glint"
			description="Without `change`, the default is a glint: a thin streak of light from a corner that draws the eye to the element."
			code={`glimm(element, {
	${optionsCode}
});`}
		>
			<Stack gap="md" class="w-full max-w-sm">
				<Card bind:ref={highlightCard} title="New invoice" description="INV-2041 · due in 14 days">
					<p class="text-sm">Acme Corp sent an invoice for €1,240.00.</p>
				</Card>
				<Button variant="outline" onclick={highlight}>Glint</Button>
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Presets"
			description="Each preset is a shape and a timing: the change shows behind it, cut along the same shape. Options passed with a preset win over its values."
			code={`glimm(card, { preset: 'double', change: () => (week += 1) });`}
		>
			<Stack gap="md" class="w-full max-w-sm">
				<Card
					bind:ref={presetCard}
					title={reports[reportIndex].week}
					description="Updated 2 minutes ago"
				>
					<p class="text-sm">{reports[reportIndex].line}</p>
				</Card>
				<Stack orientation="horizontal" gap="sm" justify="center" wrap="wrap">
					{#each ['reveal', 'glint', 'ripple', 'double', 'split', 'wave'] as const as preset (preset)}
						<Button variant="outline" size="small" onclick={() => playPreset(preset)}>
							{preset}
						</Button>
					{/each}
				</Stack>
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Ripple from a click"
			description="Pass the pointer event as `origin`: the ring grows from where the element was pressed."
			code={`<Card onclick={(event) => glimm(card, { preset: 'ripple', origin: event, change })}>`}
		>
			<Stack gap="md" class="w-full max-w-sm">
				<Card
					bind:ref={rippleCard}
					onclick={ripple}
					title="Click anywhere on this card"
					description="The ring starts under the pointer"
				>
					<p class="text-sm">Clicked {rippleCount} times</p>
				</Card>
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Slow change"
			description="A change that takes longer than 200 ms is not held back: the element updates when it is done, and the band then sweeps over the result."
			code={`glimm(card, {
	${optionsCode},
	change: async () => {
		await save();
		count += 1;
	}
});`}
		>
			<Stack gap="md" class="w-full max-w-sm">
				<Card bind:ref={asyncCard} title="Draft">
					<Stack orientation="horizontal" gap="sm" align="center">
						<Chip color={savedCount ? 'success' : 'neutral'}>
							{savedCount ? `Saved ${savedCount}×` : 'Unsaved'}
						</Chip>
						{#if saving}<span class="text-neutral/70 text-sm">Saving…</span>{/if}
					</Stack>
				</Card>
				<Button variant="outline" loading={saving} onclick={save}>Save</Button>
			</Stack>
		</ComponentCard>
	{/snippet}
</DocPage>
