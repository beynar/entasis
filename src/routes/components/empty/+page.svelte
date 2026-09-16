<script lang="ts">
	import { resolve } from '$app/paths';
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import Empty from '$lib/components/Empty/Empty.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import Card from '$lib/components/Card/Card.svelte';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import { magnifyingGlassIcon } from '$lib/components/Icons/magnifyingGlass.js';
	import { trayIcon } from '$lib/components/Icons/tray.js';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'mode',
			type: 'segmented',
			label: 'Mode',
			value: 'normal',
			options: ['normal', 'card']
		},
		{
			name: 'mediaVariant',
			type: 'segmented',
			label: 'Media',
			value: 'icon',
			options: ['default', 'icon']
		},
		{ name: 'bordered', type: 'switch', label: 'Bordered', value: true }
	]);
</script>

<DocPage
	title="Empty"
	subtitle="A placeholder for empty lists, no-results screens, and first-run states."
	component="Empty"
	features={[
		'Media, title, description, action slots',
		'Actions prop renders Button row',
		'Normal or card presentation mode',
		'Sized & bordered layout variants'
	]}
>
	<ComponentCard
		{controls}
		description="Icon media with title, description, and a primary action."
		code={`<Empty
	size="${controls.value.size}"
	mode="${controls.value.mode}"
	bordered={${controls.value.bordered}}
	mediaVariant="${controls.value.mediaVariant}"
	media={folderIcon}
	title="No projects yet"
	description="You haven't created any projects yet. Get started by creating your first project."
>
	{#snippet content()}
		<Button size="small">Create project</Button>
	{/snippet}
</Empty>`}
	>
		<Empty
			size={controls.value.size}
			mode={controls.value.mode}
			bordered={controls.value.bordered}
			mediaVariant={controls.value.mediaVariant}
			media={folderIcon}
			title="No projects yet"
			description="You haven't created any projects yet. Get started by creating your first project."
		>
			{#snippet content()}
				<Button size="small">Create project</Button>
			{/snippet}
		</Empty>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Icon media with title, description, actions, and a note slot.">
			<Empty
				bordered
				mediaVariant="icon"
				media={folderIcon}
				title="No projects yet"
				description="You haven't created any projects yet. Get started by creating your first project."
			>
				{#snippet content()}
					<div class="flex items-center gap-2">
						<Button size="small">Create project</Button>
						<Button size="small" variant="outline" color="neutral">Import project</Button>
					</div>
				{/snippet}
				{#snippet note()}
					Need help? <a href={resolve('/components/empty')}>Contact support</a>
				{/snippet}
			</Empty>
		</ComponentCard>

		<ComponentCard description="Default media variant with a custom media snippet.">
			<Empty
				title="No results found"
				description="Try adjusting your search filters or check the spelling of your query."
			>
				{#snippet media()}
					{@render magnifyingGlassIcon({ class: 'text-neutral/70 size-10' })}
				{/snippet}
				{#snippet content()}
					<Button size="small" variant="ghost">Clear filters</Button>
				{/snippet}
			</Empty>
		</ComponentCard>

		<ComponentCard description="Empty state nested inside a Card component.">
			<Card class="w-full max-w-md" title="Inbox">
				<Empty
					size="small"
					mediaVariant="icon"
					media={trayIcon}
					title="Your inbox is empty"
					description="Notifications about your account and projects will show up here."
				>
					{#snippet content()}
						<Button size="small" variant="outline" color="neutral">Refresh</Button>
					{/snippet}
				</Empty>
			</Card>
		</ComponentCard>

		<ComponentCard
			description="Buttons rendered from an array of Button props via the actions prop."
		>
			<Empty
				bordered
				class="max-w-md"
				mediaVariant="icon"
				media={folderIcon}
				title="No projects yet"
				description="Buttons rendered from an array of Button props."
				actions={[
					{ content: 'Create project', size: 'small' },
					{ content: 'Import', size: 'small', variant: 'outline', color: 'neutral' }
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Card mode renders the empty state on a raised surface.">
			<Empty
				mode="card"
				class="max-w-md"
				mediaVariant="icon"
				media={folderIcon}
				title="No projects yet"
				description="Create your first project to get started."
			>
				{#snippet content()}
					<Button size="small">Create project</Button>
				{/snippet}
			</Empty>
		</ComponentCard>

		<ComponentCard description="Small, normal, and large size variants side by side.">
			<div class="flex w-full items-start gap-4">
				<Empty
					bordered
					size="small"
					mediaVariant="icon"
					media={trayIcon}
					title="Small size"
					description="Compact paddings and typography."
				/>
				<Empty
					bordered
					size="normal"
					mediaVariant="icon"
					media={trayIcon}
					title="Normal size"
					description="The nova reference values."
				/>
				<Empty
					bordered
					size="large"
					mediaVariant="icon"
					media={trayIcon}
					title="Large size"
					description="Scaled up paddings, media, and typography."
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Footer slot and fully custom children composition.">
			<Empty
				bordered
				mediaVariant="icon"
				media={folderIcon}
				title="No deployments"
				description="Your latest deployments will appear here once you ship."
			>
				{#snippet content()}
					<Button size="small">Deploy now</Button>
				{/snippet}
				{#snippet footer()}
					<a
						class="text-neutral/70 hover:text-primary-readable text-xs underline underline-offset-4"
						href={resolve('/docs')}
					>
						Learn more about deployments
					</a>
				{/snippet}
			</Empty>
			<Empty bordered>
				<div class="text-neutral/70 flex flex-col items-center gap-2 text-sm">
					{@render magnifyingGlassIcon({ class: 'size-8' })}
					<p>Fully custom composition via <code class="text-neutral">children</code>.</p>
				</div>
			</Empty>
		</ComponentCard>
	{/snippet}
</DocPage>
