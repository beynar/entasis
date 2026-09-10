<script lang="ts">
	import { sidebarMobileDrawerDialogTheme } from './sidebarMobileDrawer.dialog.theme.js';
	import type { Snippet } from 'svelte';
	import { Dialog } from '$lib/components/Dialog/index.js';
	import type { SidebarDensity, SidebarSide, SidebarSize } from './sidebar.props.js';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		open,
		close,
		side,
		widthMobile,
		dir,
		size,
		density,
		label,
		theme,
		children
	}: {
		open: boolean;
		close: () => void;
		side: SidebarSide;
		widthMobile: string;
		dir?: 'ltr' | 'rtl';
		size: SidebarSize;
		density: SidebarDensity;
		label: string;
		theme?: SidebarThemeProps;
		children: Snippet;
	} = $props();

	const classes = $derived(useSidebarTheme(theme));
	const dialogType = $derived(side === 'right' ? 'drawerRight' : 'drawerLeft');
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
	class="md:hidden"
	theme={sidebarMobileDrawerDialogTheme}
>
	<div
		data-slot="sidebar"
		data-sidebar="sidebar"
		data-mobile="true"
		data-side={side}
		data-size={size}
		data-density={density}
		style:--sidebar-width-mobile={widthMobile}
		{dir}
		class={classes.mobilePanel({ side, size, density })}
	>
		{@render children()}
	</div>
</Dialog>
