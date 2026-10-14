<script lang="ts">
	import Accordion from '$lib/components/Accordion/Accordion.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Switch from '$lib/components/Form/Switch/Switch.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import type { Density } from '$lib/types/theme.js';
	import { densities, sizes } from '$lib/utils/tokens.js';

	const accordionVariants = ['classic', 'card', 'outline'] as const;
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
			options: densities
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
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
	] as const satisfies ReadonlyArray<{ value: Density; label: string }>;
	let accordionDensity = $state<Density>('normal');

	const faqItems = [
		{
			title: 'Is it accessible?',
			content:
				'Yes. Each trigger is a button inside a heading, each panel is a labelled region, and collapsed content stays out of the reading order and the tab order.'
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

	const shippingItems = [
		{ title: 'Shipping', content: 'Orders ship within two days from our warehouse.' },
		{ title: 'Returns', content: 'Returns are free for thirty days after delivery.' },
		{
			title: 'Warranty',
			content: 'Every product carries a two year warranty.',
			disabled: true
		}
	];

	let lastChange = $state('Nothing changed yet.');
	let lastFinished = $state('Nothing finished yet.');
	let blockClosing = $state(false);

	const faqByKey = [
		{
			question: 'How do I install it?',
			answer: 'Run your package manager against the entasis package and import the component.'
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
		'Heading around each trigger, labelled region per panel',
		'Height animation on expand/collapse',
		'oneAtATime or multi-panel open',
		'hiddenUntilFound: find-in-page opens a collapsed item',
		'Per-item disabled, cancellable open-change details'
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
			description="density scales the paddings and gaps — compact for dense lists, comfortable for roomy surfaces. Combine freely with size."
			code={`<SegmentedControl items={densities} bind:value={density} />
<Accordion {density} {items} />`}
		>
			<div class="flex w-full max-w-md flex-col items-center gap-5">
				<SegmentedControl
					items={densitySegments}
					bind:value={accordionDensity}
					size="small"
					label="Accordion density"
				/>
				<Accordion density={accordionDensity} items={faqItems} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Plus/minus icon"
			description="A plus/minus icon instead of the rotating chevron."
		>
			<div class="w-full max-w-md">
				<Accordion icon="plus-minus" items={faqItems} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Variants"
			description="classic is the flat default; card wraps the rows in a raised surface; outline in a muted border."
			code={`<Accordion {items} />
<Accordion variant="card" {items} />
<Accordion variant="outline" {items} />`}
		>
			<div class="grid w-full gap-8 lg:grid-cols-3">
				<Accordion items={faqItems.slice(0, 2)} />
				<Accordion variant="card" items={faqItems.slice(0, 2)} />
				<Accordion variant="outline" items={faqItems.slice(0, 2)} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Splitted"
			description="splitted breaks the list into one surface per item, with a gap — combined here with the card and outline variants."
			code={`<Accordion variant="card" splitted {items} />
<Accordion variant="outline" splitted {items} />`}
		>
			<div class="grid w-full gap-8 lg:grid-cols-2">
				<Accordion variant="card" splitted items={faqItems.slice(0, 2)} />
				<Accordion variant="outline" splitted items={faqItems.slice(0, 2)} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Find in page"
			description="hiddenUntilFound keeps collapsed panels findable: search for 'warehouse' with Ctrl+F (Cmd+F) and the Shipping item opens. Collapsed content stays out of the reading and tab order until then."
			code={`<Accordion items={items} hiddenUntilFound />`}
		>
			<div class="w-full max-w-md">
				<Accordion items={shippingItems} hiddenUntilFound />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Disabled items"
			description="An item with disabled: true (or the key named by disabledKey) gets a natively disabled trigger, skipped by Tab. The root disabled prop disables every item."
			code={`<Accordion
	items={[
		{ title: 'Shipping', content: '…' },
		{ title: 'Warranty', content: '…', disabled: true }
	]}
/>`}
		>
			<div class="w-full max-w-md">
				<Accordion items={shippingItems} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Open-change details and lifecycle"
			description="onItemOpenChange runs before an item opens or closes with a reason, and details.cancel() keeps it as it was. onItemAfterOpen and onItemAfterClose fire once when the change finishes, also without animation."
			code={`<Accordion
	{items}
	onItemOpenChange={({ item, open, details }) => {
		if (!open && blockClosing) details.cancel();
	}}
	onItemAfterOpen={({ item }) => (finished = item.title + ' finished opening')}
	onItemAfterClose={({ item }) => (finished = item.title + ' finished closing')}
/>`}
		>
			<div class="flex w-full max-w-md flex-col gap-4">
				<Switch bind:value={blockClosing} label="Refuse closing (details.cancel())" />
				<Accordion
					items={faqItems}
					oneAtATime={false}
					onItemOpenChange={({ item, open, details }) => {
						lastChange = `${item.title}: ${open ? 'open' : 'close'} requested (${details.reason})`;
						if (!open && blockClosing) details.cancel();
					}}
					onItemAfterOpen={({ item }) => (lastFinished = `${item.title} finished opening`)}
					onItemAfterClose={({ item }) => (lastFinished = `${item.title} finished closing`)}
				/>
				<p class="text-neutral/70 text-sm" data-testid="accordion-last-change">{lastChange}</p>
				<p class="text-neutral/70 text-sm" data-testid="accordion-last-finished">{lastFinished}</p>
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
