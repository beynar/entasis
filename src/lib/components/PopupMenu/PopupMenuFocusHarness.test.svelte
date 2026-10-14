<script lang="ts">
	// A PopupMenu between two page controls, for the tests of how focus enters and leaves a menu.
	import I18n from '$lib/i18n/I18n.svelte';
	import Button from '../Button/Button.svelte';
	import Theme from '../Theme/Theme.svelte';
	import PopupMenu from './PopupMenu.svelte';
	import type { MenuItem } from '../Menu/menu.props.js';
	import type { PopupMenuProps } from './popupMenu.props.js';

	let {
		items = [],
		dir = 'ltr',
		menu = {},
		open = $bindable(false),
		snippetTrigger = false,
		...props
	}: {
		items?: MenuItem[];
		dir?: 'ltr' | 'rtl';
		menu?: Partial<PopupMenuProps['menu']>;
		open?: boolean;
		/** Render the trigger as a snippet instead of button props. */
		snippetTrigger?: boolean;
	} & Partial<Omit<PopupMenuProps, 'menu'>> = $props();
</script>

<I18n {dir} manageDocument={false}>
	<Theme>
		<input aria-label="Search" />
		<button type="button">Before</button>
		{#if snippetTrigger}
			<PopupMenu
				bind:open
				menu={{ items, ...menu }}
				transition={{ in: { duration: 0 }, out: { duration: 0 } }}
				{...props}
			>
				{#snippet trigger(popover)}
					<Button {@attach popover.reference} onclick={() => popover.toggle()}>File</Button>
				{/snippet}
			</PopupMenu>
		{:else}
			<PopupMenu
				bind:open
				trigger={{ content: 'File' }}
				menu={{ items, ...menu }}
				transition={{ in: { duration: 0 }, out: { duration: 0 } }}
				{...props}
			/>
		{/if}
		<button type="button" onclick={() => (open = false)}>Close from code</button>
		<button type="button">After</button>
	</Theme>
</I18n>
