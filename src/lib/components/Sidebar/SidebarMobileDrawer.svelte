<script lang="ts">
	import { sidebarMobileDrawerDialogTheme } from './sidebarMobileDrawer.dialog.theme.js';
	import type { Snippet } from 'svelte';
	import { Dialog } from '$lib/components/Dialog/index.js';
	import type { SidebarDensity, SidebarSide, SidebarSize } from './sidebar.props.js';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';

	let {
		open,
		close,
		side,
		widthMobile,
		activityWidth,
		dir,
		size,
		iconSize,
		density,
		label,
		theme,
		rail,
		children
	}: {
		open: boolean;
		close: () => void;
		side: SidebarSide;
		widthMobile: string;
		/** The activity bar's width: the drawer is portaled, out of reach of the root's variable. */
		activityWidth?: string;
		dir?: 'ltr' | 'rtl';
		size: SidebarSize;
		iconSize?: SidebarSize;
		density: SidebarDensity;
		label: string;
		theme?: SidebarThemeProps;
		/** The activity bar, a column at the drawer's outer edge beside the panel. */
		rail?: Snippet;
		children: Snippet;
	} = $props();

	const classes = $derived(useSidebarTheme(theme));
	const resolvedColor = $derived(useDefaultColor());
	const dialogType = $derived(side === 'right' ? 'drawerRight' : 'drawerLeft');

	// Following a link in the panel takes the user to the page, so the drawer gets out of the way.
	// The activity bar sits outside the panel: its links switch sections and keep the drawer open.
	// A click that opens elsewhere (a modifier key, a new tab, a download) leaves it open. A
	// prevented click still closes it: a client-side router (SvelteKit's) prevents every link
	// click it navigates itself.
	function closeOnLink(event: MouseEvent) {
		if (event.button !== 0) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
		if (!(link instanceof HTMLAnchorElement)) return;
		if (link.target === '_blank' || link.hasAttribute('download')) return;
		close();
	}
</script>

<Dialog
	{open}
	onOpenChange={(nextOpen) => {
		if (!nextOpen) close();
	}}
	type={dialogType}
	responsive={false}
	thumb={false}
	title={label}
	inset="none"
	class="md:hidden"
	theme={sidebarMobileDrawerDialogTheme}
>
	<!-- Flush with the screen edge and full height; the rail sits on the outer edge. -->
	<div class="flex h-full min-h-0" style:--sidebar-width-activity={activityWidth}>
		{#if side === 'left'}{@render rail?.()}{/if}
		<div
			data-slot="sidebar"
			data-sidebar="sidebar"
			data-color={resolvedColor}
			data-mobile="true"
			data-side={side}
			data-size={size}
			data-density={density}
			style:--sidebar-width-mobile={widthMobile}
			{dir}
			class={classes.mobilePanel({ side, size, iconSize, density })}
			onclick={closeOnLink}
		>
			{@render children()}
		</div>
		{#if side === 'right'}{@render rail?.()}{/if}
	</div>
</Dialog>
