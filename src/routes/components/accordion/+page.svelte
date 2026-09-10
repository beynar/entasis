<script lang="ts">
	import Accordion from '$lib/components/Accordion/Accordion.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import type { Density } from '$lib/types/theme.js';
	import { sizes } from '$lib/utils/tokens.js';

	const accordionVariants = ['classic', 'card', 'outlined'] as const;
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
			options: sizes
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'classic',
			options: accordionVariants
		},
		{ name: 'oneAtATime', type: 'switch', label: 'One at a time', value: true },
		{ name: 'splitted', type: 'switch', label: 'Splitted', value: false }
	]);

	const densitySegments = [
		{ value: 'small', label: 'Small' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Large' }
	] as const satisfies ReadonlyArray<{ value: Density; label: string }>;
	let accordionDensity = $state<Density>('normal');

	const faqItems = [
		{
			title: 'Is it accessible?',
			content:
				'Yes. It adheres to the WAI-ARIA design pattern, and collapsed content stays available to screen readers.'
		},
		{
			title: 'Is it styled?',
			content:
				'Yes. It comes with default styles that match the rest of the library and can be overridden through the theme prop.'
		},
		{
			title: 'Is it animated?',
			content:
				"Yes. Panels slide open and closed, and the animation respects the user's reduced-motion preference."
		}
	];

	const detailedItems = [
		{
			title: 'Billing',
			description: 'Plans, invoices and payment methods',
			content:
				'Billing occurs automatically at the start of each cycle. Invoices are emailed after each payment.'
		},
		{
			title: 'Security',
			description: 'Encryption and compliance',
			content:
				'All data is encrypted at rest and in transit. Audits run quarterly with third parties.'
		},
		{
			title: 'Integrations',
			description: 'Connect your existing tools',
			content: 'We integrate with 500+ tools, and a REST API covers anything custom.'
		}
	];

	const faqByKey = [
		{
			question: 'How do I install it?',
			answer: 'Run your package manager against the svelai package and import the component.'
		},
		{
			question: 'Can I self-host?',
			answer: 'Yes — everything ships as source, there is no external service dependency.'
		}
	];
</script>

<DocPage
	title="Accordion"
	subtitle="Vertically stacked sections that expand and collapse to reveal their content."
	component="Accordion"
	features={[
		'Built on Melt Accordion builder',
		'Slide transition on expand/collapse',
		'oneAtATime or multi-panel open',
		'Collapsed content kept in sr-only span'
	]}
>
	<ComponentCard
		{controls}
		description="A flat list of expandable rows — the title underlines on hover and the chevron rotates open."
		code={`<Accordion
	items={[
		{ title: 'Is it accessible?', content: 'Yes. It adheres to the WAI-ARIA design pattern.' },
		{ title: 'Is it styled?', content: 'Yes. It comes with sensible default styles.' },
		{ title: 'Is it animated?', content: 'Yes, with reduced-motion support.' }
	]}
	size="${controls.value.size}"
	density="${controls.value.density}"
	variant="${controls.value.variant}"
	oneAtATime={${controls.value.oneAtATime}}
	splitted={${controls.value.splitted}}
/>`}
	>
		<div class="w-full max-w-md">
			<Accordion
				items={faqItems}
				size={controls.value.size}
				density={controls.value.density}
				variant={controls.value.variant}
				oneAtATime={controls.value.oneAtATime}
				splitted={controls.value.splitted}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="With descriptions"
			description="Items can carry a muted description under the title."
		>
			<div class="w-full max-w-md">
				<Accordion items={detailedItems} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Multiple open"
			description="Set oneAtATime to false to let several panels stay open."
		>
			<div class="w-full max-w-md">
				<Accordion items={faqItems} oneAtATime={false} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large typography scales — text and icon only; spacing is controlled by density."
		>
			<div class="grid w-full max-w-md gap-10">
				<Accordion size="small" items={faqItems.slice(0, 2)} />
				<Accordion size="normal" items={faqItems.slice(0, 2)} />
				<Accordion size="large" items={faqItems.slice(0, 2)} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Density"
			description="density scales the paddings and gaps — small for dense lists, large for roomy surfaces. Combine freely with size."
			code={`<SegmentedControl items={densities} bind:value={density} />
<Accordion {density} {items} />`}
		>
			<div class="flex w-full max-w-md flex-col items-center gap-5">
				<SegmentedControl
					items={densitySegments}
					bind:value={accordionDensity}
					size="small"
					ariaLabel="Accordion density"
				/>
				<Accordion density={accordionDensity} items={faqItems} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Math icon"
			description="A plus/minus icon instead of the rotating chevron."
		>
			<div class="w-full max-w-md">
				<Accordion icon="math" items={faqItems} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Variants"
			description="classic is the flat default; card wraps the rows in a raised surface; outlined in a muted border."
			code={`<Accordion {items} />
<Accordion variant="card" {items} />
<Accordion variant="outlined" {items} />`}
		>
			<div class="grid w-full gap-8 lg:grid-cols-3">
				<Accordion items={faqItems.slice(0, 2)} />
				<Accordion variant="card" items={faqItems.slice(0, 2)} />
				<Accordion variant="outlined" items={faqItems.slice(0, 2)} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Splitted"
			description="splitted breaks the list into one surface per item, with a gap — combined here with the card and outlined variants."
			code={`<Accordion variant="card" splitted {items} />
<Accordion variant="outlined" splitted {items} />`}
		>
			<div class="grid w-full gap-8 lg:grid-cols-2">
				<Accordion variant="card" splitted items={faqItems.slice(0, 2)} />
				<Accordion variant="outlined" splitted items={faqItems.slice(0, 2)} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Custom keys"
			description="Map your own item shape with titleKey and contentKey."
			code={`<Accordion items={faqs} titleKey="question" contentKey="answer" />`}
		>
			<div class="w-full max-w-md">
				<Accordion items={faqByKey} titleKey="question" contentKey="answer" />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
