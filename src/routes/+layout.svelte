<script lang="ts">
	import '../app.css';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import {
		AppShell,
		type AppShellApi,
		type AppShellSidebarProps
	} from '$lib/components/AppShell/index.js';
	import { Button } from '$lib/components/Button/index.js';
	import Confirmation from '$lib/components/Confirmation/Confirmation.svelte';
	import Ask from '$lib/components/Form/Ask/Ask.svelte';
	import { commandIcon } from '$lib/components/Icons/command.js';
	import { sidebarSimpleIcon } from '$lib/components/Icons/sidebarSimple.js';
	import { NetworkIndicator } from '$lib/components/NetworkIndicator/index.js';
	import type { PageShellThemeProps } from '$lib/components/PageShell/index.js';
	import type {
		SidebarApi,
		SidebarCollapsible,
		SidebarDisplayState,
		SidebarVariant
	} from '$lib/components/Sidebar/index.js';
	import Theme from '$lib/components/Theme/Theme.svelte';
	import type {
		ThemeDesignTokenMap,
		ThemeDesignTokens,
		TypeScalePreset
	} from '$lib/components/Theme/theme.designTokens.js';
	import type { ThemeState } from '$lib/components/Theme/theme.state.svelte.js';
	import { themeTransitions, type ThemeTransition } from '$lib/components/Theme/themeTransition.js';
	import { tick } from 'svelte';
	import { getSidebarGroups, headerLinks } from './appNavigation.js';
	import { createRuntimeThemePlayground } from './runtimeThemePlayground.svelte.js';
	import SidebarCommandPalette from './SidebarCommandPalette.svelte';

	const { children: childrenSnippet } = $props();
	const runtimeThemePlayground = createRuntimeThemePlayground();

	type SidebarFooterState = 'expanded' | 'icon' | 'hidden';

	const sidebarVariants: SidebarVariant[] = ['admin', 'floating', 'inset', 'split'];
	const sidebarStates: SidebarFooterState[] = ['expanded', 'icon', 'hidden'];
	const runtimeTokenPresets = {
		compact: {
			spacing: 'small',
			radius: 'small',
			typeScale: 'compact',
			raisedWithBorder: false
		},
		default: {
			spacing: 'normal',
			radius: 'normal',
			typeScale: 'default',
			raisedWithBorder: true
		},
		comfortable: {
			spacing: 'large',
			radius: 'large',
			typeScale: 'comfortable',
			raisedWithBorder: true
		},
		large: {
			spacing: 1.35,
			radius: 'round',
			typeScale: 'large',
			raisedWithBorder: true
		}
	} satisfies Record<TypeScalePreset, ThemeDesignTokens>;
	const defaultDesignTokens = {
		spacing: 'normal',
		radius: 'normal',
		raisedWithBorder: true
	} satisfies ThemeDesignTokens;
	const docsPageShellTheme = {
		contentInner: {
			padding: { large: 'p-5 md:p-5' }
		}
	} satisfies PageShellThemeProps;
	const isPreviewRoute = $derived(page.route.id?.startsWith('/previews/') ?? false);
	const activeDesignTokens = $derived(
		page.route.id === '/fluid-scale'
			? resolveRuntimeTokenPreset(page.url.searchParams.get('preset'))
			: defaultDesignTokens
	);
	const designTokens = $derived(
		page.route.id === '/playground'
			? runtimeThemePlayground.designTokens
			: ({
					light: activeDesignTokens,
					dark: activeDesignTokens
				} satisfies ThemeDesignTokenMap<readonly ['light', 'dark']>)
	);
	let sidebarDisplayState = $state<SidebarDisplayState>('expanded');
	let sidebarVariant = $state<SidebarVariant>('inset');
	let sidebarCollapsedDisplayState = $state<Exclude<SidebarDisplayState, 'expanded'>>('hidden');
	let sidebarWidth = $state('16rem');
	let appShellRef = $state<HTMLElement | null>(null);
	const pageScrollPositions = new Map<string, number>();

	const sidebarGroups = $derived(getSidebarGroups(page.url.pathname));
	const sidebarState = $derived<SidebarFooterState>(
		sidebarDisplayState === 'collapsed' ? 'icon' : sidebarDisplayState
	);
	const sidebarCollapsible = $derived<SidebarCollapsible>(
		sidebarCollapsedDisplayState === 'hidden' ? 'offcanvas' : 'icon'
	);
	const themeTransition = $derived(
		page.route.id === '/docs/theme-transitions'
			? resolveThemeTransition(page.url.searchParams.get('transition'))
			: 'radial-top-right'
	);

	function resolveThemeTransition(value: string | null): ThemeTransition {
		return themeTransitions.find((transition) => transition === value) ?? 'radial-top-right';
	}

	function resolveRuntimeTokenPreset(value: string | null): ThemeDesignTokens {
		return value && isRuntimeTokenPreset(value)
			? runtimeTokenPresets[value]
			: runtimeTokenPresets.default;
	}

	function isRuntimeTokenPreset(value: string): value is TypeScalePreset {
		return Object.hasOwn(runtimeTokenPresets, value);
	}

	function setSidebarState(nextState: SidebarFooterState) {
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

	function getPageScroller() {
		return appShellRef?.querySelector<HTMLElement>('[data-slot="page-shell-content"]') ?? null;
	}

	function getScrollKey(url: URL) {
		return `${url.pathname}${url.search}${url.hash}`;
	}

	function getHashTarget(hash: string) {
		const encodedId = hash.slice(1);
		if (!encodedId) return null;

		try {
			return document.getElementById(decodeURIComponent(encodedId));
		} catch {
			return document.getElementById(encodedId);
		}
	}

	beforeNavigate(({ from }) => {
		const scroller = getPageScroller();
		if (!from || !scroller) return;

		pageScrollPositions.set(getScrollKey(from.url), scroller.scrollTop);
	});

	afterNavigate(async ({ type, to }) => {
		if (!to) return;

		await tick();
		const scroller = getPageScroller();
		if (!scroller) return;

		if (type === 'popstate') {
			scroller.scrollTop = pageScrollPositions.get(getScrollKey(to.url)) ?? 0;
			return;
		}

		const hashTarget = getHashTarget(to.url.hash);
		if (hashTarget) {
			hashTarget.scrollIntoView({ block: 'start' });
			return;
		}

		scroller.scrollTop = 0;
	});

	const sidebar = $derived<AppShellSidebarProps>({
		displayState: sidebarDisplayState,
		onDisplayStateChange: handleSidebarDisplayStateChange,
		collapsible: sidebarCollapsible,
		rail: true,
		edgeReveal: true,
		width: sidebarWidth,
		density: 'small',
		size: 'small',
		widthMobile: '18rem',
		resizable: {
			minWidth: '12rem',
			maxWidth: '24rem',
			storageKey: 'svelai-docs-sidebar-width',
			onWidthChange: (nextWidth) => {
				sidebarWidth = nextWidth;
			}
		},
		items: sidebarGroups,
		headerButton: {
			icon: commandIcon,
			title: 'Svelai',
			subtitle: page.url.pathname.startsWith('/blocks') ? 'Blocks' : 'Components'
		},
		footer: sidebarFooter
	});
</script>

{#snippet headerLink({ href, text }: { href: string; text: string })}
	{@const isActive = page.url.pathname === href || page.url.pathname.startsWith(`${href}/`)}
	<a
		{href}
		class="state-layer rounded-md px-2 py-1 text-sm font-medium text-neutral transition-colors hover:text-neutral {isActive
			? 'bg-primary/15 text-primary'
			: ''}"
	>
		{text}
	</a>
{/snippet}

{#snippet shellFooter()}
	<div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
		<div class="flex min-w-0 flex-wrap items-center gap-1.5">
			<span class="mr-1 text-xs font-medium text-neutral/60">Variant</span>
			<div class="flex flex-wrap items-center gap-1" role="group" aria-label="Sidebar variant">
				{#each sidebarVariants as variant}
					<Button
						variant={sidebarVariant === variant ? 'solid' : 'ghost'}
						size="small"
						onclick={() => (sidebarVariant = variant)}
					>
						{variant}
					</Button>
				{/each}
			</div>
		</div>

		<div class="flex min-w-0 flex-wrap items-center gap-1.5">
			<span class="mr-1 text-xs font-medium text-neutral/60">State</span>
			<div class="flex flex-wrap items-center gap-1" role="group" aria-label="Sidebar state">
				{#each sidebarStates as state}
					<Button
						variant={sidebarState === state ? 'solid' : 'ghost'}
						size="small"
						onclick={() => setSidebarState(state)}
					>
						{state}
					</Button>
				{/each}
			</div>
		</div>
	</div>
{/snippet}

{#snippet sidebarFooter(api: SidebarApi)}
	<SidebarCommandPalette
		groups={sidebarGroups}
		collapsed={api.collapsible === 'icon' && api.state === 'collapsed' && !api.isMobile}
	/>
{/snippet}
<Theme transition={themeTransition} {designTokens}>
	{#snippet children(theme: ThemeState)}
		<Ask />
		{#if isPreviewRoute}
			{@render childrenSnippet()}
		{:else}
			{#snippet shellHeader({ sidebar }: AppShellApi)}
				<div class="flex min-h-12 items-center justify-between gap-3 px-3 py-2 sm:px-4">
					<div class="flex min-w-0 items-center gap-2">
						<Button
							prefix={sidebarSimpleIcon}
							label="Toggle sidebar"
							variant="ghost"
							size="small"
							squared
							class="md:hidden"
							onclick={() => sidebar.toggle()}
						/>
						<nav aria-label="Primary" class="flex min-w-0 flex-wrap items-center gap-1">
							{#each headerLinks as link}
								{@render headerLink(link)}
							{/each}
						</nav>
					</div>
					<Button
						variant="outline"
						size="small"
						onclick={() => (theme.theme = theme.resolvedTheme === 'dark' ? 'light' : 'dark')}
					>
						{theme.resolvedTheme === 'dark' ? 'Light' : 'Dark'}
					</Button>
				</div>
			{/snippet}

			<NetworkIndicator color="danger" />
			<Confirmation />
			<AppShell
				bind:ref={appShellRef}
				{sidebar}
				variant={sidebarVariant}
				header={shellHeader}
				footer={shellFooter}
				contentPadding="large"
				contentWidth="wide"
				pageShellTheme={docsPageShellTheme}
			>
				{#snippet children()}
					{@render childrenSnippet()}
				{/snippet}
			</AppShell>
		{/if}
	{/snippet}
</Theme>
