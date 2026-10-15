<script lang="ts">
	import { resolve } from '$app/paths';
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { Menu, type MenuItem } from '$lib/components/Menu/index.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import type { Density } from '$lib/types/theme.js';
	import { densities } from '$lib/utils/tokens.js';
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
	let showMinimap = $state(true);
	let sortBy = $state('name');
	let search = $state('');
	let highlighted = $state<string | undefined>();

	const submenuModes = ['auto', 'popover', 'stack'] as const;
	const controls = createComponentControls([
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: densities
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
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
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

	// Checkbox items and a radio group: they keep the menu open and report each change once.
	const checkableItems: MenuItem[] = $derived([
		{
			type: 'checkbox',
			title: 'Show minimap',
			value: showMinimap,
			onValueChange: (next) => (showMinimap = next)
		},
		{ type: 'checkbox', title: 'Word wrap', defaultValue: true },
		{ type: 'separator' },
		{
			type: 'radio-group',
			label: 'Sort by',
			value: sortBy,
			onValueChange: (next) => (sortBy = next),
			items: [
				{ value: 'name', title: 'Name' },
				{ value: 'date', title: 'Date modified' },
				{ value: 'size', title: 'Size' }
			]
		}
	]);

	// Groups: a labelled role="group" per heading; the arrow keys cross the boundaries.
	const groupedItems: MenuItem[] = [
		{ type: 'option', prefix: houseIcon, title: 'Dashboard' },
		{
			type: 'group',
			label: 'Recent',
			items: [
				{ type: 'option', title: 'notes.md' },
				{ type: 'option', title: 'todo.md' }
			]
		},
		{
			type: 'group',
			label: 'Pinned',
			items: [
				{ type: 'option', title: 'roadmap.md' },
				{ type: 'option', title: 'budget.xlsx' }
			]
		}
	];

	// Filterable: a search field above the rows; a submenu takes a filter of its own.
	const filterItems: MenuItem[] = [
		{ type: 'option', prefix: houseIcon, title: 'Dashboard' },
		{ type: 'option', prefix: userIcon, title: 'Profile' },
		{ type: 'option', prefix: gearIcon, title: 'Settings' },
		{ type: 'option', prefix: bellIcon, title: 'Notifications' },
		{
			type: 'group',
			label: 'Account',
			items: [
				{ type: 'option', prefix: lockIcon, title: 'Privacy' },
				{ type: 'option', prefix: signOutIcon, title: 'Log out', color: 'danger' }
			]
		},
		{
			type: 'submenu',
			title: 'Move to',
			filter: { placeholder: 'Pick a folder' },
			menu: [
				{ type: 'option', title: 'Inbox' },
				{ type: 'option', title: 'Archive' },
				{ type: 'option', title: 'Projects' },
				{ type: 'option', title: 'Receipts' }
			]
		}
	];

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
		'Styling hooks: data-highlighted, data-disabled and data-selected on rows, data-popup-open on submenu rows (menuDataAttributes)',
		'role=menu with menuitem children',
		{ label: 'Arrow key navigation with loop', test: 'a11y:menu.arrow-keys' },
		'Submenus as popovers or stacked views',
		'Options, buttons, separators, submenus',
		{
			label: 'Checkbox items, radio groups and labelled groups',
			test: 'a11y:menu.checkable-items'
		},
		{
			label: 'Filterable, with focus staying in the search field',
			test: 'a11y:menu.filter-focus'
		},
		{
			label: 'Header and footer sit outside the menu role',
			test: 'a11y:menu.chrome-outside-role'
		},
		{
			label: 'Rows keep their node through insertions and removals',
			test: 'a11y:menu.row-identity'
		},
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
		<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
			<Menu
				items={basicItems}
				density={controls.value.density}
				submenuMode={controls.value.submenuMode}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="A simple vertical list of menu options.">
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
				<Menu items={basicItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Menu options with prefix icons and descriptions.">
			<div class="bg-surface border-neutral-muted w-72 rounded-xl border p-2">
				<Menu items={iconItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Menu items rendered as full-width buttons.">
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
				<Menu items={buttonItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Options, separators, and action buttons in one menu.">
			<div class="bg-surface border-neutral-muted w-72 rounded-xl border p-2">
				<Menu items={mixedItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Small, normal, and large menu item sizes.">
			<div class="flex gap-4">
				<div class="flex-1">
					<h3 class="text-neutral/70 mb-2 text-sm">Small</h3>
					<div class="bg-surface border-neutral-muted rounded-xl border p-2">
						<Menu items={smallItems} />
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-neutral/70 mb-2 text-sm">Normal</h3>
					<div class="bg-surface border-neutral-muted rounded-xl border p-2">
						<Menu items={normalItems} />
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-neutral/70 mb-2 text-sm">Large</h3>
					<div class="bg-surface border-neutral-muted rounded-xl border p-2">
						<Menu items={largeItems} />
					</div>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Density"
			description="density scales the row gap and every option's paddings — compact for dense menus, comfortable for roomy ones. Combine freely with size."
			code={`<SegmentedControl items={densities} bind:value={density} />
<Menu items={...} {density} />`}
		>
			<div class="flex w-full flex-col items-center gap-5">
				<SegmentedControl
					items={densitySegments}
					bind:value={menuDensity}
					size="small"
					label="Menu density"
				/>
				<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
					<Menu items={densityItems} density={menuDensity} />
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="Semantic color variants on menu options.">
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
				<Menu items={colorItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Menu items that update state on each click.">
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
				<Menu items={interactiveItems} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Checkbox items and radio groups"
			description="Checkbox and radio rows keep the menu open and report each change once. The check fades out when a row is unchecked. Minimap is controlled from the page; Word wrap and the sort order are uncontrolled or bound."
			code={`<Menu
	items={[
		{ type: 'checkbox', title: 'Show minimap', value: showMinimap, onValueChange: (next) => (showMinimap = next) },
		{ type: 'checkbox', title: 'Word wrap', defaultValue: true },
		{ type: 'separator' },
		{
			type: 'radio-group',
			label: 'Sort by',
			value: sortBy,
			onValueChange: (next) => (sortBy = next),
			items: [
				{ value: 'name', title: 'Name' },
				{ value: 'date', title: 'Date modified' },
				{ value: 'size', title: 'Size' }
			]
		}
	]}
/>`}
		>
			<div class="flex flex-col items-center gap-3">
				<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
					<Menu items={checkableItems} />
				</div>
				<p class="text-neutral/70 text-sm" data-testid="checkable-state">
					Minimap {showMinimap ? 'on' : 'off'}, sorted by {sortBy}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Labelled groups"
			description="A group is a role=group named by its label. The label is hidden from the accessibility tree so it is not read twice, and the arrow keys and type-ahead cross group boundaries."
		>
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
				<Menu items={groupedItems} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Filterable menu"
			description="filter adds a search field. Focus stays in the field while ArrowDown and ArrowUp highlight rows; Enter presses the highlighted one. A submenu takes a filter of its own, and onHighlightChange reports the highlighted row."
			code={`<Menu
	items={items}
	filter={{ placeholder: 'Find an action' }}
	bind:search
	onHighlightChange={(value) => (highlighted = value)}
/>`}
		>
			<div class="flex flex-col items-center gap-3">
				<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
					<Menu
						items={filterItems}
						filter={{ placeholder: 'Find an action' }}
						bind:search
						onHighlightChange={(value) => (highlighted = value)}
					/>
				</div>
				<p class="text-neutral/70 text-sm" data-testid="filter-state">
					Search "{search}", highlighted {highlighted ?? 'nothing'}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Header and footer"
			description="The header and footer slots sit outside the menu role, so a link or a field in them is not a menu item."
		>
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
				<Menu items={basicItems}>
					{#snippet header()}
						<p class="text-neutral/70 px-md pt-xs pb-sm text-xs font-medium">
							Signed in as ada@example.com
						</p>
					{/snippet}
					{#snippet footer()}
						<a
							class="text-primary-readable px-md pt-sm block text-xs underline"
							href={resolve('/components/menu')}
						>
							Help and shortcuts
						</a>
					{/snippet}
				</Menu>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Right-to-left text"
			description="In right-to-left text submenus open to the left, the caret mirrors, ArrowLeft opens a submenu and ArrowRight closes it. The submenu panel carries the direction of its row even though it is portaled out of it."
		>
			<div dir="rtl" class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
				<Menu
					items={[
						{ type: 'option', prefix: houseIcon, title: 'Dashboard' },
						{
							type: 'submenu',
							prefix: gearIcon,
							title: 'Settings',
							menu: [
								{ type: 'option', title: 'General' },
								{ type: 'option', title: 'Privacy' }
							]
						}
					]}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Full application menu with profile, navigation, and account actions."
		>
			<div class="bg-surface border-neutral-muted w-80 rounded-xl border p-2">
				<Menu items={appMenuItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Typical right-click context menu actions.">
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
				<Menu items={contextMenuItems} />
			</div>
		</ComponentCard>

		<ComponentCard description="Wider spacing between items via a custom gap class.">
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
				<Menu items={customGapItems} class="gap-2" />
			</div>
		</ComponentCard>

		<ComponentCard description="File, edit, and view menus side by side.">
			<div class="flex gap-4">
				<div class="bg-surface border-neutral-muted flex-1 rounded-xl border p-2">
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
				<div class="bg-surface border-neutral-muted flex-1 rounded-xl border p-2">
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
				<div class="bg-surface border-neutral-muted flex-1 rounded-xl border p-2">
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
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
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
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
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
			<div class="bg-surface border-neutral-muted w-80 rounded-xl border p-2">
				<Menu items={stackedItems} submenuMode="stack" />
			</div>
		</ComponentCard>

		<ComponentCard description="Submenu opened on hover (default) vs click only.">
			<div class="flex gap-4">
				<div class="flex-1">
					<h3 class="text-neutral/70 mb-2 text-sm">Hover Only (default)</h3>
					<div class="bg-surface border-neutral-muted rounded-xl border p-2">
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
					<div class="bg-surface border-neutral-muted rounded-xl border p-2">
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
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
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
			<div class="bg-surface border-neutral-muted w-72 rounded-xl border p-2">
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
			<div class="bg-surface border-neutral-muted w-72 rounded-xl border p-2">
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
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-2">
				<Menu items={basicItems}>
					{#snippet footer()}
						<div class="border-neutral-muted mt-2 border-t pt-2">
							<div class="text-neutral/70 px-2 text-xs">Version 1.0.0</div>
						</div>
					{/snippet}
				</Menu>
			</div>
		</ComponentCard>

		<ComponentCard description="Header and footer slots combined in one menu.">
			<div class="bg-surface border-neutral-muted w-72 rounded-xl border p-2">
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
							<div class="text-neutral/70 px-2 text-center text-xs">
								<a href="#privacy" class="hover:text-neutral hover:underline">Privacy</a>
								·
								<a href="#terms" class="hover:text-neutral hover:underline">Terms</a>
							</div>
						</div>
					{/snippet}
				</Menu>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Type-ahead text"
			description="Focus a row and type a letter. Each row matches on its textValue, so the shortcut in front of the title does not count, and the disabled Duplicate row is passed over for Delete."
			code={`<Menu
	items={[
		{ type: 'option', title: '⌘C  Copy', textValue: 'Copy' },
		{ type: 'option', title: '⌘X  Cut', textValue: 'Cut' },
		{ type: 'option', title: '⌘V  Paste', textValue: 'Paste' },
		{ type: 'option', title: '⌘D  Duplicate', textValue: 'Duplicate', disabled: true },
		{ type: 'option', title: '⌫  Delete', textValue: 'Delete' }
	]}
/>`}
		>
			<div class="bg-surface border-neutral-muted w-56 rounded-xl border p-2">
				<Menu
					items={[
						{ type: 'option', title: '⌘C  Copy', textValue: 'Copy' },
						{ type: 'option', title: '⌘X  Cut', textValue: 'Cut' },
						{ type: 'option', title: '⌘V  Paste', textValue: 'Paste' },
						{ type: 'option', title: '⌘D  Duplicate', textValue: 'Duplicate', disabled: true },
						{ type: 'option', title: '⌫  Delete', textValue: 'Delete' }
					]}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Minimal three-item menu.">
			<div class="bg-surface border-neutral-muted w-48 rounded-xl border p-2">
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
