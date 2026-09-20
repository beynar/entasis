<script lang="ts">
	import '../app.css';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { SvelteMap } from 'svelte/reactivity';
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
	import {
		getSidebarGroups,
		headerLinks,
		resolveLink,
		type AppNavigationLink
	} from './appNavigation.js';
	import {
		PLAYGROUND_COOKIE,
		createRuntimeThemePlayground
	} from './runtimeThemePlayground.svelte.js';
	import { runtimeColorPaletteVariables } from './playground/runtimeColorPalettes.js';
	import PlaygroundPopover from './PlaygroundPopover.svelte';
	import SidebarCommandPalette from './SidebarCommandPalette.svelte';

	const { children: childrenSnippet, data } = $props();
	const runtimeThemePlayground = createRuntimeThemePlayground();
	// Restore the footer levers synchronously from the cookie the server read, so the very
	// first paint (SSR and hydration alike) already carries the chosen tokens — no flash.
	if (data.playground) runtimeThemePlayground.restore(data.playground);

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
	const docsPageShellTheme = {
		contentInner: {
			padding: { large: 'p-5 md:p-5' }
		}
	} satisfies PageShellThemeProps;
	// Previews and full-page templates render bare: they own their own chrome and token scope.
	// Only the template detail routes bypass the shell — `/templates` itself is a docs page.
	const isPreviewRoute = $derived(
		page.route.id?.startsWith('/previews/') || page.route.id?.startsWith('/templates/') || false
	);
	const activeDesignTokens = $derived(
		resolveRuntimeTokenPreset(page.url.searchParams.get('preset'))
	);
	// The footer playground popover drives the same state on every docs page: `designTokens`
	// writes the CSS variables, `motion` feeds `ThemeState.motion` (what Svelte transitions
	// resolve against). Only the fluid-scale demo pins its own preset from the URL.
	const designTokens = $derived(
		page.route.id === '/fluid-scale'
			? ({
					light: activeDesignTokens,
					dark: activeDesignTokens
				} satisfies ThemeDesignTokenMap<readonly ['light', 'dark']>)
			: runtimeThemePlayground.designTokens
	);
	const motionTokens = $derived(runtimeThemePlayground.motion);
	// Mirror every lever change into the cookie `+layout.server.ts` reads on the next request.
	$effect(() => {
		const snapshot = encodeURIComponent(JSON.stringify(runtimeThemePlayground.snapshot));
		document.cookie = `${PLAYGROUND_COOKIE}=${snapshot}; path=/; max-age=31536000; SameSite=Lax`;
	});
	// Palette overrides are emitted as a head <style> on `html` so they are part of the
	// server-rendered page and reach portaled overlays (dialogs, popovers, toasts). The
	// plugin's own colour rules live inside Tailwind's cascade layers, so this unlayered
	// rule wins without needing higher specificity.
	const paletteCss = $derived.by(() => {
		const variables = Object.entries(runtimeColorPaletteVariables(runtimeThemePlayground.palette));
		if (variables.length === 0) return '';
		return `html{${variables.map(([property, value]) => `${property}:${value}`).join(';')}}`;
	});
	let sidebarDisplayState = $state<SidebarDisplayState>('expanded');
	let sidebarVariant = $state<SidebarVariant>('inset');
	let sidebarCollapsedDisplayState = $state<Exclude<SidebarDisplayState, 'expanded'>>('hidden');
	let sidebarWidth = $state('16rem');
	let appShellRef = $state<HTMLElement | null>(null);
	const pageScrollPositions = new SvelteMap<string, number>();

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
		density: 'compact',
		size: 'small',
		widthMobile: '18rem',
		resizable: {
			minWidth: '12rem',
			maxWidth: '24rem',
			storageKey: 'entasis-docs-sidebar-width',
			onWidthChange: ({ width }) => {
				sidebarWidth = width;
			}
		},
		items: sidebarGroups,
		headerButton: {
			icon: commandIcon,
			title: 'Entasis',
			subtitle: page.url.pathname.startsWith('/blocks') ? 'Blocks' : 'Components'
		},
		footer: sidebarFooter
	});
</script>

{#snippet headerLink({ href, text }: AppNavigationLink)}
	{@const path = resolveLink(href)}
	{@const isActive = page.url.pathname === path || page.url.pathname.startsWith(`${path}/`)}
	<a
		href={path}
		class="state-layer text-neutral hover:text-neutral rounded-md px-2 py-1 text-sm font-medium transition-colors {isActive
			? 'bg-primary-muted text-primary-muted-readable'
			: ''}"
	>
		{text}
	</a>
{/snippet}

{#snippet shellFooter()}
	<div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
		<div class="flex min-w-0 flex-wrap items-center gap-1.5">
			<span class="text-neutral/70 mr-1 text-xs font-medium">Variant</span>
			<div class="flex flex-wrap items-center gap-1" role="group" aria-label="Sidebar variant">
				{#each sidebarVariants as variant, index (index)}
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
			<span class="text-neutral/70 mr-1 text-xs font-medium">State</span>
			<div class="flex flex-wrap items-center gap-1" role="group" aria-label="Sidebar state">
				{#each sidebarStates as state, index (index)}
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

		<div class="ml-auto">
			<PlaygroundPopover />
		</div>
	</div>
{/snippet}

{#snippet sidebarFooter(api: SidebarApi)}
	<SidebarCommandPalette
		groups={sidebarGroups}
		collapsed={api.collapsible === 'icon' && api.state === 'collapsed' && !api.isMobile}
	/>
{/snippet}
<svelte:head>
	{#if paletteCss}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- built from the fixed palette table, never from user input -->
		{@html `<s${'tyle'}>${paletteCss}</s${'tyle'}>`}
	{/if}
</svelte:head>

<Theme transition={themeTransition} {designTokens} motion={motionTokens}>
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
							{#each headerLinks as link, index (index)}
								{@render headerLink(link)}
							{/each}
						</nav>
					</div>
					<Button
						variant="outline"
						size="small"
						onclick={() => (theme.theme = theme.resolvedTheme === 'dark' ? 'light' : 'dark')}
					>
						<!-- Both labels are server-rendered; the dark variant picks one before hydration so
						     the button never flips text once the client resolves the theme. -->
						<span class="dark:hidden">Dark</span>
						<span class="hidden dark:inline">Light</span>
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
				{@render childrenSnippet()}
			</AppShell>
		{/if}
	{/snippet}
</Theme>
