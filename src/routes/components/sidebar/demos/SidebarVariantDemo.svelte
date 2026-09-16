<script lang="ts">
	import { AppShell, type AppShellSidebarProps } from '$lib/components/AppShell/index.js';
	import { Button } from '$lib/components/Button/index.js';
	import { SegmentedControl } from '$lib/components/SegmentedControl/index.js';
	import {
		type SidebarCollapsible,
		type SidebarDensity,
		type SidebarDisplayState,
		type SidebarGroup,
		type SidebarSize,
		type SidebarVariant
	} from '$lib/components/Sidebar/index.js';
	import { Skeleton } from '$lib/components/Skeleton/index.js';
	import { chartBarIcon } from '$lib/components/Icons/chartBar.js';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { fileIcon } from '$lib/components/Icons/file.js';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { usersIcon } from '$lib/components/Icons/users.js';

	type VariantRecipe = {
		id: string;
		label: string;
		variant: SidebarVariant;
	};
	type DemoState = 'expanded' | 'icon' | 'hidden';

	let sidebarDisplayState = $state<SidebarDisplayState>('expanded');
	let selectedRecipeId = $state('admin');
	let sidebarCollapsedDisplayState = $state<Exclude<SidebarDisplayState, 'expanded'>>('collapsed');
	let sidebarWidth = $state('16rem');
	let sidebarSize = $state<SidebarSize>('normal');
	let sidebarDensity = $state<SidebarDensity>('normal');

	const variantRecipes: VariantRecipe[] = [
		{ id: 'admin', label: 'admin', variant: 'admin' },
		{ id: 'floating', label: 'floating', variant: 'floating' },
		{ id: 'inset', label: 'inset', variant: 'inset' },
		{ id: 'split', label: 'split', variant: 'split' }
	];
	const demoStates: DemoState[] = ['expanded', 'icon', 'hidden'];
	const sidebarSizes = [
		{ value: 'small', label: 'Small' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Large' }
	] as const satisfies ReadonlyArray<{ value: SidebarSize; label: string }>;
	const sidebarDensities = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
	] as const satisfies ReadonlyArray<{ value: SidebarDensity; label: string }>;

	const selectedRecipe = $derived(
		variantRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? variantRecipes[0]
	);
	const sidebarState = $derived<DemoState>(
		sidebarDisplayState === 'collapsed' ? 'icon' : sidebarDisplayState
	);
	const sidebarCollapsible = $derived<SidebarCollapsible>(
		sidebarCollapsedDisplayState === 'hidden' ? 'offcanvas' : 'icon'
	);

	const items: SidebarGroup[] = [
		{
			label: 'Navigation',
			items: [
				{ label: 'Home', href: '#home', icon: houseIcon, isActive: true },
				{ label: 'Analytics', href: '#analytics', icon: chartBarIcon },
				{ label: 'Customers', href: '#customers', icon: usersIcon },
				{ label: 'Settings', href: '#settings', icon: gearIcon }
			]
		},
		{
			label: 'Project',
			tree: [
				{
					label: 'src',
					icon: folderIcon,
					defaultOpen: true,
					children: [
						{
							label: 'components',
							icon: folderIcon,
							defaultOpen: true,
							children: [
								{ label: 'Sidebar.svelte', href: '#variant-sidebar', icon: fileIcon },
								{ label: 'AppShell.svelte', href: '#variant-app-shell', icon: fileIcon }
							]
						},
						{ label: 'routes', href: '#variant-routes', icon: folderIcon }
					]
				},
				{ label: 'package.json', href: '#variant-package', icon: fileIcon }
			]
		}
	];

	function setSidebarState(nextState: DemoState) {
		if (nextState === 'expanded') {
			sidebarDisplayState = 'expanded';
			return;
		}

		const nextDisplayState = nextState === 'icon' ? 'collapsed' : 'hidden';
		sidebarCollapsedDisplayState = nextDisplayState;
		sidebarDisplayState = nextDisplayState;
	}

	function handleSidebarDisplayStateChange(nextDisplayState: SidebarDisplayState) {
		sidebarDisplayState = nextDisplayState;
		if (nextDisplayState !== 'expanded') {
			sidebarCollapsedDisplayState = nextDisplayState;
		}
	}

	function selectRecipe(recipe: VariantRecipe) {
		selectedRecipeId = recipe.id;
		sidebarWidth =
			recipe.variant === 'floating' ? '15rem' : recipe.variant === 'split' ? '17rem' : '16rem';
	}

	const sidebar = $derived<AppShellSidebarProps>({
		items,
		displayState: sidebarDisplayState,
		onDisplayStateChange: handleSidebarDisplayStateChange,
		collapsible: sidebarCollapsible,
		size: sidebarSize,
		density: sidebarDensity,
		rail: true,
		width: sidebarWidth,
		widthIcon: '3.5rem',
		resizable: {
			minWidth: '12rem',
			maxWidth: '24rem',
			storageKey: 'sidebar-variant-demo-width',
			onWidthChange: ({ width }) => {
				sidebarWidth = width;
			}
		},
		headerButton: {
			icon: commandIcon,
			title: 'Variant Lab',
			subtitle: selectedRecipe.label
		}
	});
</script>

<div class="flex h-[560px] w-full flex-col gap-3">
	<div class="flex flex-wrap items-center justify-center gap-4">
		<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Sidebar variant">
			{#each variantRecipes as recipe, index (index)}
				<Button
					variant={selectedRecipeId === recipe.id ? 'solid' : 'outline'}
					size="small"
					onclick={() => selectRecipe(recipe)}
				>
					{recipe.label}
				</Button>
			{/each}
		</div>

		<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Sidebar state">
			{#each demoStates as state, index (index)}
				<Button
					variant={sidebarState === state ? 'solid' : 'outline'}
					size="small"
					onclick={() => setSidebarState(state)}
				>
					{state}
				</Button>
			{/each}
		</div>

		<div class="grid gap-1.5">
			<span class="text-neutral/65 text-xs font-medium">Size</span>
			<SegmentedControl
				items={sidebarSizes}
				bind:value={sidebarSize}
				size="small"
				label="Sidebar size"
			/>
		</div>

		<div class="grid gap-1.5">
			<span class="text-neutral/65 text-xs font-medium">Density</span>
			<SegmentedControl
				items={sidebarDensities}
				bind:value={sidebarDensity}
				size="small"
				label="Sidebar density"
			/>
		</div>
	</div>

	<div class="min-h-0 flex-1">
		<AppShell
			{sidebar}
			variant={selectedRecipe.variant}
			title="Variant Lab"
			subtitle="Sidebar owns the wall and surface geometry shared by AppShell."
			eyebrow={`${selectedRecipe.label} / ${sidebarState} / ${sidebarSize} / ${sidebarDensity}`}
			contentPadding="normal"
			contentWidth="normal"
			theme={{
				root: {
					base: 'h-full min-h-full overflow-auto rounded-lg border border-neutral-muted'
				}
			}}
		>
			<div class="grid min-h-[22rem] place-items-center">
				<div class="grid w-full max-w-2xl gap-3">
					<Skeleton color="primary" class="h-3 w-11/12 rounded-full" />
					<Skeleton class="h-3 w-8/12 rounded-full" />
					<Skeleton class="h-3 w-full rounded-full" />
					<Skeleton color="primary" class="h-3 w-7/12 rounded-full" />
				</div>
			</div>
		</AppShell>
	</div>
</div>
