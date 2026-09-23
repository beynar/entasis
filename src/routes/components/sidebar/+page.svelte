<script lang="ts">
	import { resolve } from '$app/paths';
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import SidebarActivityBarDemo from './demos/SidebarActivityBarDemo.svelte';
	import SidebarBasicDemo from './demos/SidebarBasicDemo.svelte';
	import SidebarIconDemo from './demos/SidebarIconDemo.svelte';
	import SidebarPanelModeDemo from './demos/SidebarPanelModeDemo.svelte';
	import SidebarTreeDemo from './demos/SidebarTreeDemo.svelte';
	import SidebarVariantDemo from './demos/SidebarVariantDemo.svelte';
	import ShellMentalModel from '../ShellMentalModel.svelte';
	import rawActivityBarCode from './demos/SidebarActivityBarDemo.svelte?raw';
	import rawIconCode from './demos/SidebarIconDemo.svelte?raw';
	import rawPanelModeCode from './demos/SidebarPanelModeDemo.svelte?raw';
	import rawTreeCode from './demos/SidebarTreeDemo.svelte?raw';
	import rawVariantCode from './demos/SidebarVariantDemo.svelte?raw';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import { densities, sizes } from '$lib/utils/tokens.js';

	const sidebarVariants = ['admin', 'floating', 'inset', 'split', 'framed'] as const;
	const activeVariants = ['soft', 'outline', 'solid'] as const;
	const controls = createComponentControls([
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'inset',
			options: sidebarVariants
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'iconSize',
			type: 'segmented',
			label: 'Icon size',
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
			name: 'activeVariant',
			type: 'segmented',
			label: 'Active',
			value: 'soft',
			options: activeVariants
		}
	]);

	const activityBarCode = toPublicExampleCode(rawActivityBarCode);
	const iconCode = toPublicExampleCode(rawIconCode);
	const panelModeCode = toPublicExampleCode(rawPanelModeCode);
	const treeCode = toPublicExampleCode(rawTreeCode);
	const variantCode = toPublicExampleCode(rawVariantCode);

	function toPublicExampleCode(code: string): string {
		return code
			.replaceAll('$lib/components/Button/index.js', 'entasis/button')
			.replaceAll('$lib/components/AppShell/index.js', 'entasis/app-shell')
			.replaceAll('$lib/components/Menu/index.js', 'entasis/menu')
			.replaceAll('$lib/components/SegmentedControl/index.js', 'entasis/segmented-control')
			.replaceAll('$lib/components/Sidebar/index.js', 'entasis/sidebar')
			.replaceAll('$lib/components/Skeleton/index.js', 'entasis/skeleton')
			.replace(/\$lib\/components\/Icons\/([A-Za-z0-9]+)\.js/g, 'entasis/icons/$1');
	}
</script>

<DocPage
	title="Sidebar"
	subtitle="Navigation panels with responsive collapse, data-driven navigation, menus, search, and recursive tree groups."
	component="Sidebar"
	features={[
		'Desktop icon and offcanvas collapse modes',
		'Resizable desktop panels with drag handles',
		'Hidden offcanvas sidebars reveal, resize, and dismiss through a safe hover area',
		{
			label: 'Hover peek keeps focus inside the panel',
			test: 'a11y:sidebar.peek-keeps-focus'
		},
		{
			label: 'Hover peek stays open while a row menu is open',
			test: 'a11y:sidebar.peek-keeps-open-menu'
		},
		{ label: 'Activity bar keyboard navigation', test: 'a11y:sidebar.activity-bar' },
		'Activity bar icon rail pinned outside the panel in every display state',
		'Mobile drawer state through the same API',
		'Panel mode and contained frames for embedded previews',
		'Header, footer, search, menu, and action rows',
		'Recursive tree groups with inline and icon-popover navigation',
		'Independent item size and spacing density',
		'Soft, outline, or solid active rows through one activeVariant axis',
		'Tinted icon tiles and multiple pinned group actions from typed props'
	]}
>
	<ShellMentalModel current="sidebar" />

	<section class="border-neutral-muted bg-surface text-neutral/70 rounded-xl border p-4 text-sm">
		<p>
			These examples keep the page side inert with skeleton content so the focus stays on Sidebar.
			Sidebar owns navigation, state, resizing, the application wall, and variant surfaces. AppShell
			composes the same variant with PageShell and forwards its variant to Sidebar. For full
			application layouts, compose it through
			<a
				class="text-primary-readable font-medium hover:underline"
				href={resolve('/components/app-shell')}>AppShell</a
			>. For page headers, content width, and page footers, use
			<a
				class="text-primary-readable font-medium hover:underline"
				href={resolve('/components/page-shell')}>PageShell</a
			>.
		</p>
	</section>

	<ComponentCard
		{controls}
		description="Render a Sidebar layout from typed groups, search, account menus, badges, row actions, and a resizable thumb rail. The page side is intentionally just skeleton content."
		class="!min-h-fit !items-start !p-4"
		code={`<Sidebar
	variant="${controls.value.variant}"
	size="${controls.value.size}"
	iconSize="${controls.value.iconSize}"
	density="${controls.value.density}"
	activeVariant="${controls.value.activeVariant}"
	collapsible="icon"
	frame="contained"
	rail="thumb"
	items={groups}
>
	{#snippet children()}
		<!-- page content -->
	{/snippet}
</Sidebar>`}
	>
		<SidebarBasicDemo
			variant={controls.value.variant}
			size={controls.value.size}
			iconSize={controls.value.iconSize}
			density={controls.value.density}
			activeVariant={controls.value.activeVariant}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Switch variants, display states, item size, and spacing density across navigation rows and a nested project tree. Hidden state keeps its resize handle during edge reveal and persists the changed width."
			class="!min-h-fit !items-start !p-4"
			code={variantCode}
		>
			<SidebarVariantDemo />
		</ComponentCard>

		<ComponentCard
			description="Panel mode renders only the navigation panel. Use it when a parent layout already owns spacing, wall color, and content."
			class="!min-h-fit !items-start !p-4"
			code={panelModeCode}
		>
			<SidebarPanelModeDemo />
		</ComponentCard>

		<ComponentCard
			description="Icon collapse keeps labels mounted and fades them while the panel width animates. If any data-driven row lacks an icon, Sidebar falls back to hidden offcanvas collapse."
			class="!min-h-fit !items-start !p-4"
			code={iconCode}
		>
			<SidebarIconDemo />
		</ComponentCard>

		<ComponentCard
			description="An activity bar pins an icon rail outside the panel, so it stays on screen in every display state. With expandOnHover the icon-collapsed panel peeks open over the page and collapses again once the pointer, focus, and any menu opened inside it are gone."
			class="!min-h-fit !items-start !p-4"
			code={activityBarCode}
		>
			<SidebarActivityBarDemo />
		</ComponentCard>

		<ComponentCard
			description="Tree groups render recursive folder structures inline when expanded and as Menu submenu popovers in desktop icon mode."
			class="!min-h-fit !items-start !p-4"
			code={treeCode}
		>
			<SidebarTreeDemo />
		</ComponentCard>
	{/snippet}
</DocPage>
