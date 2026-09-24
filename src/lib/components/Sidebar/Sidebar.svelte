<script lang="ts">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { cx } from '$lib/utils/cva/index.js';
	import BeforeHydratation from '$lib/components/Utils/BeforeHydratation.svelte';
	import type {
		SidebarDisplayState,
		SidebarMenuButtonItem,
		SidebarMenuEntry,
		SidebarProps
	} from './sidebar.props.js';
	import SidebarActivityBar from './SidebarActivityBar.svelte';
	import SidebarDesktopShell from './SidebarDesktopShell.svelte';
	import SidebarMobileDrawer from './SidebarMobileDrawer.svelte';
	import SidebarPanel from './SidebarPanel.svelte';
	import { SidebarDisplayStateBridge } from './sidebar.display-state.svelte.js';
	import { createSidebarWidthPrehydrationScript } from './sidebar.resize.persistence.js';
	import { SidebarResizeState } from './sidebar.resize.svelte.js';
	import { SidebarStateController } from './sidebar.state.svelte.js';
	import { useSidebarTheme } from './sidebar.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	let {
		id: customId,
		ref = $bindable(),
		defaultOpen = true,
		open = $bindable(),
		onOpenChange,
		displayState = $bindable<SidebarDisplayState | undefined>(undefined),
		onDisplayStateChange,
		side = 'left',
		variant = 'admin',
		size = 'normal',
		iconSize,
		activeVariant = 'soft',
		density = 'normal',
		collapsible = 'offcanvas',
		mode = 'layout',
		frame = 'viewport',
		dir,
		width = $bindable('16rem'),
		widthIcon = '3rem',
		widthMobile = '18rem',
		resizable,
		keyboardShortcut = 'b',
		rail = false,
		edgeReveal = true,
		expandOnHover = false,
		activityBar,
		items,
		class: className,
		collapseIcon = 'chevron',
		tooltips = 'auto',
		headerButton,
		search,
		headerMenu,
		header,
		content,
		footerButton,
		footerMenu,
		footer,
		children,
		banner,
		theme,
		...attachments
	}: SidebarProps = $props();
	const openState = createBindableValue(
		() => open,
		(next) => {
			open = next;
		},
		() => defaultOpen
	);
	const generatedId = $props.id();
	const rootId = $derived(customId || `sidebar-${generatedId}`);
	const resizeOptions = $derived(typeof resizable === 'object' ? resizable : undefined);
	const widthPrehydrationScript = $derived.by(() => {
		const storageKey = resizeOptions?.storageKey;
		if (mode === 'panel' || !storageKey) return null;

		return createSidebarWidthPrehydrationScript({
			elementId: rootId,
			storageKey,
			minWidth: resizeOptions?.minWidth,
			maxWidth: resizeOptions?.maxWidth
		});
	});
	let edgeRevealed = $state(false);
	// The desktop shell drives this; the controller turns it into `api.isPeeking` so the panel
	// contents render expanded whenever the peek renders them at full width.
	let hoverExpanded = $state(false);
	const activityBarWidth = $derived(activityBar?.width ?? '3rem');
	// The column the rail reserves: the rail itself, plus the outer gutter when it floats as a card
	// of its own (floating, split). `0px` (not `0`) so the `calc()` in the spacer/container classes
	// stays valid without a unit.
	const activityBarOffset = $derived(
		!activityBar
			? '0px'
			: variant === 'floating' || variant === 'split'
				? `calc(${activityBarWidth} + var(--spacing) * 2)`
				: activityBarWidth
	);
	function setOpen(nextOpen: boolean) {
		openState.value = nextOpen;
	}
	function setWidth(nextWidth: string) {
		width = nextWidth;
	}
	const t = $derived(useI18n());
	// A second nav landmark needs its own name; `activityBar.label` overrides this default.
	const activityBarLabel = $derived(`${t.sidebar} ${t.actions}`);
	const navLabel = $derived(`${t.sidebar} ${t.navigation}`);
	const classes = $derived(useSidebarTheme(theme));
	const resolvedColor = $derived(useDefaultColor());
	const canCollapseToIcon = $derived.by(() => {
		if (content) return false;

		const menuEntries = [
			...(headerMenu ?? []),
			...(items?.flatMap((group) => group.items ?? []) ?? []),
			...(footerMenu ?? [])
		];

		return (
			menuEntries.every(hasIcon) &&
			hasCollapsibleMedia(headerButton) &&
			hasCollapsibleMedia(footerButton)
		);
	});
	const resolvedCollapsible = $derived(
		collapsible === 'icon' && !canCollapseToIcon ? 'offcanvas' : collapsible
	);
	const displayStateBridge = new SidebarDisplayStateBridge({
		get open() {
			return openState.value;
		},
		get displayState() {
			return displayState;
		},
		get collapsible() {
			return resolvedCollapsible;
		},
		setOpen,
		get onOpenChange() {
			return onOpenChange;
		},
		setDisplayStateProp: (nextDisplayState) => {
			displayState = nextDisplayState;
		},
		get onDisplayStateChange() {
			return onDisplayStateChange;
		}
	});
	const controller = new SidebarStateController({
		get mode() {
			return mode;
		},
		get keyboardShortcut() {
			return keyboardShortcut;
		},
		get displayState() {
			return displayStateBridge.displayState;
		},
		get side() {
			return side;
		},
		get collapsible() {
			return resolvedCollapsible;
		},
		get peeking() {
			return hoverExpanded;
		},
		setDisplayState: displayStateBridge.setDisplayState
	});
	const resize = new SidebarResizeState({
		get width() {
			return width;
		},
		get resizable() {
			return resizable;
		},
		get side() {
			return side;
		},
		get displayState() {
			return controller.displayState;
		},
		get edgeRevealed() {
			return edgeRevealed;
		},
		get collapsible() {
			return resolvedCollapsible;
		},
		setWidth,
		setDisplayState: displayStateBridge.setDisplayState
	});
	const api = controller.api;
	const collapsibleState = $derived(controller.collapsibleState);
	const panelWidth = $derived(
		mode === 'panel' && controller.displayState === 'collapsed' ? widthIcon : width
	);
	const withBanner = $derived(!!banner);
	const rootClass = $derived(
		classes.root({
			variant,
			className: [
				frame === 'viewport' ? 'h-window min-h-0' : 'relative h-full min-h-0 rounded-[inherit]',
				withBanner && 'flex-col',
				className
			]
		})
	);
	const rowClass = $derived(cx('flex w-full flex-1 min-h-0', !withBanner && 'contents'));
	$effect(() => {
		if (!controller.isMobile) {
			controller.setOpenMobile(false);
		}
	});
	$effect(() => {
		if (resolvedCollapsible !== 'offcanvas' || displayState !== 'collapsed') return;
		displayStateBridge.setDisplayState('hidden');
	});

	function hasIcon(entry: SidebarMenuEntry) {
		return entry.icon != null;
	}

	function hasCollapsibleMedia(button: SidebarMenuButtonItem | undefined) {
		return !button || button.icon != null || button.avatar != null;
	}
</script>

{#if widthPrehydrationScript}
	<BeforeHydratation immediate once scripts={[widthPrehydrationScript]} />
{/if}

{#snippet panel()}
	<SidebarPanel
		{api}
		{items}
		{headerButton}
		{search}
		{headerMenu}
		{header}
		{content}
		{footerButton}
		{footerMenu}
		{footer}
		{collapseIcon}
		{tooltips}
		{size}
		{activeVariant}
		{density}
		label={navLabel}
		{theme}
	/>
{/snippet}
{#snippet staticActivityBar()}
	{#if activityBar}
		<SidebarActivityBar
			{activityBar}
			{side}
			{size}
			{density}
			{variant}
			placement="static"
			label={activityBarLabel}
			{theme}
		/>
	{/if}
{/snippet}
{#if mode === 'panel'}
	<div
		id={rootId}
		bind:this={ref}
		data-slot="sidebar"
		data-sidebar="sidebar"
		data-color={resolvedColor}
		data-state={controller.state}
		data-display-state={controller.displayState}
		data-collapsible={collapsibleState}
		data-icon-collapse-available={canCollapseToIcon}
		data-variant={variant}
		data-side={side}
		data-size={size}
		data-density={density}
		style:--sidebar-width={panelWidth}
		style:--sidebar-width-icon={widthIcon}
		style:--sidebar-width-mobile={widthMobile}
		class={cx(
			'group',
			classes.panel({ variant, placement: 'panel', size, iconSize, density, className })
		)}
		{...attachments}
	>
		{@render panel()}
	</div>
{:else}
	<div
		id={rootId}
		bind:this={ref}
		data-slot="sidebar-wrapper"
		data-state={controller.state}
		data-display-state={controller.displayState}
		data-collapsible={collapsibleState}
		data-icon-collapse-available={canCollapseToIcon}
		data-variant={variant}
		data-side={side}
		data-frame={frame}
		data-size={size}
		data-density={density}
		data-activity-bar={activityBar ? 'true' : undefined}
		data-width-prehydrating={resize.isWidthInitializing ? 'true' : undefined}
		style:--sidebar-width={resize.renderWidth}
		style:--sidebar-width-icon={widthIcon}
		style:--sidebar-width-activity={activityBarWidth}
		style:--sidebar-activity-offset={activityBarOffset}
		style:--sidebar-width-mobile={widthMobile}
		class={rootClass}
		{...attachments}
	>
		{#if banner}{@render banner(api)}{/if}
		<div class={rowClass}>
			{#if controller.isMobile}
				<SidebarMobileDrawer
					open={controller.openMobile}
					close={() => controller.setOpenMobile(false)}
					{side}
					{widthMobile}
					{dir}
					{size}
					{iconSize}
					{density}
					label={navLabel}
					{theme}
				>
					{#if activityBar}
						<SidebarActivityBar
							{activityBar}
							{side}
							{size}
							{density}
							orientation="horizontal"
							label={activityBarLabel}
							{theme}
						/>
					{/if}
					{@render panel()}
				</SidebarMobileDrawer>
			{:else if resolvedCollapsible === 'none'}
				{#if activityBar && side === 'left'}
					{@render staticActivityBar()}
				{/if}
				<div
					data-slot="sidebar"
					data-sidebar="sidebar"
					data-color={resolvedColor}
					data-side={side}
					class={classes.panel({ variant, placement: 'static', size, iconSize, density })}
				>
					{@render panel()}
				</div>
				{#if activityBar && side === 'right'}
					{@render staticActivityBar()}
				{/if}
			{:else}
				<SidebarDesktopShell
					sidebarState={controller.state}
					displayState={controller.displayState}
					{collapsibleState}
					{variant}
					{side}
					{frame}
					{size}
					{iconSize}
					{density}
					{rail}
					{edgeReveal}
					{expandOnHover}
					{activityBar}
					{activityBarLabel}
					toggleLabel={`${t.toggle} ${t.sidebar}`}
					resizeLabel={`${t.resize} ${t.sidebar}`}
					collapsedResizeLabel={`${t.expand} ${t.sidebar}`}
					openLabel={`${t.open} ${t.sidebar}`}
					toggle={controller.toggle}
					open={() => controller.setDisplayState('expanded')}
					{resize}
					{theme}
					bind:edgeRevealed
					bind:hoverExpanded
				>
					{@render panel()}
				</SidebarDesktopShell>
			{/if}
			<main
				data-slot="sidebar-main"
				inert={controller.isMobile && controller.openMobile ? true : undefined}
				class={classes.main({
					variant,
					side,
					displayState: controller.displayState,
					edgeRevealed
				})}
			>
				{@render children?.(api)}
			</main>
		</div>
	</div>
{/if}
