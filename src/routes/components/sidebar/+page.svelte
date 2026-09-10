<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import SidebarBasicDemo from './demos/SidebarBasicDemo.svelte';
	import SidebarIconDemo from './demos/SidebarIconDemo.svelte';
	import SidebarPanelModeDemo from './demos/SidebarPanelModeDemo.svelte';
	import SidebarTreeDemo from './demos/SidebarTreeDemo.svelte';
	import SidebarVariantDemo from './demos/SidebarVariantDemo.svelte';
	import ShellMentalModel from '../ShellMentalModel.svelte';
	import rawIconCode from './demos/SidebarIconDemo.svelte?raw';
	import rawPanelModeCode from './demos/SidebarPanelModeDemo.svelte?raw';
	import rawTreeCode from './demos/SidebarTreeDemo.svelte?raw';
	import rawVariantCode from './demos/SidebarVariantDemo.svelte?raw';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import { sizes } from '$lib/utils/tokens.js';

	const sidebarVariants = ['admin', 'floating', 'inset', 'split'] as const;
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
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: sizes
		}
	]);

	const iconCode = toPublicExampleCode(rawIconCode);
	const panelModeCode = toPublicExampleCode(rawPanelModeCode);
	const treeCode = toPublicExampleCode(rawTreeCode);
	const variantCode = toPublicExampleCode(rawVariantCode);

	function toPublicExampleCode(code: string): string {
		return code
			.replaceAll('$lib/components/Button/index.js', 'svelai/button')
			.replaceAll('$lib/components/AppShell/index.js', 'svelai/app-shell')
			.replaceAll('$lib/components/Menu/index.js', 'svelai/menu')
			.replaceAll('$lib/components/SegmentedControl/index.js', 'svelai/segmented-control')
			.replaceAll('$lib/components/Sidebar/index.js', 'svelai/sidebar')
			.replaceAll('$lib/components/Skeleton/index.js', 'svelai/skeleton')
			.replace(/\$lib\/components\/Icons\/([A-Za-z0-9]+)\.js/g, 'svelai/icons/$1');
	}
</script>

<DocPage
	title="Sidebar"
	subtitle="Navigation panels with responsive collapse, data-driven navigation, menus, search, and recursive tree groups."
	component="Sidebar"
	features={[
		'Desktop icon and offcanvas collapse modes',
		'Resizable desktop panels with drag and keyboard handles',
		'Hidden offcanvas sidebars reveal, resize, and dismiss through a safe hover area',
		'Mobile drawer state through the same API',
		'Panel mode and contained frames for embedded previews',
		'Header, footer, search, menu, and action rows',
		'Recursive tree groups with inline and icon-popover navigation',
		'Independent item size and spacing density'
	]}
>
	<ShellMentalModel current="sidebar" />

	<section
		class="rounded-xl border border-neutral-muted bg-surface p-4 text-sm text-neutral/70"
	>
		<p>
			These examples keep the page side inert with skeleton content so the focus stays on Sidebar.
			Sidebar owns navigation, state, resizing, the application wall, and variant surfaces. AppShell
			composes the same variant with PageShell and forwards its variant to Sidebar. For full
			application layouts, compose it through
			<a class="font-medium text-primary hover:underline" href="/components/app-shell">AppShell</a>.
			For page headers, content width, and page footers, use
			<a class="font-medium text-primary hover:underline" href="/components/page-shell">PageShell</a
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
	density="${controls.value.density}"
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
			density={controls.value.density}
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
			description="Tree groups render recursive folder structures inline when expanded and as Menu submenu popovers in desktop icon mode."
			class="!min-h-fit !items-start !p-4"
			code={treeCode}
		>
			<SidebarTreeDemo />
		</ComponentCard>
	{/snippet}
</DocPage>
