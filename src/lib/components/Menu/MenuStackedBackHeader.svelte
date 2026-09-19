<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { Colors, Density, Sizes } from '$lib/types/theme.js';
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
		size = 'normal',
		color,
		onBack,
		itemReference,
		backReference
	}: {
		opener: SubmenuItem | null;
		label: string;
		theme?: MenuThemeProps;
		density?: Density;
		size?: Sizes;
		color?: Colors;
		onBack: () => void;
		itemReference: Attachment<HTMLElement>;
		backReference: Attachment<HTMLElement>;
	} = $props();

	// The opener's own axes win; otherwise the header follows the menu it belongs to.
	const resolvedSize = $derived(opener?.size ?? size);
	const resolvedColor = $derived(opener?.color ?? color);
	const resolvedDensity = $derived(opener?.density ?? density ?? 'normal');
	const openerTheme = $derived(theme?.submenu ?? theme?.option);
</script>

<MenuOption
	role="menuitem"
	prefix={arrowLeftIcon}
	color={resolvedColor}
	size={resolvedSize}
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
