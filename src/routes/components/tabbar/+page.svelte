<script lang="ts">
	import Tabbar from '$lib/components/Tabbar/Tabbar.svelte';
	import { Button } from '$lib/components/Button/index.js';
	import { userIcon } from '$lib/components/Icons/user.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { colors, sizes } from '$lib/utils/tokens.js';

	const tabbarVariants = ['underline', 'pill'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'underline',
			options: tabbarVariants
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		}
	]);

	let simpleActiveTab = $state('Home');
	let iconActiveTab = $state('Home');
	let disabledActiveTab = $state('Enabled');
	let pillActiveTab = $state('Reports');
	let pillColorTab = $state('Analytics');
	let pillVerticalActiveTab = $state('Overview');
	let variableActiveTab = $state('All');
	let scrollableActiveTab = $state('Overview');
	let overflowActiveTab = $state('Home');

	// Overflow pattern: the last tab opens a popover menu with additional views.
	const overflowTabs = [
		'Home',
		'Projects',
		{ label: 'More', menu: ['Analytics', 'Reports', 'Billing'] }
	];

	const simpleTabs = ['Home', 'Profile', 'Settings'];
	const pillTabs = ['Overview', 'Analytics', 'Reports'];
	// Deliberately uneven label lengths: the indicator must resize as it slides.
	const variableTabs = ['All', 'In progress', 'Done', 'Archived & deleted'];
	// More tabs than fit — the bar scrolls horizontally with no visible scrollbar.
	const manyTabs = [
		'Overview',
		'Analytics',
		'Reports',
		'Audience',
		'Behaviour',
		'Conversions',
		'Attribution',
		'Realtime',
		'Settings'
	];
	// The pill respects the color prop; 'neutral' gives the neutral look.
	const pillColors = ['neutral', 'primary', 'success', 'danger'] as const;

	const tabsWithIcons = [
		{ label: 'Home', prefix: houseIcon },
		{ label: 'Profile', prefix: userIcon },
		{ label: 'Settings', prefix: gearIcon }
	];

	const tabsWithDisabled = [
		{ label: 'Enabled' },
		{ label: 'Disabled', disabled: true },
		{ label: 'Also Enabled' }
	];

	const linkTabs = [
		{ label: 'Dashboard', href: '#dashboard' },
		{ label: 'Analytics', href: '#analytics' },
		{ label: 'Reports', href: '#reports' }
	];

	function handleTabChange({ value }: { value: string }) {
		console.log('Tab changed to:', value);
	}

	// A disabled first tab is skipped by the default selection; removing the active tab moves the
	// selection to its nearest enabled neighbour and reports the new value.
	const fallbackSeed = [{ label: 'Drafts', disabled: true }, 'Inbox', 'Sent', 'Archive'];
	let fallbackTabs = $state(fallbackSeed);
	let fallbackActiveTab = $state<string>();
	let fallbackReports = $state<string[]>([]);
	let manualActiveTab = $state('Inbox');
</script>

<DocPage
	title="Tabbar"
	subtitle="Horizontal navigation between related views. An animated indicator (underline or pill) slides between tabs, is correct during SSR, and respects the color prop."
	component="Tabbar"
	features={[
		'Sliding underline / pill indicator',
		'Correct on SSR, animates after hydration',
		'tablist/tab roles with arrow keys',
		'bind:value selection state'
	]}
>
	<ComponentCard
		{controls}
		code={`<Tabbar
	items={['Home', 'Profile', 'Settings']}
	bind:value={activeTab}
	size="${controls.value.size}"
	variant="${controls.value.variant}"
	color="${controls.value.color}"
	onValueChange={({ value }) => console.log('Tab changed to:', value)}
/>`}
	>
		<div class="flex flex-col items-center">
			<Tabbar
				class="w-fit"
				items={simpleTabs}
				bind:value={simpleActiveTab}
				size={controls.value.size}
				variant={controls.value.variant}
				color={controls.value.color}
				onValueChange={handleTabChange}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Use Arrow keys (Left/Right for horizontal, Up/Down for vertical) to move to a tab and select it; Home/End jump to the first/last tab."
		>
			<div class="flex flex-col items-center gap-3">
				<Tabbar
					class="w-fit"
					items={simpleTabs}
					bind:value={simpleActiveTab}
					onValueChange={handleTabChange}
				/>
				<p class="text-neutral/70 text-sm">Active tab: {simpleActiveTab}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Manual activation"
			description="With activateOnFocus set to false the arrow keys, Home and End only move focus; Enter, Space or a click selects the focused tab. Focus the first tab, press the arrow keys, and watch the selection stay put until you press Enter."
			code={`<Tabbar items={['Inbox', 'Drafts', 'Sent']} activateOnFocus={false} bind:value />`}
		>
			<div class="flex flex-col items-center gap-3">
				<Tabbar
					class="w-fit"
					items={['Inbox', 'Drafts', 'Sent']}
					activateOnFocus={false}
					bind:value={manualActiveTab}
				/>
				<p class="text-neutral/70 text-sm" data-testid="tabbar-manual-status">
					Active tab: {manualActiveTab}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="With icons"
			description="Tabs accept prefix/suffix snippets, typically icons."
		>
			<div class="flex flex-col items-center">
				<Tabbar class="w-fit" items={tabsWithIcons} bind:value={iconActiveTab} />
			</div>
		</ComponentCard>

		<ComponentCard title="Disabled tabs" description="Individual tabs can be disabled.">
			<div class="flex flex-col items-center">
				<Tabbar class="w-fit" items={tabsWithDisabled} bind:value={disabledActiveTab} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Selection fallback"
			description="The disabled first tab is skipped by the default selection, and removing the active tab selects its nearest enabled neighbour; the new value is written back to the binding and reported through onValueChange. A value the parent or another control sets is never rewritten: one that names no tab selects no tab and hides the indicator."
			code={`<Tabbar {items} bind:value onValueChange={({ value }) => console.log(value)} />`}
		>
			<div class="flex flex-col items-center gap-3">
				<Tabbar
					class="w-fit"
					items={fallbackTabs}
					bind:value={fallbackActiveTab}
					onValueChange={({ value }) => (fallbackReports = [...fallbackReports, value])}
				/>
				<div class="flex flex-wrap justify-center gap-2">
					<Button
						variant="outline"
						size="small"
						onclick={() =>
							(fallbackTabs = fallbackTabs.filter(
								(tab) => (typeof tab === 'string' ? tab : tab.label) !== fallbackActiveTab
							))}
					>
						Remove active tab
					</Button>
					<Button variant="outline" size="small" onclick={() => (fallbackActiveTab = 'Spam')}>
						Pick Spam from elsewhere
					</Button>
					<Button
						variant="ghost"
						size="small"
						onclick={() => {
							fallbackTabs = fallbackSeed;
							fallbackActiveTab = 'Inbox';
						}}
					>
						Reset tabs
					</Button>
				</div>
				<p class="text-neutral/70 text-sm" data-testid="tabbar-fallback-status">
					value: {fallbackActiveTab ?? 'none'} · onValueChange: {fallbackReports.join(', ') ||
						'not called yet'}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard title="Link tabs" description="Provide href to render tabs as links.">
			<div class="flex flex-col items-center">
				<Tabbar class="w-fit" items={linkTabs} />
			</div>
		</ComponentCard>

		<ComponentCard description="Full-width tab bar.">
			<div class="flex w-full flex-col items-center gap-3">
				<Tabbar
					fullWidth
					items={simpleTabs}
					bind:value={simpleActiveTab}
					onValueChange={handleTabChange}
				/>
				<p class="text-neutral/70 text-sm">Active tab: {simpleActiveTab}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Pill variant"
			description="A rounded track where the active tab is a raised pill. The pill slides and resizes between tabs with the same animation as the underline indicator."
		>
			<div class="flex flex-col items-center">
				<Tabbar variant="pill" items={pillTabs} bind:value={pillActiveTab} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Pill colors"
			description="The pill respects the color prop — the active pill fills with the color and its label flips to that color's contrast tone. Use color='neutral' for the neutral segmented-control look."
		>
			<div class="flex flex-col items-center gap-3">
				{#each pillColors as c (c)}
					<Tabbar variant="pill" color={c} items={pillTabs} bind:value={pillColorTab} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Variable tab widths"
			description="The indicator measures the active tab, so it adapts to uneven label lengths — in both variants."
		>
			<div class="flex flex-col items-center gap-3">
				<Tabbar class="w-fit" items={variableTabs} bind:value={variableActiveTab} />
				<Tabbar variant="pill" items={variableTabs} bind:value={variableActiveTab} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Scrollable overflow"
			description="When the tabs don't fit, the bar scrolls horizontally with no visible scrollbar — in both variants."
		>
			<div class="flex w-full max-w-sm flex-col items-center gap-3">
				<Tabbar class="w-full" items={manyTabs} bind:value={scrollableActiveTab} />
				<Tabbar variant="pill" class="w-full" items={manyTabs} bind:value={scrollableActiveTab} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Menu tab"
			description="A tab with menu opens a popover listing additional items that do not fit inline. Selecting one activates the tab and shows the selection's label on it."
		>
			<div class="flex flex-col items-center">
				<Tabbar class="w-fit" items={overflowTabs} bind:value={overflowActiveTab} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Vertical pill"
			description="The pill variant works on the vertical orientation too — the indicator slides along the column."
		>
			<div class="flex flex-col items-center">
				<Tabbar
					variant="pill"
					orientation="vertical"
					items={pillTabs}
					bind:value={pillVerticalActiveTab}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
