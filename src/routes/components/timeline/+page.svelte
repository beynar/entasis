<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import TimelineActivityDemo from './TimelineActivityDemo.svelte';
	import TimelineLayoutDemo from './TimelineLayoutDemo.svelte';
	import TimelineMilestonesDemo from './TimelineMilestonesDemo.svelte';
	import TimelineMinimalDemo from './TimelineMinimalDemo.svelte';
	import TimelineOrderTrackingDemo from './TimelineOrderTrackingDemo.svelte';
	import TimelineVariantsDemo from './TimelineVariantsDemo.svelte';
	import {
		activityCode,
		getOrderCode,
		layoutCode,
		milestonesCode,
		minimalCode,
		variantsCode
	} from './codeSnippets.js';

	const controls = createComponentControls([
		{
			name: 'orientation',
			type: 'segmented',
			label: 'Orientation',
			value: 'vertical',
			options: ['vertical', 'horizontal']
		},
		{
			name: 'placement',
			type: 'segmented',
			label: 'Placement',
			value: 'end',
			options: ['start', 'end', 'alternate']
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'ghost',
			options: ['ghost', 'card', 'outline', 'soft']
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: ['compact', 'normal', 'comfortable']
		},
		{ name: 'showDateTime', type: 'switch', label: 'Date & time', value: true },
		{ name: 'showConnectors', type: 'switch', label: 'Connectors', value: true },
		{ name: 'loading', type: 'switch', label: 'Loading', value: false }
	]);

	const orderCode = $derived(
		getOrderCode({
			orientation: controls.value.orientation,
			placement: controls.value.placement,
			variant: controls.value.variant,
			size: controls.value.size,
			density: controls.value.density,
			showDateTime: controls.value.showDateTime,
			showConnectors: controls.value.showConnectors,
			loading: controls.value.loading
		})
	);
</script>

<DocPage
	title="Timeline"
	subtitle="Display ordered events as a vertical or horizontal sequence, with typed item data, semantic markers, responsive placement, and composable rendering fallbacks."
	component="Timeline"
	features={[
		'Generic item types with item, marker, and opposite snippets',
		'Vertical and horizontally scrollable orientations',
		'Start, end, and responsive alternate placement',
		'Ghost, card, outline, and soft variants',
		'Independent size, density, item color, and connector color',
		'Default date, title, description, icon, and loading rendering'
	]}
>
	<ComponentCard
		{controls}
		title="Order tracking"
		description="Extend the generic item with domain fields such as status and time. The item snippet composes around defaultContent, while the marker snippet replaces only the current step and preserves the default fallback."
		code={orderCode}
		class="!min-h-0 !items-stretch !justify-start p-3 sm:p-6"
	>
		<TimelineOrderTrackingDemo
			orientation={controls.value.orientation}
			placement={controls.value.placement}
			variant={controls.value.variant}
			size={controls.value.size}
			density={controls.value.density}
			showDateTime={controls.value.showDateTime}
			showConnectors={controls.value.showConnectors}
			loading={controls.value.loading}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Alternating milestone cards"
			description="Rich cards can add media or project fields to the item type. The opposite snippet renders selected dates as chips and delegates every other date to defaultOpposite."
			code={milestonesCode}
			class="!min-h-0 !items-stretch !justify-start p-3 sm:p-6"
		>
			<TimelineMilestonesDemo />
		</ComponentCard>

		<ComponentCard
			title="Minimal history and colored roadmap"
			description="Marker snippets can move from quiet hollow rings to compact semantic dots without replacing item rendering or connector geometry."
			code={minimalCode}
			class="!min-h-0 !items-stretch !justify-start p-3 sm:p-6"
		>
			<TimelineMinimalDemo />
		</ComponentCard>

		<ComponentCard
			title="Activity feed and loading"
			description="A typed activity feed adds relative times and optional marker icons. The final item delegates to the built-in loading marker."
			code={activityCode}
			class="!min-h-0 !items-stretch !justify-start p-3 sm:p-6"
		>
			<TimelineActivityDemo />
		</ComponentCard>

		<ComponentCard
			title="Variants"
			description="Ghost, card, outline, and soft change only the item surface. Loading replaces the default marker visual with a Spinner."
			code={variantsCode}
			class="!min-h-0 !items-stretch !justify-start p-3 sm:p-6"
		>
			<TimelineVariantsDemo />
		</ComponentCard>

		<ComponentCard
			title="Responsive and horizontal layouts"
			description="Alternate placement collapses from the timeline's own container width. Horizontal items keep their minimum width, expose keyboard-focusable overflow, and add a scroll fade only when content exceeds the viewport."
			code={layoutCode}
			class="!min-h-0 !items-stretch !justify-start p-3 sm:p-6"
		>
			<TimelineLayoutDemo />
		</ComponentCard>
	{/snippet}
</DocPage>
