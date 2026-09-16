<script lang="ts">
	import {
		AppShell,
		type AppShellActions,
		type AppShellSidebarProps,
		type AppShellThemeProps
	} from '$lib/components/AppShell/index.js';
	import { SegmentedControl } from '$lib/components/SegmentedControl/index.js';
	import type { SidebarGroup, SidebarVariant } from '$lib/components/Sidebar/index.js';
	import { arrowClockwiseIcon } from '$lib/components/Icons/arrowClockwise.js';
	import { chartBarIcon } from '$lib/components/Icons/chartBar.js';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { downloadSimpleIcon } from '$lib/components/Icons/downloadSimple.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { plusIcon } from '$lib/components/Icons/plus.js';
	import { trayIcon } from '$lib/components/Icons/tray.js';
	import { usersIcon } from '$lib/components/Icons/users.js';

	type VariantRecipe = {
		id: string;
		name: string;
		description: string;
		title: string;
		variant: SidebarVariant;
		contentWidth: 'full' | 'narrow' | 'normal' | 'wide' | 'prose';
		contentPadding: 'none' | 'small' | 'normal' | 'large';
		sidebar: Pick<AppShellSidebarProps, 'collapsible' | 'rail' | 'width' | 'widthIcon'>;
		items: SidebarGroup[];
	};
	type MobileActionCountOption = '0' | '1' | '2';

	let selectedRecipeId = $state('inset');
	let sidebarWidth = $state('16rem');
	let contentWidth = $state<VariantRecipe['contentWidth']>('wide');
	let contentPadding = $state<VariantRecipe['contentPadding']>('normal');
	let actionOverflow = $state<'auto' | 'never'>('auto');
	let mobileActionCountOption = $state<MobileActionCountOption>('1');

	const contentWidthItems = [
		{ value: 'full', label: 'Full' },
		{ value: 'narrow', label: 'Narrow' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'wide', label: 'Wide' },
		{ value: 'prose', label: 'Prose' }
	] as const;

	const contentPaddingItems = [
		{ value: 'none', label: 'None' },
		{ value: 'small', label: 'Small' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Large' }
	] as const;

	const actionOverflowItems = [
		{ value: 'auto', label: 'Auto' },
		{ value: 'never', label: 'Never' }
	] as const;

	const mobileActionCountItems = [
		{ value: '0', label: '0' },
		{ value: '1', label: '1' },
		{ value: '2', label: '2' }
	] as const;

	const mobileActionCounts = { '0': 0, '1': 1, '2': 2 } as const;

	const previewAppShellTheme = {
		root: {
			base: 'h-full min-h-full overflow-auto rounded-lg border border-neutral-muted'
		}
	} satisfies AppShellThemeProps;

	const productGroups: SidebarGroup[] = [
		{
			label: 'Workspace',
			items: [
				{ label: 'Overview', href: '#overview', icon: houseIcon },
				{ label: 'Analytics', href: '#analytics', icon: chartBarIcon, isActive: true },
				{ label: 'Customers', href: '#customers', icon: usersIcon, badge: 24 },
				{ label: 'Inbox', href: '#inbox', icon: trayIcon, badge: 6 },
				{ label: 'Settings', href: '#settings', icon: gearIcon }
			]
		}
	];

	const variantRecipes: VariantRecipe[] = [
		{
			id: 'classic',
			name: 'Classic admin',
			description: 'Full-width workspace with a fixed, tinted navigation column.',
			title: 'Operations',
			variant: 'admin',
			contentWidth: 'full',
			contentPadding: 'normal',
			sidebar: {
				collapsible: 'none',
				width: '16rem'
			},
			items: productGroups
		},
		{
			id: 'inset',
			name: 'Inset workspace',
			description: 'Content is inset over the dark application wall beside integrated navigation.',
			title: 'Revenue cockpit',
			variant: 'inset',
			contentWidth: 'wide',
			contentPadding: 'normal',
			sidebar: { collapsible: 'icon', rail: true, width: '16rem' },
			items: productGroups
		},
		{
			id: 'floating',
			name: 'Floating console',
			description: 'Detached navigation with dense command-style content.',
			title: 'Command center',
			variant: 'floating',
			contentWidth: 'normal',
			contentPadding: 'small',
			sidebar: { collapsible: 'icon', rail: true, width: '15rem' },
			items: productGroups
		},
		{
			id: 'split',
			name: 'Split panels',
			description: 'Detached sidebar and content surfaces share the same lower application wall.',
			title: 'Component browser',
			variant: 'split',
			contentWidth: 'normal',
			contentPadding: 'normal',
			sidebar: { collapsible: 'icon', rail: true, width: '17rem' },
			items: productGroups
		}
	];

	const headerActions = [
		{ label: 'Refresh', squared: true, variant: 'outline', prefix: arrowClockwiseIcon },
		{ content: 'Export', variant: 'outline', prefix: downloadSimpleIcon },
		{ content: 'Create', color: 'primary', prefix: plusIcon }
	] satisfies AppShellActions;

	const selectedRecipe = $derived(
		variantRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? variantRecipes[0]
	);
	const mobileActionCount = $derived(mobileActionCounts[mobileActionCountOption]);

	const sidebar = $derived<AppShellSidebarProps>({
		...selectedRecipe.sidebar,
		items: selectedRecipe.items,
		width: sidebarWidth,
		widthIcon: selectedRecipe.sidebar.widthIcon ?? '3.5rem',
		resizable: {
			minWidth: '12rem',
			maxWidth: '24rem',
			onWidthChange: ({ width }) => {
				sidebarWidth = width;
			}
		},
		headerButton: {
			icon: commandIcon,
			title: selectedRecipe.name,
			subtitle: 'Workspace'
		}
	});

	function selectRecipe(recipe: VariantRecipe) {
		selectedRecipeId = recipe.id;
		sidebarWidth = recipe.sidebar.width ?? '16rem';
		contentWidth = recipe.contentWidth;
		contentPadding = recipe.contentPadding;
	}
</script>

<div class="grid gap-4">
	<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
		{#each variantRecipes as recipe, index (index)}
			<button
				type="button"
				class="rounded-lg border p-3 text-left transition {selectedRecipeId === recipe.id
					? 'border-primary bg-primary/10 text-neutral'
					: 'border-neutral-muted bg-surface-raised text-neutral/70 hover:border-primary/50 hover:text-neutral'}"
				aria-pressed={selectedRecipeId === recipe.id}
				onclick={() => selectRecipe(recipe)}
			>
				<span class="block text-sm font-semibold">{recipe.name}</span>
				<span class="mt-1 block text-xs leading-5">{recipe.description}</span>
			</button>
		{/each}
	</div>

	<section
		aria-label="App shell layout controls"
		class="border-neutral-muted bg-surface grid gap-4 rounded-lg border p-4 lg:grid-cols-2"
	>
		<div class="grid gap-2">
			<span class="text-neutral text-sm font-medium">Content width</span>
			<SegmentedControl
				items={contentWidthItems}
				bind:value={contentWidth}
				size="small"
				label="Content width"
			/>
		</div>
		<div class="grid gap-2">
			<span class="text-neutral text-sm font-medium">Content padding</span>
			<SegmentedControl
				items={contentPaddingItems}
				bind:value={contentPadding}
				size="small"
				label="Content padding"
			/>
		</div>
		<div class="grid gap-2">
			<span class="text-neutral text-sm font-medium">Action overflow</span>
			<SegmentedControl
				items={actionOverflowItems}
				bind:value={actionOverflow}
				size="small"
				label="Action overflow"
			/>
		</div>
		<div class="grid gap-2">
			<span class="text-neutral text-sm font-medium">Mobile inline actions</span>
			<SegmentedControl
				items={mobileActionCountItems}
				bind:value={mobileActionCountOption}
				size="small"
				label="Mobile inline actions"
			/>
		</div>
	</section>

	<div class="grid gap-2 md:grid-cols-2">
		<div class="border-neutral-muted bg-surface-raised rounded-lg border p-3">
			<p class="text-neutral text-sm font-semibold">Icon rail is a state</p>
			<p class="text-neutral/65 mt-1 text-xs leading-5">
				Use <code>collapsible="icon"</code>, <code>rail</code>, and optionally
				<code>displayState="collapsed"</code> on the inset, floating, or split variant.
			</p>
		</div>
		<div class="border-neutral-muted bg-surface-raised rounded-lg border p-3">
			<p class="text-neutral text-sm font-semibold">Docs prose is page layout</p>
			<p class="text-neutral/65 mt-1 text-xs leading-5">
				It is mainly <code>contentWidth="prose"</code> plus larger PageShell padding, not a separate AppShell
				shape.
			</p>
		</div>
	</div>

	<div class="h-[620px] w-full">
		<AppShell
			{sidebar}
			variant={selectedRecipe.variant}
			title={selectedRecipe.title}
			subtitle={selectedRecipe.description}
			eyebrow={`${selectedRecipe.variant} / ${selectedRecipe.sidebar.collapsible}`}
			{headerActions}
			{contentPadding}
			{contentWidth}
			{actionOverflow}
			{mobileActionCount}
			theme={previewAppShellTheme}
		>
			{#snippet footer()}
				<div class="flex items-center gap-2">
					<span class="bg-success size-1.5 rounded-full"></span>
					<span>{selectedRecipe.name} workspace ready</span>
				</div>
			{/snippet}

			<div class="grid gap-4">
				<section class="border-neutral-muted bg-surface-raised rounded-lg border p-4">
					<p class="text-neutral text-sm font-medium">Recipe anatomy</p>
					<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						{#each [['Sidebar', selectedRecipe.variant], ['Collapse', selectedRecipe.sidebar.collapsible], ['Rail', selectedRecipe.sidebar.rail ? 'edge toggle' : 'none'], ['Content', contentWidth]] as detail, index (index)}
							<div class="border-neutral-muted bg-surface rounded-md border p-3">
								<p class="text-neutral/65 text-xs font-medium tracking-normal uppercase">
									{detail[0]}
								</p>
								<p class="text-neutral mt-2 text-sm font-semibold">{detail[1]}</p>
							</div>
						{/each}
					</div>
				</section>

				<section class="border-neutral-muted bg-surface-raised rounded-lg border p-4">
					<p class="text-neutral text-sm font-medium">Primary surface</p>
					<p class="text-neutral/70 mt-3 text-sm leading-6">
						{selectedRecipe.description} This preview keeps the same AppShell component and only switches
						Sidebar and PageShell props.
					</p>
					<div class="mt-5 grid gap-3 sm:grid-cols-3">
						{#each ['Pipeline', 'Quality', 'Velocity'] as metric, index (index)}
							<div class="border-neutral-muted bg-surface rounded-md border p-3">
								<p class="text-neutral/70 text-sm">{metric}</p>
								<p class="text-neutral mt-2 text-2xl font-semibold">{82 + index * 6}%</p>
							</div>
						{/each}
					</div>
				</section>
			</div>
		</AppShell>
	</div>
</div>
