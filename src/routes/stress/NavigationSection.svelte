<script lang="ts">
	import { Accordion } from '$lib/components/Accordion/index.js';
	import { Breadcrumbs } from '$lib/components/Breadcrumbs/index.js';
	import { Collapsible } from '$lib/components/Collapsible/index.js';
	import { Menu, type MenuItem } from '$lib/components/Menu/index.js';
	import { MenuBar } from '$lib/components/MenuBar/index.js';
	import { MenuOption } from '$lib/components/MenuOption/index.js';
	import { Pagination } from '$lib/components/Pagination/index.js';
	import { Sidebar, type SidebarGroup } from '$lib/components/Sidebar/index.js';
	import { Skeleton } from '$lib/components/Skeleton/index.js';
	import { Stepper } from '$lib/components/Stepper/index.js';
	import { Tabbar } from '$lib/components/Tabbar/index.js';
	import { TableOfContents } from '$lib/components/TableOfContents/index.js';
	import { Tabs } from '$lib/components/Tabs/index.js';
	import { ToggleMenu } from '$lib/components/ToggleMenu/index.js';
	import { bellIcon } from '$lib/components/Icons/bell.js';
	import { chartBarIcon } from '$lib/components/Icons/chartBar.js';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { trashIcon } from '$lib/components/Icons/trash.js';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import Matrix from './Matrix.svelte';
	import Section from './Section.svelte';
	import { colors, densities, sizes } from './fixtures.js';

	let { size = 'normal', density = 'normal' }: { size?: Sizes; density?: Density } = $props();

	const tabbarVariants = ['underline', 'pill'] as const;
	const paginationVariants = ['pages', 'count', 'compact', 'dots'] as const;
	const accordionVariants = ['classic', 'card', 'outline'] as const;

	const tabItems = ['Overview', 'Activity', 'Settings'];
	const breadcrumbItems = [
		{ label: 'Workspace', href: '#navigation' },
		{ label: 'Projects', href: '#navigation' },
		{ label: 'Design system', active: true }
	];

	const accordionItems = [
		{
			title: 'Runtime tokens',
			description: 'Spacing, radius and typography',
			content: 'Utilities keep their class while the CSS variables change.'
		},
		{
			title: 'Component density',
			description: 'Local structure, global scale',
			content: 'Density variants choose classes; spacing tokens scale their values.'
		},
		{
			title: 'Color themes',
			description: 'Independent semantic palette',
			content: 'Light and dark switch through theme variables.'
		}
	];

	const menuItems: MenuItem[] = [
		{ type: 'option', title: 'Home', description: 'Back to start', prefix: houseIcon },
		{ type: 'option', title: 'Reports', prefix: chartBarIcon },
		{ type: 'separator' },
		{
			type: 'submenu',
			title: 'More',
			prefix: folderIcon,
			menu: [
				{ type: 'option', title: 'Archive' },
				{ type: 'option', title: 'Export' }
			]
		},
		{ type: 'option', title: 'Delete', prefix: trashIcon, color: 'danger' }
	];

	const tocItems = [
		{ id: 'actions', level: 2 as const, title: 'Actions' },
		{ id: 'inputs', level: 2 as const, title: 'Inputs' },
		{ id: 'display', level: 3 as const, title: 'Display' },
		{ id: 'navigation', level: 3 as const, title: 'Navigation' }
	];

	const stepperItems = [
		{ title: 'Account', body: 'Collect identity details.' },
		{ title: 'Preferences', body: 'Pick notification channels.' },
		{ title: 'Review', body: 'Confirm and submit.' }
	];

	const sidebarGroups: SidebarGroup[] = [
		{
			label: 'Workspace',
			items: [
				{ label: 'Overview', href: '#navigation', icon: houseIcon, isActive: true },
				{ label: 'Inbox', href: '#navigation', icon: bellIcon, badge: 12 },
				{
					label: 'Projects',
					icon: folderIcon,
					defaultOpen: true,
					items: [
						{ label: 'Web app', href: '#navigation' },
						{ label: 'Design system', href: '#navigation' }
					]
				},
				{ label: 'Analytics', href: '#navigation', icon: chartBarIcon }
			]
		}
	];
</script>

<Section
	id="navigation"
	title="Navigation"
	description="Tabs, Tabbar, Breadcrumbs, Pagination, Stepper, Accordion, Collapsible, Menu, MenuBar, ToggleMenu, TableOfContents, Sidebar."
>
	{#each tabbarVariants as variant (variant)}
		<Matrix caption="Tabbar — variant {variant}" varies="color, size, alignment" layout="stack">
			{#each colors as color (color)}
				<Tabbar {variant} {color} {size} items={tabItems} defaultValue="Overview" />
			{/each}
			{#each sizes as tabSize (tabSize)}
				<Tabbar {variant} color="primary" size={tabSize} items={tabItems} defaultValue="Activity" />
			{/each}
			<Tabbar {variant} color="neutral" {size} items={tabItems} alignment="center" fullWidth />
		</Matrix>
	{/each}

	<Matrix caption="Tabbar" varies="orientation vertical" layout="wrap">
		<Tabbar
			orientation="vertical"
			color="primary"
			{size}
			items={tabItems}
			defaultValue="Overview"
		/>
	</Matrix>

	<Matrix caption="Tabs" varies="placement, tabbar color" layout="stack">
		<Tabs items={tabItems} defaultValue="Overview" tabbar={{ color: 'primary', size }}>
			{#snippet children({ item })}
				<div class="p-md text-neutral/70 text-sm">Panel for “{item}”.</div>
			{/snippet}
		</Tabs>
		<Tabs items={tabItems} defaultValue="Activity" placement="left" tabbar={{ color: 'neutral' }}>
			{#snippet children({ item })}
				<div class="p-md text-neutral/70 text-sm">Left-placed panel for “{item}”.</div>
			{/snippet}
		</Tabs>
	</Matrix>

	<Matrix caption="Breadcrumbs" varies="home, maxItems, separator" layout="stack">
		<Breadcrumbs items={breadcrumbItems} />
		<Breadcrumbs items={breadcrumbItems} home={{ href: '#navigation', label: 'Home' }} />
		<Breadcrumbs items={breadcrumbItems} maxItems={2} />
		<Breadcrumbs items={breadcrumbItems} showSeparator={false} />
	</Matrix>

	{#each paginationVariants as variant (variant)}
		<Matrix caption="Pagination — variant {variant}" varies="color, size, disabled" layout="stack">
			{#each colors as color (color)}
				<Pagination {variant} {color} {size} totalPages={10} defaultValue={4} />
			{/each}
			{#each sizes as pageSize (pageSize)}
				<Pagination {variant} color="primary" size={pageSize} totalPages={10} defaultValue={4} />
			{/each}
			<Pagination {variant} color="neutral" {size} totalPages={10} defaultValue={4} disabled />
		</Matrix>
	{/each}

	<Matrix caption="Pagination" varies="controlVariant, showSummary" layout="stack">
		<Pagination
			color="primary"
			{size}
			totalItems={137}
			pageSize={10}
			defaultValue={3}
			showSummary
			showFirstLast
			controlVariant="outline"
		/>
		<Pagination
			color="neutral"
			{size}
			totalPages={8}
			defaultValue={2}
			controlVariant="soft"
			showFirstLast
		/>
	</Matrix>

	<Matrix caption="Stepper" varies="mode (classic, vertical)" layout="stack">
		<Stepper items={stepperItems} defaultValue={1} class="border-neutral-muted rounded-lg border">
			{#snippet children({ item, index })}
				<div class="gap-xs p-md grid">
					<p class="text-neutral/50 text-xs">Step {index + 1}</p>
					<p class="text-neutral font-medium">{item.title}</p>
					<p class="text-neutral/70 text-sm">{item.body}</p>
				</div>
			{/snippet}
		</Stepper>
		<Stepper
			items={stepperItems}
			mode="vertical"
			defaultValue={0}
			class="border-neutral-muted rounded-lg border"
		>
			{#snippet children({ item })}
				<div class="p-md text-neutral/70 text-sm">{item.body}</div>
			{/snippet}
		</Stepper>
	</Matrix>

	{#each accordionVariants as variant (variant)}
		<Matrix
			caption="Accordion — variant {variant}"
			varies="size, density, splitted, icon"
			layout="grid"
			class="items-start"
		>
			<Accordion {variant} {size} {density} items={accordionItems} defaultValue={['0']} />
			<Accordion {variant} {size} {density} items={accordionItems} splitted icon="plus-minus" />
			<Accordion {variant} {size} {density} items={accordionItems} oneAtATime icon="none" />
		</Matrix>
	{/each}

	<Matrix
		caption="Collapsible"
		varies="size, variant, defaultOpen"
		layout="grid"
		class="items-start"
	>
		{#each sizes as collapsibleSize (collapsibleSize)}
			<Collapsible size={collapsibleSize} trigger="Size {collapsibleSize}" defaultOpen>
				<p class="p-sm text-neutral/70 text-sm">Disclosed content.</p>
			</Collapsible>
		{/each}
		<Collapsible {size} trigger="Closed by default">
			<p class="p-sm text-neutral/70 text-sm">Hidden content.</p>
		</Collapsible>
		<Collapsible {size} trigger="Disabled" disabled>
			<p class="p-sm text-neutral/70 text-sm">Hidden content.</p>
		</Collapsible>
		<Collapsible {size} variant="peek" peekHeight={40} trigger="Peek variant">
			<p class="p-sm text-neutral/70 text-sm">
				A long body that is clipped to the peek height until expanded, so the fade and the trigger
				can be judged together.
			</p>
		</Collapsible>
	</Matrix>

	<Matrix caption="Menu" varies="density, submenu, option colors" layout="grid" class="items-start">
		{#each densities as menuDensity (menuDensity)}
			<div class="border-neutral-muted bg-surface p-xs rounded-lg border">
				<Menu density={menuDensity} items={menuItems} />
			</div>
		{/each}
	</Matrix>

	<Matrix
		caption="MenuOption"
		varies="color, selected, highlighted, disabled"
		layout="grid"
		class="items-start"
	>
		{#each colors as color (color)}
			<MenuOption
				{color}
				{size}
				{density}
				title={color}
				description="Option description"
				prefix={gearIcon}
			/>
		{/each}
		<MenuOption {size} {density} title="Selected" selected />
		<MenuOption {size} {density} title="Highlighted" highlighted />
		<MenuOption {size} {density} title="Disabled" disabled />
	</Matrix>

	<Matrix caption="MenuBar" varies="size" layout="stack">
		{#each sizes as barSize (barSize)}
			<MenuBar
				size={barSize}
				menus={[
					{ label: 'File', items: menuItems },
					{ label: 'Edit', items: menuItems },
					{ label: 'View', items: menuItems, disabled: true }
				]}
			/>
		{/each}
	</Matrix>

	<Matrix
		caption="ToggleMenu"
		varies="color, variant, item types (toggle, group, radio-group, menu)"
		layout="stack"
	>
		{#each colors as color (color)}
			<ToggleMenu
				label="Editor toolbar {color}"
				{color}
				{size}
				variant="ghost"
				items={[
					{ type: 'toggle', children: 'Bold', defaultValue: true },
					{
						type: 'group',
						label: 'Alignment',
						joined: true,
						items: [
							{ value: 'left', children: 'L' },
							{ value: 'center', children: 'C' },
							{ value: 'right', children: 'R' }
						],
						defaultValue: ['left']
					},
					{
						type: 'radio-group',
						label: 'View mode',
						joined: true,
						items: [
							{ value: 'list', children: 'List' },
							{ value: 'grid', children: 'Grid' }
						],
						defaultValue: 'list'
					},
					{ type: 'menu', children: 'More', menu: menuItems }
				]}
			/>
		{/each}
	</Matrix>

	<Matrix
		caption="TableOfContents"
		varies="color, size, showRail, showMarkers"
		note="Fed a static item list; scroll-spy needs a live scroll target."
		layout="grid"
		class="items-start"
	>
		{#each colors as color (color)}
			<TableOfContents items={tocItems} {color} {size} label="Sections {color}" />
		{/each}
		<TableOfContents items={tocItems} color="neutral" {size} showRail={false} label="No rail" />
		<TableOfContents
			items={tocItems}
			color="neutral"
			{size}
			showMarkers="always"
			showConnectors
			label="Markers always"
		/>
	</Matrix>

	<Matrix
		caption="Sidebar"
		varies="variant (admin, floating, inset, split) via frame='contained'"
		note="Rendered inside a fixed-height contained frame; the page side is skeleton content."
		layout="stack"
	>
		{#each ['admin', 'floating', 'inset', 'split'] as const as variant (variant)}
			<div
				class="border-neutral-muted bg-neutral-muted h-72 w-full overflow-hidden rounded-lg border"
			>
				<Sidebar
					items={sidebarGroups}
					{variant}
					{size}
					{density}
					frame="contained"
					collapsible="icon"
					widthIcon="3.5rem"
					headerButton={{ icon: commandIcon, title: 'Acme Studio', subtitle: variant }}
					footerButton={{ avatar: { fallback: 'AR' }, title: 'Arnaud', subtitle: 'arnaud@acme.io' }}
				>
					<div class="bg-surface p-lg grid h-full place-items-center">
						<div class="gap-sm grid w-full max-w-md">
							<Skeleton color="primary" class="h-3 w-11/12 rounded-full" />
							<Skeleton class="h-3 w-8/12 rounded-full" />
							<Skeleton class="h-3 w-full rounded-full" />
						</div>
					</div>
				</Sidebar>
			</div>
		{/each}
	</Matrix>
</Section>
