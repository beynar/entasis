<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { AppShell, type AppShellSidebarProps } from 'svelai/app-shell';
	import { Button } from 'svelai/button';
	import { Empty } from 'svelai/empty';
	import { Kbd } from 'svelai/kbd';
	import { Select, type SelectItems } from 'svelai/select';
	import { Tabs } from 'svelai/tabs';
	import { TextInput } from 'svelai/text-input';
	import type { SidebarGroup, SidebarIcon } from 'svelai/sidebar';
	import { calendarBlankIcon } from 'svelai/icons/calendarBlank';
	import { chartBarIcon } from 'svelai/icons/chartBar';
	import { cubeIconFill } from 'svelai/icons/cube';
	import { dotsSixVerticalIcon } from 'svelai/icons/dotsSixVertical';
	import { leafIconFill } from 'svelai/icons/leaf';
	import { planetIconFill } from 'svelai/icons/planet';
	import { sparkleIconFill } from 'svelai/icons/sparkle';
	import { fileTextIcon } from 'svelai/icons/fileText';
	import { flowerIconFill } from 'svelai/icons/flower';
	import { gearIcon } from 'svelai/icons/gear';
	import { houseIcon } from 'svelai/icons/house';
	import { kanbanIcon } from 'svelai/icons/kanban';
	import { lightningIcon } from 'svelai/icons/lightning';
	import { listChecksIcon } from 'svelai/icons/listChecks';
	import { magnifyingGlassIcon } from 'svelai/icons/magnifyingGlass';
	import { plusIcon } from 'svelai/icons/plus';
	import { receiptIcon } from 'svelai/icons/receipt';
	import { rocketLaunchIcon } from 'svelai/icons/rocketLaunch';
	import { shieldCheckIcon } from 'svelai/icons/shieldCheck';
	import { sidebarSimpleIcon } from 'svelai/icons/sidebarSimple';
	import { sortAscendingIcon } from 'svelai/icons/sortAscending';
	import { squaresFourIcon } from 'svelai/icons/squaresFour';
	import { usersIcon } from 'svelai/icons/users';
	import {
		elevationVariables,
		radiusVariables,
		spacingScaleVariables,
		spacingVariable,
		typeScaleVariables
	} from '$lib/tailwind/scales.js';
	import ListsPanel from './ListsPanel.svelte';
	import OverviewPanel from './OverviewPanel.svelte';
	import TimelinePanel from './TimelinePanel.svelte';
	import { essentials, pageTabs, projects, support, workspace } from './data.js';

	// tokens:start
	// The single place in this template where a raw colour may be written. Every role gets the
	// companions the library derives at build time (`-light`, `-lighter`, `-dark`, `-muted`,
	// `-contrast`, `-readable`, `-muted-readable`) so component variants stay coherent.
	const colorKit = (name: string, color: string, contrast: string) => ({
		[`--color-${name}`]: color,
		[`--color-${name}-light`]: `color-mix(in oklab, ${color} 82%, white)`,
		[`--color-${name}-lighter`]: `color-mix(in oklab, ${color} 60%, white)`,
		[`--color-${name}-dark`]: `color-mix(in oklab, ${color} 78%, black)`,
		[`--color-${name}-muted`]: `color-mix(in oklab, ${color} 16%, var(--color-surface))`,
		[`--color-${name}-contrast`]: contrast,
		[`--color-${name}-readable`]: `color-mix(in oklab, ${color} 70%, black)`,
		[`--color-${name}-muted-readable`]: `color-mix(in oklab, ${color} 55%, black)`
	});

	// One element scopes the whole kit, so the docs shell around the template keeps its own theme.
	// Geometry comes from the shared scale helpers — never hand-written steps.
	const templateTokens: Record<string, string> = {
		'--font-sans': "'Manrope', ui-sans-serif, system-ui, sans-serif",
		...spacingVariable('large'),
		...spacingScaleVariables({}),
		...radiusVariables('large'),
		...elevationVariables('flat', 'light'),
		...typeScaleVariables({ baseMinPx: 15, baseMaxPx: 16, scale: 'majorThird' }),
		'--color-surface': '#ffffff',
		'--color-surface-raised': '#ffffff',
		'--color-surface-floating': '#ffffff',
		'--color-surface-recessed': '#f7f6f4',
		'--color-surface-canvas': '#f0eeea',
		...colorKit('neutral', '#16140f', '#ffffff'),
		// In progress / completed / pending, as the reference paints them.
		...colorKit('primary', '#ee8a3d', '#ffffff'),
		...colorKit('secondary', '#c3bcf0', '#16140f'),
		...colorKit('info', '#b3998b', '#ffffff'),
		...colorKit('success', '#3da368', '#ffffff'),
		...colorKit('warning', '#ee8a3d', '#16140f'),
		...colorKit('danger', '#e0566f', '#ffffff'),
		// Every hairline in the reference is one flat grey rather than a tint of the text colour.
		'--color-neutral-muted': '#e7e4de',
		'--color-neutral-muted-readable': '#16140f'
	};

	const templateStyle = Object.entries(templateTokens)
		.map(([property, value]) => `${property}:${value}`)
		.join(';');
	// tokens:end

	const essentialIcons: Record<(typeof essentials)[number]['id'], SidebarIcon> = {
		home: houseIcon,
		tasks: listChecksIcon,
		calendar: calendarBlankIcon,
		team: usersIcon,
		docs: fileTextIcon,
		automations: lightningIcon,
		reporting: chartBarIcon
	};

	const supportIcons: Record<(typeof support)[number]['id'], SidebarIcon> = {
		settings: gearIcon,
		releases: rocketLaunchIcon
	};

	const statusOptions: SelectItems = [
		{ value: 'all', label: 'All' },
		{ value: 'in-progress', label: 'In progress' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'completed', label: 'Completed' }
	];

	const tabItems = pageTabs.map((tab) => ({ value: tab.toLowerCase(), label: tab }));
	const tabValues = tabItems.map((tab) => tab.value);

	let headerQuery = $state('');
	let sidebarQuery = $state('');
	let statusFilter = $state<string | null>('all');

	/** `?tab=` is the source of truth, so `?tab=timeline` deep-links straight to the Gantt. */
	const activeTab = $derived.by(() => {
		const requested = page.url.searchParams.get('tab');
		return requested && tabValues.includes(requested) ? requested : 'overview';
	});

	function selectTab(value: string) {
		if (value === activeTab) return;
		// `resolve()` only accepts a route id, so the query is appended to what it returns.
		const base = resolve('/templates/tasks-dashboard');
		const target = (value === 'overview' ? base : `${base}?tab=${value}`) as ResolvedPathname;
		void goto(target, { keepFocus: true, noScroll: true, replaceState: true });
	}

	const sidebarGroups = $derived.by((): SidebarGroup[] => {
		// Role tints stand in for the reference's per-project hexes, which are not allowed here.
		// The tinted square itself is the library's `iconVariant: 'tile'` + `iconColor`.
		const projectIcons: Record<string, SidebarIcon> = {
			atlas: leafIconFill,
			nimbus: sparkleIconFill,
			orion: cubeIconFill,
			helio: planetIconFill
		};

		return [
			{
				label: 'Essentials',
				items: essentials.map((item) => ({
					label: item.label,
					href: `#${item.id}`,
					icon: essentialIcons[item.id],
					isActive: item.id === 'tasks'
				}))
			},
			{
				label: 'Projects',
				collapsible: true,
				defaultOpen: true,
				separator: true,
				action: [
					{
						icon: plusIcon,
						label: 'Add to Projects',
						menu: [
							{ type: 'option', children: 'New project', prefix: plusIcon },
							{ type: 'option', children: 'Import from template' }
						]
					},
					{ icon: dotsSixVerticalIcon, label: 'Reorder projects' }
				],
				items: projects.map((project) => ({
					label: project.label,
					href: `#${project.id}`,
					icon: projectIcons[project.id],
					iconColor: project.tint,
					iconVariant: 'tile' as const
				}))
			},
			{
				label: 'Management',
				collapsible: true,
				defaultOpen: false,
				separator: true,
				action: {
					icon: plusIcon,
					label: 'Add to Management',
					menu: [{ type: 'option', children: 'New policy', prefix: plusIcon }]
				},
				items: [
					{ label: 'Permissions', href: '#permissions', icon: shieldCheckIcon },
					{ label: 'Billing', href: '#billing', icon: receiptIcon }
				]
			},
			{
				label: 'Support',
				collapsible: true,
				defaultOpen: true,
				separator: true,
				action: {
					icon: plusIcon,
					label: 'Add to Support',
					menu: [{ type: 'option', children: 'New request', prefix: plusIcon }]
				},
				items: support.map((item) => ({
					label: item.label,
					href: `#${item.id}`,
					icon: supportIcons[item.id]
				}))
			}
		];
	});

	const sidebar = $derived<AppShellSidebarProps>({
		size: 'large',
		density: 'normal',
		activeVariant: 'outline',
		collapsible: 'offcanvas',
		rail: true,
		width: '20rem',
		headerButton: {
			icon: flowerIconFill,
			title: workspace.user,
			subtitle: workspace.company,
			trailing: {
				icon: sidebarSimpleIcon,
				label: 'Collapse sidebar',
				onclick: (_event, api) => api.toggle()
			},
			onclick: (_event, api) => api.toggle()
		},
		search: {
			placeholder: 'Search',
			label: 'Search the workspace',
			value: sidebarQuery,
			oninput: (event) => {
				sidebarQuery = event.currentTarget.value;
			}
		},
		items: sidebarGroups
	});
</script>

{#snippet searchShortcut()}
	<Kbd size="small" keys={['⌘', 'F']} />
{/snippet}

{#snippet pageTitle()}
	<span class="text-4xl leading-tight font-light">Tasks</span>
{/snippet}

{#snippet statusPrefix()}
	<span class="text-neutral/70 shrink-0">Status:</span>
{/snippet}

{#snippet headerActions()}
	<!--
		A snippet rather than a `PageShellAction[]`: the row mixes a TextInput and a Select with
		the buttons, and the action array only renders Buttons.
	-->
	<div class="gap-sm flex flex-wrap items-center justify-end">
		<TextInput
			bind:value={headerQuery}
			placeholder="Search"
			size="large"
			prefix={magnifyingGlassIcon}
			suffix={searchShortcut}
			class="min-w-0"
			inputAttrs={{ 'aria-label': 'Search tasks' }}
		/>
		<Select
			bind:value={statusFilter}
			items={statusOptions}
			prefix={statusPrefix}
			size="large"
			class="min-w-0"
			triggerAttrs={{ 'aria-label': 'Filter by status' }}
		/>
		<Button variant="outline" size="large" prefix={sortAscendingIcon}>Sort</Button>
		<Button variant="outline" size="large" squared prefix={squaresFourIcon} label="Grid view" />
		<Button variant="outline" size="large" squared prefix={kanbanIcon} label="Board view" />
	</div>
{/snippet}

<AppShell
	{sidebar}
	variant="framed"
	eyebrow="Tasks"
	title={pageTitle}
	{headerActions}
	contentPadding="large"
	contentWidth="full"
	class="font-sans"
	style={templateStyle}
>
	<Tabs
		items={tabItems}
		value={activeTab}
		onValueChange={({ value }) => selectTab(value)}
		tabbar={{ size: 'large', fullWidth: true }}
		class="gap-xl h-full"
	>
		{#snippet children({ item })}
			{#if item.value === 'overview'}
				<OverviewPanel />
			{:else if item.value === 'lists'}
				<ListsPanel />
			{:else if item.value === 'timeline'}
				<TimelinePanel />
			{:else}
				<Empty
					size="large"
					title="Coming soon"
					description="The {item.label} view is not part of this template yet."
					media={kanbanIcon}
					mediaVariant="icon"
					bordered
				/>
			{/if}
		{/snippet}
	</Tabs>
</AppShell>
