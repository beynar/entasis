<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { Menu, type MenuItem } from '$lib/components/Menu/index.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import type { Density } from '$lib/types/theme.js';
	import { sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';
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

	let clickCount = $state(0);
	let selectedOption = $state('Option 1');

	const submenuModes = ['auto', 'popover', 'stack'] as const;
	const controls = createComponentControls([
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: sizes
		},
		{
			name: 'submenuMode',
			type: 'segmented',
			label: 'Submenu',
			value: 'auto',
			options: submenuModes
		}
	]);

	const densitySegments = [
		{ value: 'small', label: 'Small' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Large' }
	] as const satisfies ReadonlyArray<{ value: Density; label: string }>;
	let menuDensity = $state<Density>('normal');

	// Basic menu items
	const basicItems: MenuItem[] = [
		{ type: 'option', title: 'Profile' },
		{ type: 'option', title: 'Settings' },
		{ type: 'separator' },
		{ type: 'option', title: 'Logout', color: 'danger' }
	];

	// Menu with icons
	const iconItems: MenuItem[] = [
		{ type: 'option', prefix: userIcon, title: 'Profile', description: 'View your profile' },
		{ type: 'option', prefix: gearIcon, title: 'Settings', description: 'Manage preferences' },
		{ type: 'option', prefix: bellIcon, title: 'Notifications', suffix: caretRightIcon },
		{ type: 'separator' },
		{ type: 'option', prefix: signOutIcon, title: 'Log Out', color: 'danger' }
	];

	// Button menu
	const buttonItems: MenuItem[] = [
		{ type: 'button', children: 'Save', variant: 'solid', color: 'primary', fullWidth: true },
		{ type: 'button', children: 'Cancel', variant: 'ghost', fullWidth: true },
		{ type: 'separator' },
		{ type: 'button', children: 'Delete', variant: 'soft', color: 'danger', fullWidth: true }
	];

	// Mixed items
	const mixedItems: MenuItem[] = [
		{ type: 'option', prefix: houseIcon, title: 'Dashboard', href: '/' },
		{ type: 'option', prefix: userIcon, title: 'Profile', href: '/profile' },
		{ type: 'separator', children: 'Actions' },
		{
			type: 'button',
			children: 'New Project',
			variant: 'outline',
			color: 'primary',
			fullWidth: true
		},
		{ type: 'button', children: 'Import', variant: 'ghost', fullWidth: true }
	];

	// Different sizes
	const smallItems: MenuItem[] = [
		{ type: 'option', prefix: userIcon, title: 'Small Item', size: 'small' },
		{ type: 'option', prefix: gearIcon, title: 'Small Settings', size: 'small' }
	];

	const normalItems: MenuItem[] = [
		{ type: 'option', prefix: userIcon, title: 'Normal Item', size: 'normal' },
		{ type: 'option', prefix: gearIcon, title: 'Normal Settings', size: 'normal' }
	];

	const largeItems: MenuItem[] = [
		{ type: 'option', prefix: userIcon, title: 'Large Item', size: 'large' },
		{ type: 'option', prefix: gearIcon, title: 'Large Settings', size: 'large' }
	];

	// Density
	const densityItems: MenuItem[] = [
		{ type: 'option', prefix: userIcon, title: 'Profile', description: 'View your profile' },
		{ type: 'option', prefix: gearIcon, title: 'Settings' },
		{ type: 'separator' },
		{ type: 'option', prefix: signOutIcon, title: 'Log Out', color: 'danger' }
	];

	// Different colors
	const colorItems: MenuItem[] = [
		{ type: 'option', title: 'Primary', color: 'primary', prefix: checkIcon },
		{ type: 'option', title: 'Secondary', color: 'secondary', prefix: checkIcon },
		{ type: 'option', title: 'Success', color: 'success', prefix: checkIcon },
		{ type: 'option', title: 'Warning', color: 'warning', prefix: checkIcon },
		{ type: 'option', title: 'Danger', color: 'danger', prefix: checkIcon },
		{ type: 'option', title: 'Info', color: 'info', prefix: checkIcon }
	];

	// Interactive items
	const interactiveItems: MenuItem[] = $derived([
		{
			type: 'option',
			prefix: userIcon,
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

	// Application menu
	const appMenuItems: MenuItem[] = [
		{
			type: 'option',
			prefix: userIcon,
			title: 'John Doe',
			description: 'john.doe@example.com'
		},
		{ type: 'separator' },
		{ type: 'option', prefix: houseIcon, title: 'Dashboard', href: '/' },
		{ type: 'option', prefix: userIcon, title: 'Profile', href: '/profile' },
		{ type: 'option', prefix: gearIcon, title: 'Settings', href: '/settings' },
		{ type: 'option', prefix: bellIcon, title: 'Notifications', suffix: caretRightIcon },
		{ type: 'separator', children: 'Account' },
		{ type: 'option', prefix: lockIcon, title: 'Privacy', description: 'Manage your privacy' },
		{ type: 'option', prefix: questionIcon, title: 'Help & Support' },
		{ type: 'separator' },
		{ type: 'option', prefix: signOutIcon, title: 'Log Out', color: 'danger' }
	];

	// Context menu
	const contextMenuItems: MenuItem[] = [
		{ type: 'option', title: 'Open', onclick: () => alert('Open') },
		{ type: 'option', title: 'Open in New Tab', onclick: () => alert('Open in new tab') },
		{ type: 'separator' },
		{ type: 'option', title: 'Copy Link', onclick: () => alert('Copy link') },
		{ type: 'option', title: 'Share', suffix: caretRightIcon },
		{ type: 'separator' },
		{ type: 'option', prefix: trashIcon, title: 'Delete', color: 'danger' }
	];

	// Custom gap example
	const customGapItems: MenuItem[] = [
		{ type: 'option', title: 'Large Gap Item 1' },
		{ type: 'option', title: 'Large Gap Item 2' },
		{ type: 'option', title: 'Large Gap Item 3' }
	];

	const stackedItems: MenuItem[] = [
		{ type: 'option', prefix: houseIcon, title: 'Dashboard' },
		{
			type: 'submenu',
			prefix: gearIcon,
			title: 'Settings',
			description: 'Account and workspace',
			menu: [
				{ type: 'option', title: 'Profile' },
				{
					type: 'submenu',
					prefix: lockIcon,
					title: 'Security',
					description: 'Password and sessions',
					menu: [
						{ type: 'option', title: 'Password' },
						{ type: 'option', title: 'Two-factor authentication' },
						{ type: 'option', title: 'Active sessions' }
					]
				},
				{ type: 'option', title: 'Billing' }
			]
		},
		{
			type: 'submenu',
			prefix: bellIcon,
			title: 'Notifications',
			menu: [
				{ type: 'option', title: 'Email' },
				{ type: 'option', title: 'Push' },
				{ type: 'option', title: 'Weekly summary' }
			]
		},
		{ type: 'separator' },
		{ type: 'option', prefix: signOutIcon, title: 'Log Out', color: 'danger' }
	];
</script>

<DocPage
	title="Menu"
	subtitle="A list of actions or options triggered from a control."
	component="Menu"
	features={[
		'role=menu with menuitem children',
		'Arrow key navigation with loop',
		'Submenus as popovers or stacked views',
		'Options, buttons, separators, submenus',
		'Optional header and footer snippets'
	]}
>
	<ComponentCard
		{controls}
		description="A simple vertical list of menu options."
		code={`<Menu
	density="${controls.value.density}"
	submenuMode="${controls.value.submenuMode}"
	items={[
		{ type: 'option', title: 'Profile' },
		{ type: 'option', title: 'Settings' },
		{ type: 'separator' },
		{ type: 'option', title: 'Logout', color: 'danger' }
	]}
/>`}
	>
		<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
			<Menu
				items={basicItems}
				density={controls.value.density}
				submenuMode={controls.value.submenuMode}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="A simple vertical list of menu options.">
			<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
				<Menu items={basicItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Menu options with prefix icons and descriptions.">
			<div class="bg-surface rounded-xl border-neutral-muted w-72 border p-2">
				<Menu items={iconItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Menu items rendered as full-width buttons.">
			<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
				<Menu items={buttonItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Options, separators, and action buttons in one menu.">
			<div class="bg-surface rounded-xl border-neutral-muted w-72 border p-2">
				<Menu items={mixedItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Small, normal, and large menu item sizes.">
			<div class="flex gap-4">
				<div class="flex-1">
					<h3 class="text-neutral/70 mb-2 text-sm">Small</h3>
					<div class="bg-surface rounded-xl border-neutral-muted border p-2">
						<Menu items={smallItems} />
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-neutral/70 mb-2 text-sm">Normal</h3>
					<div class="bg-surface rounded-xl border-neutral-muted border p-2">
						<Menu items={normalItems} />
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-neutral/70 mb-2 text-sm">Large</h3>
					<div class="bg-surface rounded-xl border-neutral-muted border p-2">
						<Menu items={largeItems} />
					</div>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Density"
			description="density scales the row gap and every option's paddings — small for dense menus, large for roomy ones. Combine freely with size."
			code={`<SegmentedControl items={densities} bind:value={density} />
<Menu items={...} {density} />`}
		>
			<div class="flex w-full flex-col items-center gap-5">
				<SegmentedControl
					items={densitySegments}
					bind:value={menuDensity}
					size="small"
					ariaLabel="Menu density"
				/>
				<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
					<Menu items={densityItems} density={menuDensity} />
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="Semantic color variants on menu options.">
			<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
				<Menu items={colorItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Menu items that update state on each click.">
			<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
				<Menu items={interactiveItems} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Full application menu with profile, navigation, and account actions."
		>
			<div class="bg-surface rounded-xl border-neutral-muted w-80 border p-2">
				<Menu items={appMenuItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Typical right-click context menu actions.">
			<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
				<Menu items={contextMenuItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Wider spacing between items via a custom gap class.">
			<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
				<Menu items={customGapItems} class="gap-2" />
			</div>
		</ComponentCard>

		<ComponentCard description="File, edit, and view menus side by side.">
			<div class="flex gap-4">
				<div class="bg-surface rounded-xl border-neutral-muted flex-1 border p-2">
					<h3 class="mb-2 px-2 text-sm font-semibold">File Menu</h3>
					<Menu
						items={[
							{ type: 'option', title: 'New File' },
							{ type: 'option', title: 'Open...' },
							{ type: 'option', title: 'Save' },
							{ type: 'separator' },
							{ type: 'option', title: 'Exit' }
						]}
					/>
				</div>
				<div class="bg-surface rounded-xl border-neutral-muted flex-1 border p-2">
					<h3 class="mb-2 px-2 text-sm font-semibold">Edit Menu</h3>
					<Menu
						items={[
							{ type: 'option', title: 'Undo' },
							{ type: 'option', title: 'Redo' },
							{ type: 'separator' },
							{ type: 'option', title: 'Cut' },
							{ type: 'option', title: 'Copy' },
							{ type: 'option', title: 'Paste' }
						]}
					/>
				</div>
				<div class="bg-surface rounded-xl border-neutral-muted flex-1 border p-2">
					<h3 class="mb-2 px-2 text-sm font-semibold">View Menu</h3>
					<Menu
						items={[
							{ type: 'option', title: 'Zoom In' },
							{ type: 'option', title: 'Zoom Out' },
							{ type: 'separator' },
							{ type: 'option', title: 'Full Screen' }
						]}
					/>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="Nested submenu opened from a menu option.">
			<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
				<Menu
					items={[
						{ type: 'option', prefix: houseIcon, title: 'Dashboard' },
						{ type: 'option', prefix: userIcon, title: 'Profile' },
						{
							type: 'submenu',
							prefix: gearIcon,
							title: 'Settings',
							menu: [
								{ type: 'option', title: 'General' },
								{ type: 'option', title: 'Privacy' },
								{ type: 'option', title: 'Security' },
								{ type: 'separator' },
								{ type: 'option', title: 'Advanced' }
							]
						},
						{ type: 'separator' },
						{ type: 'option', prefix: signOutIcon, title: 'Log Out', color: 'danger' }
					]}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Submenus nested two levels deep.">
			<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
				<Menu
					items={[
						{ type: 'option', title: 'New File' },
						{ type: 'option', title: 'Open...' },
						{
							type: 'submenu',
							title: 'Recent Files',
							menu: [
								{ type: 'option', title: 'document.txt' },
								{ type: 'option', title: 'project.js' },
								{
									type: 'submenu',
									title: 'More',
									menu: [
										{ type: 'option', title: 'file1.txt' },
										{ type: 'option', title: 'file2.txt' },
										{ type: 'option', title: 'file3.txt' }
									]
								}
							]
						},
						{ type: 'separator' },
						{ type: 'option', title: 'Save' },
						{ type: 'option', title: 'Save As...' }
					]}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Submenus can render as stacked views inside one menu surface.">
			<div class="bg-surface rounded-xl border-neutral-muted w-80 border p-2">
				<Menu items={stackedItems} submenuMode="stack" />
			</div>
		</ComponentCard>

		<ComponentCard description="Submenu opened on hover (default) vs click only.">
			<div class="flex gap-4">
				<div class="flex-1">
					<h3 class="text-neutral/70 mb-2 text-sm">Hover Only (default)</h3>
					<div class="bg-surface rounded-xl border-neutral-muted border p-2">
						<Menu
							items={[
								{ type: 'option', title: 'Option 1' },
								{
									type: 'submenu',
									title: 'Hover Me',
									openOnHover: true,
									openOnClick: false,
									menu: [
										{ type: 'option', title: 'Sub 1' },
										{ type: 'option', title: 'Sub 2' }
									]
								}
							]}
						/>
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-neutral/70 mb-2 text-sm">Click Only</h3>
					<div class="bg-surface rounded-xl border-neutral-muted border p-2">
						<Menu
							items={[
								{ type: 'option', title: 'Option 1' },
								{
									type: 'submenu',
									title: 'Click Me',
									openOnHover: false,
									openOnClick: true,
									menu: [
										{ type: 'option', title: 'Sub 1' },
										{ type: 'option', title: 'Sub 2' }
									]
								}
							]}
						/>
					</div>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Debug overlays show the trigger/submenu safe-area rectangles in blue and the prediction cone in orange — it keeps the submenu open during the diagonal move while the other options stay hoverable."
		>
			<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
				<Menu
					items={[
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
					]}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Every item type in a single menu: options, submenus, buttons, separators."
		>
			<div class="bg-surface rounded-xl border-neutral-muted w-72 border p-2">
				<Menu
					items={[
						{
							type: 'option',
							prefix: userIcon,
							title: 'John Doe',
							description: 'john@example.com'
						},
						{ type: 'separator' },
						{ type: 'option', prefix: houseIcon, title: 'Dashboard' },
						{
							type: 'submenu',
							prefix: gearIcon,
							title: 'Settings',
							description: 'Configure your account',
							menu: [
								{ type: 'option', title: 'General' },
								{ type: 'option', title: 'Privacy' },
								{ type: 'option', prefix: lockIcon, title: 'Security' }
							]
						},
						{
							type: 'submenu',
							prefix: bellIcon,
							title: 'Notifications',
							menu: [
								{ type: 'option', title: 'Email Notifications' },
								{ type: 'option', title: 'Push Notifications' },
								{ type: 'separator' },
								{ type: 'option', title: 'Notification Settings' }
							]
						},
						{ type: 'separator', children: 'Actions' },
						{ type: 'button', children: 'New Project', variant: 'outline', fullWidth: true },
						{ type: 'separator' },
						{ type: 'option', prefix: signOutIcon, title: 'Log Out', color: 'danger' }
					]}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Custom header content above menu items.">
			<div class="bg-surface rounded-xl border-neutral-muted w-72 border p-2">
				<Menu items={iconItems}>
					{#snippet header()}
						<div class="border-neutral-muted mb-2 border-b pb-2">
							<div class="px-2">
								<h3 class="text-sm font-semibold">User Menu</h3>
								<p class="text-neutral/70 text-xs">Manage your account</p>
							</div>
						</div>
					{/snippet}
				</Menu>
			</div>
		</ComponentCard>

		<ComponentCard description="Custom footer content below menu items.">
			<div class="bg-surface rounded-xl border-neutral-muted w-64 border p-2">
				<Menu items={basicItems}>
					{#snippet footer()}
						<div class="border-neutral-muted mt-2 border-t pt-2">
							<div class="text-neutral/60 px-2 text-xs">Version 1.0.0</div>
						</div>
					{/snippet}
				</Menu>
			</div>
		</ComponentCard>

		<ComponentCard description="Header and footer slots combined in one menu.">
			<div class="bg-surface rounded-xl border-neutral-muted w-72 border p-2">
				<Menu items={iconItems}>
					{#snippet header()}
						<div class="border-neutral-muted mb-2 border-b pb-2">
							<div class="flex items-center gap-2 px-2">
								<div
									class="bg-primary text-primary-contrast flex h-10 w-10 items-center justify-center rounded-full"
								>
									JD
								</div>
								<div>
									<div class="text-sm font-semibold">John Doe</div>
									<div class="text-neutral/70 text-xs">john@example.com</div>
								</div>
							</div>
						</div>
					{/snippet}
					{#snippet footer()}
						<div class="border-neutral-muted mt-2 border-t pt-2">
							<div class="text-neutral/60 px-2 text-center text-xs">
								<a href="/privacy" class="hover:text-neutral hover:underline">Privacy</a>
								·
								<a href="/terms" class="hover:text-neutral hover:underline">Terms</a>
							</div>
						</div>
					{/snippet}
				</Menu>
			</div>
		</ComponentCard>

		<ComponentCard description="Minimal three-item menu.">
			<div class="bg-surface rounded-xl border-neutral-muted w-48 border p-2">
				<Menu
					items={[
						{ type: 'option', title: 'Item 1' },
						{ type: 'option', title: 'Item 2' },
						{ type: 'option', title: 'Item 3' }
					]}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
