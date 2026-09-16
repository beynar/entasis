<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import AppShellActionsDemo from './demos/AppShellActionsDemo.svelte';
	import AppShellBasicDemo from './demos/AppShellBasicDemo.svelte';
	import AppShellDoubleSidebarDemo from './demos/AppShellDoubleSidebarDemo.svelte';
	import AppShellFeatureShowcaseDemo from './demos/AppShellFeatureShowcaseDemo.svelte';
	import AppShellVariantGalleryDemo from './demos/AppShellVariantGalleryDemo.svelte';
	import ShellMentalModel from '../ShellMentalModel.svelte';
	import rawDoubleSidebarCode from './demos/AppShellDoubleSidebarDemo.svelte?raw';
	import rawFeatureShowcaseCode from './demos/AppShellFeatureShowcaseDemo.svelte?raw';
	import rawVariantGalleryCode from './demos/AppShellVariantGalleryDemo.svelte?raw';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import { densities, sizes } from '$lib/utils/tokens.js';

	const sidebarVariants = ['admin', 'floating', 'inset', 'split', 'framed'] as const;
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
			options: densities
		}
	]);

	const doubleSidebarCode = toPublicExampleCode(rawDoubleSidebarCode);
	const featureShowcaseCode = toPublicExampleCode(rawFeatureShowcaseCode);
	const variantGalleryCode = toPublicExampleCode(rawVariantGalleryCode);

	function toPublicExampleCode(code: string): string {
		return code
			.replaceAll('$lib/components/AppShell/index.js', 'svelai/app-shell')
			.replaceAll('$lib/components/Breadcrumbs/index.js', 'svelai/breadcrumbs')
			.replaceAll('$lib/components/Button/Button.svelte', 'svelai/button')
			.replaceAll('$lib/components/PageShell/index.js', 'svelai/page-shell')
			.replaceAll('$lib/components/SegmentedControl/index.js', 'svelai/segmented-control')
			.replaceAll('$lib/components/Sidebar/index.js', 'svelai/sidebar')
			.replace(/\$lib\/components\/Icons\/([A-Za-z0-9]+)\.js/g, 'svelai/icons/$1');
	}
</script>

<DocPage
	title="App shell"
	subtitle="Application layout that shares one surface variant across Sidebar and PageShell."
	component="AppShell"
	features={[
		'Coordinates Sidebar geometry with matching PageShell header and footer surfaces',
		'A framed variant draws one rounded card on the canvas around the sidebar and the page',
		'Composes Sidebar-owned surfaces with PageShell page chrome',
		'Keeps page scrolling on the document for native navigation restoration',
		'Keeps Sidebar responsive drawer, collapse, rail, and edge reveal behavior',
		'Header, footer, and children snippets receive both APIs',
		'Child routes can still use setPageShell through context'
	]}
>
	<ComponentCard
		{controls}
		description="Use AppShell when every route follows the same sidebar plus page-shell structure."
		class="!min-h-fit !items-start !p-4"
		code={`<script lang="ts">
	import { AppShell, type AppShellSidebarProps } from 'svelai/app-shell';
	import { chartBarIcon } from 'svelai/icons/chartBar';
	import { commandIcon } from 'svelai/icons/command';
	import { gearIcon } from 'svelai/icons/gear';
	import { houseIcon } from 'svelai/icons/house';
	import { sidebarIcon } from 'svelai/icons/sidebar';
	import { trayIcon } from 'svelai/icons/tray';

	let sidebarDisplayState = $state<'expanded' | 'collapsed' | 'hidden'>('expanded');
	let sidebarWidth = $state('17rem');
	const isSidebarExpanded = $derived(sidebarDisplayState === 'expanded');

	const sidebar = $derived<AppShellSidebarProps>({
		displayState: sidebarDisplayState,
		onDisplayStateChange: (nextDisplayState) => {
			sidebarDisplayState = nextDisplayState;
		},
		size: '${controls.value.size}',
		density: '${controls.value.density}',
		collapsible: 'icon',
		rail: true,
		width: sidebarWidth,
		resizable: {
			minWidth: '12rem',
			maxWidth: '24rem',
			onWidthChange: ({ width }) => {
				sidebarWidth = width;
			}
		},
		items: [
			{
				label: 'Workspace',
				items: [
					{ label: 'Overview', href: '#overview', icon: houseIcon, isActive: true },
					{ label: 'Inbox', href: '#inbox', icon: trayIcon, badge: 8 },
					{ label: 'Analytics', href: '#analytics', icon: chartBarIcon },
					{ label: 'Settings', href: '#settings', icon: gearIcon }
				]
			}
		],
		headerButton: {
			icon: commandIcon,
			title: 'Acme',
			subtitle: 'Operations'
		}
	});
${'</' + 'script>'}

<AppShell variant="${controls.value.variant}" {sidebar} title="Dashboard" subtitle="Sidebar navigation with sticky page chrome">
	{#snippet headerActions({ sidebar })}
		<button type="button" aria-label="Toggle sidebar" onclick={sidebar.toggle}>
			{@render sidebarIcon({ class: 'size-4' })}
		</button>
	{/snippet}

	{#snippet footer()}
		<span>Sidebar is {isSidebarExpanded ? 'expanded' : 'collapsed'}</span>
		<span>Responsive drawer included</span>
	{/snippet}

	{#snippet children()}
		<section class="p-4">Dashboard content</section>
	{/snippet}
</AppShell>`}
	>
		<AppShellBasicDemo
			variant={controls.value.variant}
			size={controls.value.size}
			density={controls.value.density}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ShellMentalModel current="app-shell" />

		<section
			class="border-neutral-muted bg-surface text-neutral/70 grid gap-3 rounded-xl border p-4 text-sm"
		>
			<p class="text-neutral font-medium">Nested and two-sided sidebars</p>
			<p>
				AppShell intentionally manages one Sidebar. For one right-side navigation panel, pass <code
					>side: 'right'</code
				>
				in the <code>sidebar</code> config.
			</p>
			<p>
				For left and right sidebars, compose Sidebar manually and put PageShell in the innermost
				children. Use <code>frame="contained"</code> for embedded regions, treat each Sidebar as an
				independent controller, and avoid two competing mobile drawers until AppShell grows a
				first-class <code>rightSidebar</code> or <code>sidebars</code> API.
			</p>
		</section>

		<ComponentCard
			description="Compose two Sidebar instances manually when a screen needs primary navigation and a contextual inspector."
			class="!min-h-fit !items-start !p-4"
			code={doubleSidebarCode}
		>
			<AppShellDoubleSidebarDemo />
		</ComponentCard>

		<ComponentCard
			description="A complete shell surface showing sidebar navigation, breadcrumbs or eyebrow context, a back affordance, content presets, responsive action overflow, and footer actions."
			class="!min-h-fit !items-start !p-4"
			code={featureShowcaseCode}
		>
			<AppShellFeatureShowcaseDemo />
		</ComponentCard>

		<ComponentCard
			description="Toggle between practical AppShell variants, with notes for related states like icon rail and page-layout presets like prose width."
			class="!min-h-fit !items-start !p-4"
			code={variantGalleryCode}
		>
			<AppShellVariantGalleryDemo />
		</ComponentCard>

		<ComponentCard
			description="AppShell accepts the same PageShell action arrays, breadcrumbs, back button, and content presets."
			class="!min-h-fit !items-start !p-4"
			code={`<script lang="ts">
	import {
		AppShell,
		type AppShellActions,
		type AppShellSidebarProps
	} from 'svelai/app-shell';
	import type { BreadcrumbItem } from 'svelai/breadcrumbs';
	import { arrowClockwiseIcon } from 'svelai/icons/arrowClockwise';
	import { downloadSimpleIcon } from 'svelai/icons/downloadSimple';
	import { plusIcon } from 'svelai/icons/plus';

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Workspace', href: '#workspace' },
		{ label: 'Reports', active: true }
	];

	const headerActions = [
		{ label: 'Refresh', squared: true, variant: 'outline', prefix: arrowClockwiseIcon },
		{ content: 'Export', variant: 'outline', prefix: downloadSimpleIcon },
		{ content: 'Create', color: 'primary', prefix: plusIcon }
	] satisfies AppShellActions;

	const sidebar: AppShellSidebarProps = { items, collapsible: 'icon' };
${'</' + 'script>'}

<AppShell
	variant="inset"
	{sidebar}
	title="Reports"
	{breadcrumbs}
	back={{ href: '#workspace' }}
	{headerActions}
	contentPadding="normal"
	contentWidth="normal"
>
	{#snippet children()}
		Reports content
	{/snippet}
</AppShell>`}
		>
			<AppShellActionsDemo />
		</ComponentCard>

		<ComponentCard
			description="When child routes need their own chrome, they can call setPageShell because AppShell renders PageShell internally."
			class="!min-h-[260px]"
			code={`<script lang="ts">
	import { setPageShell } from 'svelai/page-shell';

	setPageShell({
		title: 'Customer detail',
		subtitle: 'Route-owned metadata',
		footer
	});
${'</' + 'script>'}

{#snippet footer()}
	<span>Unsaved changes</span>
{/snippet}

<section>Customer content</section>`}
		>
			<div class="text-neutral/70 max-w-xl text-sm">
				AppShell does not replace PageShell. It composes it, so route-level PageShell injection
				stays available under the combined frame.
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
