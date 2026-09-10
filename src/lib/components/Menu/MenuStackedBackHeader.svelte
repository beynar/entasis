<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { Density } from '$lib/types/theme.js';
	import MenuOption from '../MenuOption/MenuOption.svelte';
	import { arrowLeftIcon } from '../Icons/arrowLeft.js';
	import type { MenuItem } from './menu.props.js';
	import type { MenuThemeProps } from './menu.theme.js';

	type SubmenuItem = Extract<MenuItem, { type: 'submenu' }>;

	let {
		opener,
		label,
		theme,
		density,
		onBack,
		itemReference,
		backReference
	}: {
		opener: SubmenuItem | null;
		label: string;
		theme?: MenuThemeProps;
		density?: Density;
		onBack: () => void;
		itemReference: Attachment<HTMLElement>;
		backReference: Attachment<HTMLElement>;
	} = $props();

	const size = $derived(opener?.size ?? 'normal');
	const resolvedDensity = $derived(opener?.density ?? density ?? 'normal');
	const openerTheme = $derived(theme?.submenu ?? theme?.option);
</script>

<MenuOption
	role="menuitem"
	prefix={arrowLeftIcon}
	color={opener?.color}
	{size}
	density={resolvedDensity}
	title={opener?.title ?? label}
	description={opener?.description}
	theme={openerTheme}
	attrs={{
		'aria-label': label,
		'data-menu-keep-open': 'true'
	}}
	onclick={onBack}
	{@attach itemReference}
	{@attach backReference}
/>
