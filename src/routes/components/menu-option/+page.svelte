<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import { MenuOption } from '$lib/components/MenuOption/index.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import type { Density } from '$lib/types/theme.js';
	import { colors, densities, sizes } from '$lib/utils/tokens.js';
	import { checkIcon } from '$lib/components/Icons/check.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { userIcon } from '$lib/components/Icons/user.js';
	import { signOutIcon } from '$lib/components/Icons/signOut.js';
	import { questionIcon } from '$lib/components/Icons/question.js';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';

	let clickCount = $state(0);
	let isHovered = $state(false);

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
			options: densities
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'primary',
			options: colors
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);

	const densitySegments = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
	] as const satisfies ReadonlyArray<{ value: Density; label: string }>;
	let rowDensity = $state<Density>('normal');
</script>

<DocPage
	title="Menu option"
	subtitle="An individual selectable item within a menu."
	component="MenuOption"
	features={[
		'Auto button, link, or menuitem role',
		{ label: 'aria-disabled and aria-selected support', test: 'a11y:menu-option.aria-state' },
		{ label: 'data-highlighted for keyboard focus', test: 'a11y:menu-option.data-highlighted' },
		'Prefix, suffix, title, description slots'
	]}
>
	<ComponentCard
		{controls}
		description="Single item with icon, title, and description."
		code={`<MenuOption
	size="${controls.value.size}"
	density="${controls.value.density}"
	color="${controls.value.color}"
	disabled={${controls.value.disabled}}
	prefix={userIcon}
	title="Profile"
	description="View and edit your profile"
/>`}
	>
		<div class="bg-surface border-neutral-muted w-64 space-y-1 rounded-xl border p-1">
			<MenuOption
				size={controls.value.size}
				density={controls.value.density}
				color={controls.value.color}
				disabled={controls.value.disabled}
				prefix={userIcon}
				title="Profile"
				description="View and edit your profile"
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Basic menu items with optional description.">
			<div class="bg-surface border-neutral-muted w-64 space-y-1 rounded-xl border p-1">
				<MenuOption title="Simple Menu Item" />

				<MenuOption title="With Description" description="This is a helpful description" />
			</div>
		</ComponentCard>

		<ComponentCard description="Prefix and suffix icon slots.">
			<div class="bg-surface border-neutral-muted w-64 space-y-1 rounded-xl border p-1">
				<MenuOption prefix={userIcon} title="Profile" description="View and edit your profile" />

				<MenuOption prefix={gearIcon} suffix={caretRightIcon} title="Settings" />

				<MenuOption prefix={questionIcon} title="Help & Support" />
			</div>
		</ComponentCard>

		<ComponentCard description="Small, normal, and large sizes.">
			<div class="bg-surface border-neutral-muted w-64 space-y-1 rounded-xl border p-1">
				<MenuOption size="small" prefix={userIcon} title="Small Menu Item" />

				<MenuOption size="normal" prefix={userIcon} title="Normal Menu Item" />

				<MenuOption size="large" prefix={userIcon} title="Large Menu Item" />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Density"
			description="density scales paddings, gaps, and min-height while size keeps the typography — compact for dense menus, comfortable for roomy ones."
			code={`<SegmentedControl items={densities} bind:value={density} />
<MenuOption {density} prefix={userIcon} title="Row" description="..." />`}
		>
			<div class="flex w-full flex-col items-center gap-5">
				<SegmentedControl
					items={densitySegments}
					bind:value={rowDensity}
					size="small"
					label="Row density"
				/>
				<div class="bg-surface border-neutral-muted w-64 space-y-1 rounded-xl border p-1">
					<MenuOption
						density={rowDensity}
						prefix={userIcon}
						title="Profile"
						description="View your profile"
					/>
					<MenuOption density={rowDensity} prefix={gearIcon} title="Settings" />
					<MenuOption density={rowDensity} prefix={signOutIcon} title="Log out" color="danger" />
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="Semantic color variants.">
			<div class="bg-surface border-neutral-muted w-64 space-y-1 rounded-xl border p-1">
				<MenuOption color="primary" title="Primary" />

				<MenuOption color="secondary" title="Secondary" />

				<MenuOption color="success" prefix={checkIcon} title="Approve" />

				<MenuOption color="danger" prefix={signOutIcon} title="Delete" />

				<MenuOption color="info" title="Info" />
			</div>
		</ComponentCard>

		<ComponentCard description="Click, hover, and link interactions.">
			<div class="bg-surface border-neutral-muted w-64 space-y-1 rounded-xl border p-1">
				<MenuOption onclick={() => clickCount++} title="Clicked {clickCount} times" />

				<MenuOption
					onpointerenter={() => (isHovered = true)}
					onpointerleave={() => (isHovered = false)}
					title={isHovered ? 'Hovering!' : 'Hover over me'}
				/>

				<MenuOption
					href="/components/button"
					suffix={caretRightIcon}
					title="Go to Button Component"
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Complete menu with dividers and a danger action.">
			<div class="bg-surface border-neutral-muted w-72 rounded-xl border p-1">
				<MenuOption prefix={userIcon} title="John Doe" description="john@example.com" />

				<div class="border-neutral-muted my-1 border-t"></div>

				<MenuOption prefix={userIcon} title="Profile" description="View and edit your profile" />

				<MenuOption prefix={gearIcon} title="Settings" description="Manage your preferences" />

				<MenuOption prefix={questionIcon} title="Help & Support" />

				<div class="border-neutral-muted my-1 border-t"></div>

				<MenuOption color="danger" prefix={signOutIcon} title="Log Out" />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
