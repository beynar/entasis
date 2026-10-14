<script lang="ts">
	// A PopupMenu between two page controls, for the tests of how focus enters and leaves a menu.
	import I18n from '$lib/i18n/I18n.svelte';
	import Theme from '../Theme/Theme.svelte';
	import PopupMenu from './PopupMenu.svelte';
	import type { MenuItem } from '../Menu/menu.props.js';
	import type { PopupMenuProps } from './popupMenu.props.js';

	let {
		items = [],
		dir = 'ltr',
		menu = {},
		...props
	}: {
		items?: MenuItem[];
		dir?: 'ltr' | 'rtl';
		menu?: Partial<PopupMenuProps['menu']>;
	} & Partial<Omit<PopupMenuProps, 'menu'>> = $props();
</script>

<I18n {dir} manageDocument={false}>
	<Theme>
		<input aria-label="Search" />
		<button type="button">Before</button>
		<PopupMenu
			trigger={{ content: 'File' }}
			menu={{ items, ...menu }}
			transition={{ in: { duration: 0 }, out: { duration: 0 } }}
			{...props}
		/>
		<button type="button">After</button>
	</Theme>
</I18n>
