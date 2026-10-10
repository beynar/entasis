<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { ContextMenu } from '$lib/components/ContextMenu/index.js';
	import type { MenuItem } from '$lib/components/Menu/menu.props.js';
	import { densities } from '$lib/utils/tokens.js';
	import { copyIcon } from '$lib/components/Icons/copy.js';
	import { scissorsIcon } from '$lib/components/Icons/scissors.js';
	import { clipboardIcon } from '$lib/components/Icons/clipboard.js';
	import { pencilIcon } from '$lib/components/Icons/pencil.js';
	import { trashIcon } from '$lib/components/Icons/trash.js';
	import { shareIcon } from '$lib/components/Icons/share.js';
	import { downloadIcon } from '$lib/components/Icons/download.js';

	let lastAction = $state('nothing yet');

	const controls = createComponentControls([
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: densities
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);

	const basicItems: MenuItem[] = [
		{ type: 'option', prefix: copyIcon, title: 'Copy', onclick: () => (lastAction = 'Copy') },
		{ type: 'option', prefix: scissorsIcon, title: 'Cut', onclick: () => (lastAction = 'Cut') },
		{
			type: 'option',
			prefix: clipboardIcon,
			title: 'Paste',
			onclick: () => (lastAction = 'Paste')
		},
		{ type: 'separator' },
		{
			type: 'option',
			prefix: trashIcon,
			title: 'Delete',
			color: 'danger',
			onclick: () => (lastAction = 'Delete')
		}
	];

	const submenuItems: MenuItem[] = [
		{ type: 'option', prefix: pencilIcon, title: 'Rename' },
		{
			type: 'submenu',
			prefix: shareIcon,
			title: 'Share',
			menu: [
				{ type: 'option', title: 'Copy link', onclick: () => (lastAction = 'Copy link') },
				{ type: 'option', title: 'Email', onclick: () => (lastAction = 'Email') },
				{
					type: 'option',
					title: 'Export as PDF',
					prefix: downloadIcon,
					onclick: () => (lastAction = 'Export as PDF')
				}
			]
		},
		{ type: 'separator' },
		{ type: 'option', prefix: trashIcon, title: 'Delete', color: 'danger' }
	];
</script>

{#snippet target(label: string)}
	<div
		class="bg-surface-raised border-neutral-muted text-neutral/70 flex h-48 w-full cursor-context-menu items-center justify-center rounded-xl border text-sm select-none"
	>
		{label}
	</div>
{/snippet}

<DocPage
	title="Context menu"
	subtitle="A menu anchored at the cursor, opened on right-click."
	component="ContextMenu"
	features={[
		'Anchors at the pointer via a floating-ui virtual element',
		'Reuses Menu — options, separators, submenus',
		{
			label: 'Choosing a submenu item closes every level and restores focus',
			test: 'a11y:context-menu.item-closes-tree'
		},
		{ label: 'Full keyboard navigation and highlighting', test: 'a11y:menu.arrow-keys' },
		'Flips near viewport edges, closes on outside click / Esc'
	]}
>
	<ComponentCard
		{controls}
		description="Right-click the area to open a menu at the pointer."
		code={`<ContextMenu
	items={basicItems}
	menu={{ density: '${controls.value.density}' }}
	disabled={${controls.value.disabled}}
>
	<div>Right-click anywhere in this area</div>
</ContextMenu>`}
	>
		<div class="w-full">
			<ContextMenu
				items={basicItems}
				menu={{ density: controls.value.density }}
				disabled={controls.value.disabled}
			>
				{@render target('Right-click anywhere in this area')}
			</ContextMenu>
			<p class="text-neutral/70 mt-3 text-center text-xs">
				Last action: <span class="text-neutral font-medium">{lastAction}</span>
			</p>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Menu items with a nested submenu (Share). Choosing a Share item closes the submenu and the menu together."
		>
			<div class="w-full">
				<ContextMenu items={submenuItems} class="w-full">
					{@render target('Right-click for a menu with a submenu')}
				</ContextMenu>
				<p class="text-neutral/70 mt-3 text-center text-xs">
					Last action: <span class="text-neutral font-medium">{lastAction}</span>
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			description={"Placed relative to the pointer with popup.position: here above and before it (popup={{ position: 'top-end' }})."}
			code={`<ContextMenu items={items} popup={{ position: 'top-end' }}>
	<div>Right-click — the menu opens above the pointer</div>
</ContextMenu>`}
		>
			<ContextMenu items={basicItems} class="w-full" popup={{ position: 'top-end' }}>
				{@render target('Right-click — the menu opens above the pointer')}
			</ContextMenu>
		</ComponentCard>

		<ComponentCard description={'Flush at the cursor with no offset (popup={{ offset: 0 }}).'}>
			<ContextMenu items={basicItems} class="w-full" popup={{ offset: 0 }}>
				{@render target('Right-click — menu opens flush at the pointer')}
			</ContextMenu>
		</ComponentCard>

		<ComponentCard description="Disabled — right-click falls through to the native context menu.">
			<ContextMenu items={basicItems} class="w-full" disabled>
				{@render target('Right-click shows the native menu')}
			</ContextMenu>
		</ComponentCard>
	{/snippet}
</DocPage>
