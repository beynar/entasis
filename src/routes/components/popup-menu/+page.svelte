<script lang="ts">
	import { tick } from 'svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { PopupMenu, type MenuItem } from '$lib/components/PopupMenu/index.js';
	import { sizes } from '$lib/utils/tokens.js';
	import { userIcon } from '$lib/components/Icons/user.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { signOutIcon } from '$lib/components/Icons/signOut.js';
	import { questionIcon } from '$lib/components/Icons/question.js';
	import { checkIcon } from '$lib/components/Icons/check.js';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import { trashIcon } from '$lib/components/Icons/trash.js';
	import { bellIcon } from '$lib/components/Icons/bell.js';
	import { lockIcon } from '$lib/components/Icons/lock.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { dotsThreeVerticalIcon } from '$lib/components/Icons/dotsThreeVertical.js';

	let clickCount = $state(0);
	let externalMenuOpen = $state(false);
	let contextMenuOpen = $state(false);
	// A floating-ui virtual element: a zero-size rect at the cursor, so the menu anchors to the pointer.
	let contextMenuRef = $state<{ getBoundingClientRect: () => DOMRect } | null>(null);

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: sizes
		}
	]);

	// Basic menu items
	const basicItems: MenuItem[] = [
		{ type: 'option', title: 'New File' },
		{ type: 'option', title: 'Open...' },
		{ type: 'option', title: 'Save' },
		{ type: 'separator' },
		{ type: 'option', title: 'Exit' },
		{
			type: 'submenu',
			title: 'Submenu',
			menu: [
				{ type: 'option', title: 'New File' },
				{ type: 'option', title: 'Open...' },
				{ type: 'option', title: 'Save' },
				{ type: 'separator' },
				{ type: 'option', title: 'Exit' }
			]
		}
	];

	// User profile menu
	const profileItems: MenuItem[] = [
		{
			type: 'option',
			prefix: userIcon,
			title: 'John Doe',
			description: 'john.doe@example.com'
		},
		{ type: 'separator' },
		{ type: 'option', prefix: houseIcon, title: 'Dashboard' },
		{ type: 'option', prefix: userIcon, title: 'Profile' },
		{ type: 'option', prefix: gearIcon, title: 'Settings' },
		{
			type: 'submenu',
			prefix: bellIcon,
			title: 'Notifications',
			suffix: caretRightIcon,
			menu: [
				{ type: 'option', title: 'Email Notifications' },
				{ type: 'option', title: 'Push Notifications' },
				{ type: 'separator' },
				{ type: 'option', title: 'Notification Settings' }
			]
		},
		{ type: 'separator' },
		{ type: 'option', prefix: questionIcon, title: 'Help & Support' },
		{ type: 'separator' },
		{ type: 'option', prefix: signOutIcon, title: 'Log Out', color: 'danger' }
	];

	// Actions menu with buttons
	const actionItems: MenuItem[] = [
		{
			type: 'button',
			children: 'Save Draft',
			variant: 'ghost',
			fullWidth: true,
			onclick: () => alert('Saved as draft')
		},
		{
			type: 'button',
			children: 'Publish',
			variant: 'solid',
			color: 'primary',
			fullWidth: true,
			onclick: () => alert('Published!')
		},
		{ type: 'separator' },
		{
			type: 'button',
			children: 'Delete',
			variant: 'soft',
			color: 'danger',
			fullWidth: true,
			onclick: () => alert('Deleted')
		}
	];

	// Context menu items
	const contextItems: MenuItem[] = [
		{ type: 'option', title: 'Open', onclick: () => alert('Open') },
		{ type: 'option', title: 'Open in New Tab', onclick: () => alert('Open in new tab') },
		{ type: 'separator' },
		{ type: 'option', title: 'Copy Link', onclick: () => alert('Link copied') },
		{ type: 'option', title: 'Share', suffix: caretRightIcon },
		{ type: 'separator' },
		{ type: 'option', prefix: trashIcon, title: 'Delete', color: 'danger' }
	];

	// Interactive items
	const interactiveItems: MenuItem[] = $derived([
		{
			type: 'option',
			title: `Clicked ${clickCount} times`,
			onclick: () => clickCount++
		},
		{ type: 'separator' },
		{
			type: 'button',
			children: 'Reset Counter',
			variant: 'ghost',
			fullWidth: true,
			onclick: () => (clickCount = 0)
		}
	]);

	// Edit menu
	const editItems: MenuItem[] = [
		{ type: 'option', title: 'Undo' },
		{ type: 'option', title: 'Redo' },
		{ type: 'separator' },
		{ type: 'option', title: 'Cut' },
		{ type: 'option', title: 'Copy' },
		{ type: 'option', title: 'Paste' }
	];

	// View menu
	const viewItems: MenuItem[] = [
		{ type: 'option', title: 'Zoom In' },
		{ type: 'option', title: 'Zoom Out' },
		{ type: 'option', title: 'Reset Zoom' },
		{ type: 'separator' },
		{ type: 'option', title: 'Full Screen' }
	];

	// Settings menu with colors
	const settingsItems: MenuItem[] = [
		{ type: 'option', title: 'Account', color: 'primary', prefix: checkIcon },
		{ type: 'option', title: 'Privacy', color: 'success', prefix: lockIcon },
		{ type: 'option', title: 'Notifications', color: 'info', prefix: bellIcon },
		{ type: 'separator' },
		{ type: 'option', title: 'Delete Account', color: 'danger', prefix: trashIcon }
	];

	const debugSafeAreaItems: MenuItem[] = [
		{ type: 'option', title: 'Option 1' },
		{
			type: 'submenu',
			title: 'Debug hover',
			openOnHover: true,
			openOnClick: false,
			debugSafeArea: true,
			menu: [
				{ type: 'option', title: 'Sub 1' },
				{ type: 'option', title: 'Sub 2' }
			]
		},
		{ type: 'option', title: 'Option 2' }
	];

	async function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		const x = e.clientX;
		const y = e.clientY;
		// Close first (if already open) so a second right-click re-mounts and repositions.
		contextMenuOpen = false;
		await tick();
		// Anchor to the cursor via a virtual element instead of the container.
		contextMenuRef = { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) };
		contextMenuOpen = true;
	}
</script>

<DocPage
	title="Popup menu"
	subtitle="A contextual menu that floats near its trigger."
	component="PopupMenu"
	features={[
		'Popover + Menu composition',
		'Bindable open for external control',
		'Hover or click open, escape dismiss',
		'Mobile-sheet submenus stack automatically',
		'Closes on item click by default',
		'Context menu via external ref'
	]}
>
	<ComponentCard
		{controls}
		description="A basic dropdown menu anchored to a trigger button."
		code={`<PopupMenu
	trigger={{ content: 'File', variant: 'outline' }}
	position="bottom-start"
	size="${controls.value.size}"
	menu={{
		density: '${controls.value.density}',
		items: [
			{ type: 'option', title: 'New File' },
			{ type: 'option', title: 'Open...' },
			{ type: 'option', title: 'Save' },
			{ type: 'separator' },
			{ type: 'option', title: 'Exit' },
			{
				type: 'submenu',
				title: 'Submenu',
				menu: [
					{ type: 'option', title: 'New File' },
					{ type: 'option', title: 'Open...' },
					{ type: 'option', title: 'Save' },
					{ type: 'separator' },
					{ type: 'option', title: 'Exit' }
				]
			}
		]
	}}
/>`}
	>
		<PopupMenu
			trigger={{ content: 'File', variant: 'outline' }}
			position="bottom-start"
			size={controls.value.size}
			menu={{ items: basicItems, density: controls.value.density }}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="File, edit, and view dropdown menus.">
			<div class="flex gap-4">
				<PopupMenu
					trigger={{ content: 'File', variant: 'outline' }}
					position="bottom-start"
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Edit', variant: 'outline' }}
					position="bottom-start"
					menu={{ items: editItems }}
				/>

				<PopupMenu
					trigger={{ content: 'View', variant: 'outline' }}
					position="bottom-start"
					menu={{ items: viewItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="User profile menu with icons, descriptions, and nested notifications."
		>
			<div class="flex gap-4">
				<PopupMenu
					trigger={{ content: 'John Doe', variant: 'outline', prefix: userIcon }}
					position="bottom-end"
					menu={{ items: profileItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Mobile-sheet popup menus automatically switch nested submenus to stacked views."
		>
			<div class="flex gap-4">
				<PopupMenu
					trigger={{ content: 'Mobile settings', variant: 'outline', prefix: gearIcon }}
					position="bottom-end"
					mobileSheet
					menu={{ items: profileItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Menu items rendered as full-width action buttons.">
			<div class="flex gap-4">
				<PopupMenu
					trigger={{ content: 'Actions', color: 'primary' }}
					position="bottom"
					menu={{ items: actionItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Menus anchored on every side and alignment variant.">
			<div class="flex flex-wrap gap-4">
				<PopupMenu
					trigger={{ content: 'Top', variant: 'soft' }}
					position="top"
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Bottom', variant: 'soft' }}
					position="bottom"
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Left', variant: 'soft' }}
					position="left"
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Right', variant: 'soft' }}
					position="right"
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Top Start', variant: 'soft' }}
					position="top-start"
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Bottom End', variant: 'soft' }}
					position="bottom-end"
					menu={{ items: basicItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Menu items that update state on each click.">
			<div class="flex gap-4">
				<PopupMenu
					trigger={{ content: 'Counter Menu', variant: 'outline', color: 'secondary' }}
					position="bottom-start"
					menu={{ items: interactiveItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Opens on hover instead of click.">
			<div class="flex gap-4">
				<PopupMenu
					trigger={{ content: 'Hover Me', variant: 'ghost' }}
					openOnHover={true}
					openOnClick={false}
					hoverDelay={200}
					closeOnMouseLeave={true}
					menu={{ items: settingsItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Debug submenu hover safe areas: blue rectangles show pointer tolerance, orange shows the prediction cone."
		>
			<div class="flex gap-4">
				<PopupMenu
					trigger={{ content: 'Debug Safe Area', variant: 'outline' }}
					position="bottom-start"
					menu={{ items: debugSafeAreaItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="The first menu closes when you click an item. The second stays open for multiple interactions."
		>
			<div class="flex gap-4">
				<PopupMenu
					trigger={{ content: 'Closes on Click (default)', variant: 'outline' }}
					position="bottom-start"
					closeOnItemClick={true}
					menu={{ items: interactiveItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Stays Open', variant: 'outline', color: 'secondary' }}
					position="bottom-start"
					closeOnItemClick={false}
					menu={{ items: interactiveItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Open and observe menu state from outside the trigger.">
			<div class="flex gap-4">
				<button
					class="border-neutral rounded border px-4 py-2"
					onclick={() => (externalMenuOpen = true)}
				>
					Open Menu Externally
				</button>

				<PopupMenu
					trigger={{ content: 'Controlled Menu', variant: 'outline' }}
					bind:open={externalMenuOpen}
					position="bottom-start"
					menu={{ items: basicItems }}
				/>

				<span class="text-neutral/70 self-center text-sm">
					Menu is {externalMenuOpen ? 'open' : 'closed'}
				</span>
			</div>
		</ComponentCard>

		<ComponentCard description="Context menu opened at the pointer on right-click.">
			<div
				role="region"
				aria-label="Context menu demo area"
				class="bg-surface-raised rounded-xl border-neutral-muted flex h-48 w-full cursor-context-menu items-center justify-center border"
				oncontextmenu={handleContextMenu}
			>
				<p class="text-neutral/70">Right-click anywhere in this area</p>
			</div>

			<PopupMenu
				trigger={false}
				bind:open={contextMenuOpen}
				ref={contextMenuRef}
				position="bottom-start"
				menu={{ items: contextItems }}
			/>
		</ComponentCard>

		<ComponentCard description="Icon-only trigger buttons for compact menus.">
			<div class="flex gap-4">
				<PopupMenu
					trigger={{ prefix: dotsThreeVerticalIcon, variant: 'ghost', squared: true }}
					position="bottom-end"
					menu={{ items: actionItems }}
				/>

				<PopupMenu
					trigger={{ prefix: gearIcon, variant: 'outline', squared: true }}
					position="bottom-end"
					menu={{ items: settingsItems }}
				/>

				<PopupMenu
					trigger={{ prefix: userIcon, variant: 'soft', color: 'primary', squared: true }}
					position="bottom-end"
					menu={{ items: profileItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Trigger button variants: solid, outline, soft, ghost, and link.">
			<div class="flex flex-wrap gap-4">
				<PopupMenu
					trigger={{ content: 'Solid', variant: 'solid', color: 'primary' }}
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Outline', variant: 'outline', color: 'secondary' }}
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Soft', variant: 'soft', color: 'success' }}
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Ghost', variant: 'ghost', color: 'info' }}
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Link', variant: 'link', color: 'neutral' }}
					menu={{ items: basicItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Custom menu theme with larger item gap.">
			<div class="flex gap-4">
				<PopupMenu
					trigger={{ content: 'Large Gap Menu', variant: 'outline' }}
					position="bottom-start"
					menu={{
						items: basicItems,
						theme: {
							root: { base: 'gap-3' }
						}
					}}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Small, normal, and large trigger button sizes.">
			<div class="flex items-center gap-4">
				<PopupMenu
					trigger={{ content: 'Small', variant: 'outline', size: 'small' }}
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Normal', variant: 'outline', size: 'normal' }}
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Large', variant: 'outline', size: 'large' }}
					menu={{ items: basicItems }}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Application toolbar with multiple nested popup menus.">
			<div class="bg-surface rounded-xl border-neutral-muted flex gap-1 border p-1">
				<PopupMenu
					trigger={{ content: 'File', variant: 'ghost', size: 'small' }}
					position="bottom-start"
					menu={{ items: basicItems }}
				/>

				<PopupMenu
					trigger={{ content: 'Edit', variant: 'ghost', size: 'small' }}
					position="bottom-start"
					menu={{ items: editItems }}
				/>

				<PopupMenu
					trigger={{ content: 'View', variant: 'ghost', size: 'small' }}
					position="bottom-start"
					menu={{ items: viewItems }}
				/>

				<div class="border-neutral-muted mx-1 border-l"></div>

				<PopupMenu
					trigger={{ prefix: userIcon, variant: 'ghost', size: 'small', squared: true }}
					position="bottom-end"
					menu={{ items: profileItems }}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
