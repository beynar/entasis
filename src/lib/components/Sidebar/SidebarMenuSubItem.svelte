<script lang="ts">
	import type {
		SidebarActiveVariant,
		SidebarDensity,
		SidebarMenuSubEntry,
		SidebarSize
	} from './sidebar.props.js';
	import SidebarIcon from './SidebarIcon.svelte';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		sub,
		size,
		activeVariant,
		density,
		theme
	}: {
		sub: SidebarMenuSubEntry;
		size: SidebarSize;
		activeVariant: SidebarActiveVariant;
		density: SidebarDensity;
		theme?: SidebarThemeProps;
	} = $props();

	const classes = $derived(useSidebarTheme(theme));
	const subSize = $derived(sub.size ?? size);

	function handleClick(event: MouseEvent) {
		if (sub.disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		sub.onclick?.(event);
	}
</script>

<li
	data-slot="sidebar-menu-sub-item"
	data-sidebar="menu-sub-item"
	class="group/menu-sub-item relative"
>
	{#if sub.href}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- Package consumers supply URLs; library links cannot depend on SvelteKit routing. -->
		<a
			href={sub.disabled ? undefined : sub.href}
			role={sub.disabled ? 'link' : undefined}
			data-slot="sidebar-menu-sub-button"
			data-sidebar="menu-sub-button"
			data-size={subSize}
			data-active={sub.isActive ? 'true' : undefined}
			data-active-variant={activeVariant}
			aria-current={sub.isActive ? 'page' : undefined}
			aria-disabled={sub.disabled || undefined}
			tabindex={sub.disabled ? -1 : undefined}
			class={classes.subButton({ size: subSize, itemSize: sub.size, activeVariant, density })}
			onclick={handleClick}
		>
			<SidebarIcon icon={sub.icon} />
			<span>{sub.label}</span>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else}
		<button
			type="button"
			data-slot="sidebar-menu-sub-button"
			data-sidebar="menu-sub-button"
			data-size={subSize}
			data-active={sub.isActive ? 'true' : undefined}
			data-active-variant={activeVariant}
			disabled={sub.disabled || undefined}
			class={classes.subButton({ size: subSize, itemSize: sub.size, activeVariant, density })}
			onclick={handleClick}
		>
			<SidebarIcon icon={sub.icon} />
			<span>{sub.label}</span>
		</button>
	{/if}
</li>
