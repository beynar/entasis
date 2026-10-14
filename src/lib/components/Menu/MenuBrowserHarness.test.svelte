<script lang="ts">
	// Harness for `menu.browser.test.ts`: menus between two page controls, in LTR or RTL, a
	// MenuBar, a ContextMenu and a ToggleMenu squeezed into a narrow box.
	import I18n from '$lib/i18n/I18n.svelte';
	import Theme from '../Theme/Theme.svelte';
	import ContextMenu from '../ContextMenu/ContextMenu.svelte';
	import MenuBar from '../MenuBar/MenuBar.svelte';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import ToggleMenu from '../ToggleMenu/ToggleMenu.svelte';
	import type { ToggleMenuItem } from '../ToggleMenu/toggleMenu.props.js';
	import type { MenuItem } from './menu.props.js';

	let {
		scenario,
		dir = 'ltr'
	}: {
		scenario: 'popup' | 'menubar' | 'filter' | 'context' | 'toolbar';
		dir?: 'ltr' | 'rtl';
	} = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
	const items: MenuItem[] = [
		{ type: 'option', title: 'New file' },
		{ type: 'option', title: 'Open' },
		{
			type: 'submenu',
			title: 'Share',
			menu: [
				{ type: 'option', title: 'Email' },
				{ type: 'option', title: 'Link' }
			]
		},
		{ type: 'option', title: 'Quit' }
	];
	let toolbar = $state<ToggleMenuItem[]>([
		{ type: 'toggle', label: 'Bold', children: 'Bold', value: false },
		{ type: 'toggle', label: 'Italic', children: 'Italic', value: true },
		{
			type: 'radio-group',
			label: 'Align',
			value: 'left',
			items: [
				{ value: 'left', label: 'Left', children: 'Left' },
				{ value: 'right', label: 'Right', children: 'Right' }
			]
		}
	]);
</script>

<I18n {dir} manageDocument={false}>
	<Theme>
		<div {dir} class="p-4">
			<button type="button">Before</button>
			{#if scenario === 'popup'}
				<PopupMenu
					trigger={{ content: 'File' }}
					menu={{ items }}
					position="bottom-start"
					transition={zero}
				/>
			{:else if scenario === 'filter'}
				<PopupMenu
					trigger={{ content: 'Actions' }}
					menu={{ items, filter: true }}
					transition={zero}
				/>
			{:else if scenario === 'menubar'}
				<MenuBar
					menus={[
						{ label: 'File', items },
						{ label: 'Edit', items: [{ type: 'option', title: 'Undo' }] }
					]}
				/>
			{:else if scenario === 'context'}
				<ContextMenu {items} popup={{ transition: zero }}>
					<div data-testid="target" class="h-32 w-64 border">Right-click here</div>
				</ContextMenu>
			{:else}
				<div style="width: 60px">
					<ToggleMenu bind:items={toolbar} label="Format" />
				</div>
				<output data-testid="state"
					>{toolbar
						.map((item) =>
							item.type === 'toggle'
								? `${item.label}:${item.value}`
								: item.type === 'radio-group'
									? `${item.label}:${item.value}`
									: ''
						)
						.join(',')}</output
				>
			{/if}
			<button type="button">After</button>
		</div>
	</Theme>
</I18n>
