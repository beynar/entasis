<script lang="ts">
	import type { SidebarDensity, SidebarMenuSubEntry, SidebarSize } from './sidebar.props.js';
	import SidebarIcon from './SidebarIcon.svelte';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	let {
		sub,
		size,
		density,
		theme
	}: {
		sub: SidebarMenuSubEntry;
		size: SidebarSize;
		density: SidebarDensity;
		theme?: SidebarThemeProps;
	} = $props();

	const classes = $derived(useSidebarTheme(theme));
	const componentSize = $derived(sub.size ?? size);
	const textSize = $derived(sub.size === 'small' ? 'sm' : 'md');

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
			data-size={componentSize}
			data-active={sub.isActive ? 'true' : undefined}
			aria-current={sub.isActive ? 'page' : undefined}
			aria-disabled={sub.disabled || undefined}
			tabindex={sub.disabled ? -1 : undefined}
			class={classes.subButton({ componentSize, density, size: textSize })}
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
			data-size={componentSize}
			data-active={sub.isActive ? 'true' : undefined}
			disabled={sub.disabled || undefined}
			class={classes.subButton({ componentSize, density, size: textSize })}
			onclick={handleClick}
		>
			<SidebarIcon icon={sub.icon} />
			<span>{sub.label}</span>
		</button>
	{/if}
</li>
