<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { MenuBar, type MenuBarMenu } from '$lib/components/MenuBar/index.js';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import { sizes } from '$lib/utils/tokens.js';
	import { bellIcon } from '$lib/components/Icons/bell.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { lockIcon } from '$lib/components/Icons/lock.js';
	import { questionIcon } from '$lib/components/Icons/question.js';
	import { signOutIcon } from '$lib/components/Icons/signOut.js';
	import { trashIcon } from '$lib/components/Icons/trash.js';
	import { userIcon } from '$lib/components/Icons/user.js';

	let lastAction = $state('Ready');

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		}
	]);

	const applicationMenus: MenuBarMenu[] = [
		{
			label: 'File',
			items: [
				{
					type: 'option',
					title: 'New document',
					suffix: 'Ctrl+N',
					onclick: () => (lastAction = 'New document')
				},
				{
					type: 'option',
					title: 'Open...',
					suffix: 'Ctrl+O',
					onclick: () => (lastAction = 'Open')
				},
				{ type: 'separator' },
				{ type: 'option', title: 'Save', suffix: 'Ctrl+S', onclick: () => (lastAction = 'Saved') },
				{
					type: 'submenu',
					title: 'Export',
					menu: [
						{ type: 'option', title: 'PDF document', onclick: () => (lastAction = 'Exported PDF') },
						{
							type: 'option',
							title: 'Markdown',
							onclick: () => (lastAction = 'Exported Markdown')
						},
						{ type: 'option', title: 'Plain text', onclick: () => (lastAction = 'Exported text') }
					]
				},
				{ type: 'separator' },
				{ type: 'option', title: 'Move to trash', prefix: trashIcon, color: 'danger' }
			]
		},
		{
			label: 'Edit',
			items: [
				{ type: 'option', title: 'Undo', suffix: 'Ctrl+Z', onclick: () => (lastAction = 'Undo') },
				{
					type: 'option',
					title: 'Redo',
					suffix: 'Ctrl+Shift+Z',
					onclick: () => (lastAction = 'Redo')
				},
				{ type: 'separator' },
				{ type: 'option', title: 'Cut', suffix: 'Ctrl+X' },
				{ type: 'option', title: 'Copy', suffix: 'Ctrl+C' },
				{ type: 'option', title: 'Paste', suffix: 'Ctrl+V' }
			]
		},
		{
			label: 'View',
			items: [
				{ type: 'option', title: 'Command palette', suffix: 'Ctrl+K' },
				{ type: 'separator' },
				{ type: 'option', title: 'Zoom in' },
				{ type: 'option', title: 'Zoom out' },
				{ type: 'option', title: 'Reset zoom' }
			]
		},
		{
			label: 'Help',
			items: [
				{ type: 'option', title: 'Documentation', prefix: questionIcon },
				{ type: 'option', title: 'Keyboard shortcuts' },
				{ type: 'separator' },
				{ type: 'option', title: 'About Svelai' }
			]
		}
	];

	const workspaceMenus: MenuBarMenu[] = [
		{
			label: 'Workspace',
			prefix: houseIcon,
			items: [
				{ type: 'option', title: 'Overview', prefix: houseIcon },
				{ type: 'option', title: 'Members', prefix: userIcon },
				{ type: 'option', title: 'Notifications', prefix: bellIcon }
			]
		},
		{
			label: 'Settings',
			prefix: gearIcon,
			items: [
				{ type: 'option', title: 'General', prefix: gearIcon },
				{ type: 'option', title: 'Security', prefix: lockIcon },
				{ type: 'separator' },
				{ type: 'option', title: 'Sign out', prefix: signOutIcon, color: 'danger' }
			]
		},
		{ label: 'Admin', disabled: true, items: [] }
	];

	const sizeMenus: MenuBarMenu[] = [
		{ label: 'File', items: [{ type: 'option', title: 'New file' }] },
		{ label: 'Edit', items: [{ type: 'option', title: 'Undo' }] },
		{ label: 'View', items: [{ type: 'option', title: 'Zoom' }] }
	];

	const usageCode = $derived(`<script lang="ts">
	import { MenuBar, type MenuBarMenu } from 'svelai/menu-bar';

	const menus: MenuBarMenu[] = [
		{
			label: 'File',
			items: [
				{ type: 'option', title: 'New document', suffix: 'Ctrl+N' },
				{ type: 'option', title: 'Open...', suffix: 'Ctrl+O' },
				{ type: 'separator' },
				{
					type: 'submenu',
					title: 'Export',
					menu: [
						{ type: 'option', title: 'PDF document' },
						{ type: 'option', title: 'Markdown' }
					]
				}
			]
		},
		{
			label: 'Edit',
			items: [
				{ type: 'option', title: 'Undo', suffix: 'Ctrl+Z' },
				{ type: 'option', title: 'Redo', suffix: 'Ctrl+Shift+Z' }
			]
		}
	];
<\/script>

<MenuBar {menus} size="${controls.value.size}" />`;
</script>

<DocPage
	title="Menu bar"
	subtitle="A horizontal application menu with continuous pointer and keyboard navigation."
	component="MenuBar"
	features={[
		'Composes PopupMenu and Menu',
		'Roving horizontal keyboard focus',
		'Hover and focus switch an open menu',
		'Nested submenu navigation is preserved',
		'RTL and disabled-menu support'
	]}
>
	<ComponentCard
		{controls}
		title="Application menu"
		description="Open one menu, then move across the bar with the pointer or Left and Right arrow keys."
		class="min-h-[460px] items-start"
		code={usageCode}
	>
		<div
			class="border-neutral-muted bg-surface w-full max-w-3xl overflow-hidden rounded-lg border shadow-sm"
		>
			<header class="border-neutral-muted flex items-center justify-between border-b px-3 py-2">
				<MenuBar menus={applicationMenus} size={controls.value.size} />
				<span class="text-neutral/60 hidden text-xs sm:block">{lastAction}</span>
			</header>
			<div class="min-h-64 px-8 py-10 sm:px-12">
				<p class="text-neutral/60 text-xs font-medium uppercase">Untitled document</p>
				<h2 class="text-neutral mt-4 text-2xl font-semibold">A quieter place to think.</h2>
				<p class="text-neutral/60 mt-3 max-w-lg text-sm leading-6">
					The menu bar remains idle until one menu opens. After that, adjacent menus follow pointer
					and keyboard focus without another click.
				</p>
			</div>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Icons and disabled menus"
			description="Labels can include prefix and suffix content; disabled root menus are skipped by navigation."
			code={`<MenuBar
	menus={[
		{ label: 'Workspace', prefix: houseIcon, items: workspaceItems },
		{ label: 'Settings', prefix: gearIcon, items: settingsItems },
		{ label: 'Admin', disabled: true, items: [] }
	]}
/>`}
		>
			<MenuBar menus={workspaceMenus} />
		</ComponentCard>

		<ComponentCard title="Sizes" description="The size prop is shared by every trigger in the bar.">
			<div class="flex flex-col items-start gap-6">
				<MenuBar menus={sizeMenus} size="small" />
				<MenuBar menus={sizeMenus} size="normal" />
				<MenuBar menus={sizeMenus} size="large" />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
