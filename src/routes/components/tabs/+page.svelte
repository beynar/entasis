<script lang="ts">
	import { Tabs } from '$lib/components/Tabs/index.js';
	import { Button } from '$lib/components/Button/index.js';
	import { TextInput } from '$lib/components/Form/TextInput/index.js';
	import { Chip } from '$lib/components/Chip/index.js';
	import { userIcon } from '$lib/components/Icons/user.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { chartBarIcon } from '$lib/components/Icons/chartBar.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { colors, sizes } from '$lib/utils/tokens.js';

	const placements = ['top', 'bottom', 'left', 'right'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		},
		{
			name: 'placement',
			type: 'segmented',
			label: 'Placement',
			value: 'top',
			options: placements
		},
		{ name: 'fullWidth', type: 'switch', label: 'Full width', value: false }
	]);

	let simpleActiveTab = $state('Overview');
	let iconActiveTab = $state('Home');
	let programmaticActiveTab = $state('Step 1');
	let verticalActiveTab = $state('Dashboard');
	let formActiveTab = $state('Personal Info');
	let mountActiveTab = $state('Lazy');
	const mountMode = 'once' as const;
	const mountTabs = [
		{
			label: 'Lazy',
			title: 'Lazy by default',
			description: 'A panel is built the first time its tab is activated.'
		},
		{
			label: 'Once',
			title: 'Kept after the first visit',
			description: 'mount="once" leaves the panel mounted when you move away.'
		},
		{
			label: 'Eager',
			title: 'Everything up front',
			description: 'mount="eager" builds every panel with the component.'
		}
	];
	let lastChangedTab = $state('Personal Info');

	const simpleTabs = [
		{ label: 'Overview', title: 'Overview', description: 'Important information at a glance.' },
		{ label: 'Details', title: 'Details', description: 'Supporting data and operational notes.' },
		{ label: 'Settings', title: 'Settings', description: 'Preferences for this workspace.' }
	];

	const iconTabs = [
		{
			label: 'Home',
			prefix: houseIcon,
			title: 'Home Dashboard',
			description: '24 active projects and 156 completed tasks.',
			badge: 'Live'
		},
		{
			label: 'Profile',
			prefix: userIcon,
			title: 'User Profile',
			description: 'Account details, access level, and membership status.',
			badge: 'Member'
		},
		{
			label: 'Settings',
			prefix: gearIcon,
			title: 'Application Settings',
			description: 'Theme, notification, and workspace preferences.',
			badge: '3 updates'
		}
	];

	const programmaticTabs = [
		{ label: 'Step 1', title: 'Welcome', description: 'Start the guided flow.' },
		{ label: 'Step 2', title: 'Progress', description: 'Continue through the middle step.' },
		{ label: 'Step 3', title: 'Complete', description: 'Review the final state.' }
	];

	const verticalTabs = [
		{
			label: 'Dashboard',
			title: 'Dashboard Overview',
			description: 'Key metrics and quick actions.'
		},
		{ label: 'Analytics', title: 'Analytics Data', description: 'Performance trends and reports.' },
		{ label: 'Reports', title: 'Generated Reports', description: 'Exports and shared summaries.' }
	];

	const formTabs = [
		{ label: 'Personal Info', title: 'Personal Information' },
		{ label: 'Contact', title: 'Contact Details' },
		{ label: 'Preferences', title: 'Preferences' }
	];

	let formData = $state({
		name: '',
		email: '',
		notifications: true
	});

	function handleTabChange({ item }: { item: (typeof formTabs)[number] }) {
		lastChangedTab = item.label;
	}
</script>

<DocPage
	title="Tabs"
	subtitle="Tabbed navigation paired with animated content panels."
	component="Tabs"
	features={[
		{ label: 'WAI-ARIA tablist with tabpanels', test: 'a11y:tabs.aria-wiring' },
		{ label: 'Arrow-key navigation via useNavigation', test: 'a11y:tabs.arrow-keys' },
		'bindable value and api handle',
		'Animated panel transitions via Stepper',
		'Top, bottom, left, right placement'
	]}
>
	<ComponentCard
		{controls}
		description="Basic tabs render one children snippet for every item."
		code={`<Tabs
	items={simpleTabs}
	bind:value={activeTab}
	placement="${controls.value.placement}"
	tabbar={{ size: '${controls.value.size}', color: '${controls.value.color}', fullWidth: ${controls.value.fullWidth} }}
>
	{#snippet children({ item, index })}
		<section class="space-y-2 p-6">
			<p class="text-neutral/70 text-sm">Panel {index + 1}</p>
			<h3 class="text-xl font-semibold">{item.title}</h3>
			<p class="text-neutral/80">{item.description}</p>
		</section>
	{/snippet}
</Tabs>`}
	>
		<Tabs
			class="min-h-64 w-full"
			items={simpleTabs}
			bind:value={simpleActiveTab}
			placement={controls.value.placement}
			tabbar={{
				size: controls.value.size,
				color: controls.value.color,
				fullWidth: controls.value.fullWidth
			}}
		>
			{#snippet children({ item, index })}
				<section class="space-y-2 p-6">
					<p class="text-neutral/70 text-sm">Panel {index + 1}</p>
					<h3 class="text-xl font-semibold">{item.title}</h3>
					<p class="text-neutral/80">{item.description}</p>
				</section>
			{/snippet}
		</Tabs>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Tabs can use the same item data for labels, icons, and panels.">
			<Tabs items={iconTabs} bind:value={iconActiveTab}>
				{#snippet children({ item })}
					<section class="space-y-4 p-6">
						<div class="flex items-center justify-between gap-3">
							<div>
								<h3 class="text-xl font-semibold">{item.title}</h3>
								<p class="text-neutral/80 mt-1">{item.description}</p>
							</div>
							<Chip color="primary">{item.badge}</Chip>
						</div>
					</section>
				{/snippet}
			</Tabs>
		</ComponentCard>

		<ComponentCard
			description="Control tab navigation programmatically through the snippet payload."
		>
			<Tabs items={programmaticTabs} bind:value={programmaticActiveTab}>
				{#snippet children({ item, index, api })}
					<section class="space-y-4 p-6">
						<div>
							<h3 class="text-xl font-semibold">{item.title}</h3>
							<p class="text-neutral/80 mt-1">{item.description}</p>
						</div>
						<div class="flex gap-2">
							<Button variant="outline" disabled={index === 0} onclick={() => api.previous()}>
								Previous
							</Button>
							<Button disabled={index === programmaticTabs.length - 1} onclick={() => api.next()}>
								Next
							</Button>
							<Button color="success" onclick={() => api.goTo(0)}>Start Over</Button>
						</div>
					</section>
				{/snippet}
			</Tabs>
		</ComponentCard>

		<ComponentCard description="Control where the tabbar appears: top, bottom, left, or right.">
			<div class="grid w-full gap-6">
				<div>
					<p class="text-neutral/70 mb-2 text-sm font-medium">Left placement</p>
					<div class="border-neutral-muted min-h-64 rounded border">
						<Tabs
							items={verticalTabs}
							bind:value={verticalActiveTab}
							placement="left"
							tabbar={{ size: 'small' }}
						>
							{#snippet children({ item })}
								<section class="space-y-2 p-6">
									<h3 class="text-xl font-semibold">{item.title}</h3>
									<p class="text-neutral/80">{item.description}</p>
								</section>
							{/snippet}
						</Tabs>
					</div>
				</div>

				<div>
					<p class="text-neutral/70 mb-2 text-sm font-medium">Bottom placement</p>
					<Tabs items={simpleTabs} placement="bottom">
						{#snippet children({ item })}
							<section class="space-y-2 p-6">
								<h3 class="text-xl font-semibold">{item.title}</h3>
								<p class="text-neutral/80">{item.description}</p>
							</section>
						{/snippet}
					</Tabs>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="The same repeated children convention works for form-like panels.">
			<Tabs
				items={formTabs}
				bind:value={formActiveTab}
				onValueChange={handleTabChange}
				tabbar={{ color: 'secondary' }}
			>
				{#snippet children({ item, index })}
					<section class="space-y-4 p-6">
						<div class="flex items-center justify-between gap-3">
							<h3 class="text-xl font-semibold">{item.title}</h3>
							<Chip color="secondary">{lastChangedTab}</Chip>
						</div>
						{#if index === 0}
							<TextInput label="Full Name" bind:value={formData.name} placeholder="John Doe" />
						{:else if index === 1}
							<TextInput
								label="Email Address"
								bind:value={formData.email}
								placeholder="john@example.com"
							/>
						{:else}
							<div class="bg-neutral-muted flex items-center justify-between rounded-lg p-4">
								<div>
									<div class="font-medium">Email Notifications</div>
									<div class="text-neutral/70 text-sm">Receive updates via email</div>
								</div>
								<input type="checkbox" bind:checked={formData.notifications} class="h-5 w-5" />
							</div>
						{/if}
					</section>
				{/snippet}
			</Tabs>
		</ComponentCard>

		<ComponentCard
			title="Panel mounting"
			description="mount decides when a panel's content exists. lazy (the default) builds a panel the first time it is activated and tears it down when the tab is left, once keeps it afterwards, eager builds all of them up front. Inactive panels are hidden and inert in every mode."
			code={`<Tabs {items} mount="once" tabbar={{ variant: 'pill' }}>
	{#snippet children({ item })}
		<!-- Panel content -->
	{/snippet}
</Tabs>`}
		>
			<Tabs
				class="w-full"
				items={mountTabs}
				bind:value={mountActiveTab}
				mount={mountMode}
				tabbar={{ variant: 'pill' }}
			>
				{#snippet children({ item })}
					<section class="space-y-2 p-6">
						<h3 class="text-xl font-semibold">{item.title}</h3>
						<p class="text-neutral/80">{item.description}</p>
					</section>
				{/snippet}
			</Tabs>
		</ComponentCard>

		<ComponentCard
			description="Customize tabbar size, color, and alignment without changing panel composition."
		>
			<Tabs
				items={[
					{ label: 'Metrics', title: 'Metrics', description: 'Large success tabs centered.' },
					{ label: 'Alerts', title: 'Alerts', description: 'The panel renderer stays unchanged.' }
				]}
				tabbar={{ size: 'large', color: 'success', alignment: 'center' }}
			>
				{#snippet children({ item })}
					<section class="space-y-2 p-6 text-center">
						<div class="text-success mx-auto size-8">
							{@render chartBarIcon({ class: 'size-8' })}
						</div>
						<h3 class="text-xl font-semibold">{item.title}</h3>
						<p class="text-neutral/80">{item.description}</p>
					</section>
				{/snippet}
			</Tabs>
		</ComponentCard>
	{/snippet}
</DocPage>
