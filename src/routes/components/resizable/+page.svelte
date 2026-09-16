<script lang="ts">
	import Chip from '$lib/components/Chip/Chip.svelte';
	import { Switch } from '$lib/components/Form/Switch/index.js';
	import { Resizable } from '$lib/components/Resizable/index.js';
	import type { ResizableHandleAriaLabel } from '$lib/components/Resizable/index.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const resizableOrientations = ['horizontal', 'vertical'] as const;
	const resizableVariants = ['default', 'splitted'] as const;
	const controls = createComponentControls([
		{
			name: 'orientation',
			type: 'segmented',
			label: 'Orientation',
			value: 'horizontal',
			options: resizableOrientations
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'default',
			options: resizableVariants
		}
	]);

	let workspaceSizes = $state<number[]>();
	let verticalSizes = $state<number[]>();
	let constrainedSizes = $state<number[]>();
	let collapsibleSizes = $state<number[]>();
	let collapsedPanelIds = $state<string[]>([]);
	let splitExampleIsSplitted = $state(true);
	let splitExampleShowLines = $state(false);
	let splitExampleWithHandle = $state(false);
	let splitExampleUseThumbHandle = $state(false);
	let lastResize = $state('No committed resize yet');

	const formatSizes = (sizes?: number[]) =>
		sizes?.map((size) => `${Math.round(size)}%`).join(' / ') ?? 'auto';

	const getWorkspaceHandleLabel = (handle: ResizableHandleAriaLabel) =>
		handle.index === 0 ? 'Resize file tree and editor' : 'Resize editor and inspector';

	const updateLastResize = (sizes: number[]) => {
		lastResize = formatSizes(sizes);
	};

	const formatCollapsedPanels = (panelIds: string[]) =>
		panelIds.length > 0 ? panelIds.join(' / ') : 'No collapsed panels';
</script>

{#snippet workspaceExplorer()}
	<div class="flex h-full flex-col">
		<div class="border-neutral-muted text-neutral/70 border-b px-4 py-3 text-xs font-medium">
			Explorer
		</div>
		<div class="space-y-1.5 p-4 text-sm">
			<div class="text-neutral bg-primary/10 rounded px-2 py-1.5">src</div>
			<div class="text-neutral/70 px-2 py-1">components</div>
			<div class="text-neutral/70 px-2 py-1">routes</div>
			<div class="text-neutral/70 px-2 py-1">lib</div>
		</div>
	</div>
{/snippet}

{#snippet workspaceEditor()}
	<div class="flex h-full flex-col">
		<div class="border-neutral-muted flex items-center justify-between border-b px-4 py-3">
			<span class="text-sm font-medium">Resizable.svelte</span>
			<span class="text-neutral/70 text-xs">edited</span>
		</div>
		<div class="text-neutral/70 grid flex-1 content-center gap-2 p-6 font-mono text-xs">
			<div class="bg-primary/20 h-2 w-10/12 rounded"></div>
			<div class="bg-neutral/20 h-2 w-8/12 rounded"></div>
			<div class="bg-neutral/15 h-2 w-11/12 rounded"></div>
			<div class="bg-primary/25 h-2 w-7/12 rounded"></div>
		</div>
	</div>
{/snippet}

{#snippet workspaceInspector()}
	<div class="flex h-full flex-col">
		<div class="border-neutral-muted text-neutral/70 border-b px-4 py-3 text-xs font-medium">
			Inspector
		</div>
		<div class="grid gap-4 p-4 text-sm">
			<div>
				<div class="text-neutral/70 text-xs">Layout</div>
				<div class="font-medium">3 panels</div>
			</div>
			<div>
				<div class="text-neutral/70 text-xs">Sizes</div>
				<div class="font-medium">{formatSizes(workspaceSizes)}</div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet verticalHeader()}
	<div class="flex h-full items-center justify-between px-4">
		<div>
			<div class="text-sm font-medium">Preview</div>
			<div class="text-neutral/70 text-xs">Vertical panel group</div>
		</div>
		<Chip color="neutral" variant="soft">{formatSizes(verticalSizes)}</Chip>
	</div>
{/snippet}

{#snippet verticalCanvas()}
	<div class="grid h-full place-items-center p-5">
		<div class="grid w-full max-w-md gap-2">
			<div class="bg-primary/15 h-16 rounded"></div>
			<div class="grid grid-cols-3 gap-2">
				<div class="bg-neutral/10 h-12 rounded"></div>
				<div class="bg-neutral/10 h-12 rounded"></div>
				<div class="bg-neutral/10 h-12 rounded"></div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet verticalConsole()}
	<div class="text-neutral/70 grid h-full content-start gap-1 p-4 font-mono text-xs">
		<div>$ svelte-check</div>
		<div>Watching component contracts...</div>
		<div class="text-success">No Resizable route errors</div>
	</div>
{/snippet}

{#snippet rtlList()}
	<div class="h-full p-4 text-right">
		<div class="text-sm font-medium">Inbox</div>
		<div class="text-neutral/70 mt-3 grid gap-2 text-sm">
			<div>Q3 planning</div>
			<div>Design review</div>
			<div>Release notes</div>
		</div>
	</div>
{/snippet}

{#snippet rtlDetail()}
	<div class="grid h-full content-center gap-2 p-5 text-right">
		<div class="text-lg font-semibold">Right-to-left resize</div>
		<p class="text-neutral/70 text-sm">
			Horizontal pointer and arrow-key deltas mirror when dir is rtl.
		</p>
	</div>
{/snippet}

{#snippet constrainedNav()}
	<div class="h-full p-4">
		<div class="text-sm font-medium">Locked navigation</div>
		<p class="text-neutral/70 mt-2 text-xs">This panel keeps a 20 to 32 percent range.</p>
	</div>
{/snippet}

{#snippet constrainedMain()}
	<div class="grid h-full place-items-center p-4">
		<div class="text-center">
			<div class="text-sm font-medium">Flexible workspace</div>
			<div class="text-neutral/70 mt-1 text-xs">{formatSizes(constrainedSizes)}</div>
		</div>
	</div>
{/snippet}

{#snippet constrainedDisabled()}
	<div class="h-full p-4">
		<div class="text-sm font-medium">Detail panel</div>
		<p class="text-neutral/70 mt-2 text-xs">The adjacent separator is disabled.</p>
	</div>
{/snippet}

{#snippet nestedRightGroup()}
	<Resizable
		orientation="vertical"
		class="h-full"
		handle
		panels={[
			{
				id: 'nested-preview',
				defaultSize: 54,
				minSize: 36,
				content: verticalCanvas
			},
			{
				id: 'nested-console',
				defaultSize: 46,
				minSize: 24,
				content: verticalConsole
			}
		]}
	/>
{/snippet}

<DocPage
	title="Resizable"
	subtitle="Accessible split-pane layouts with pointer, keyboard, vertical, RTL, and controlled sizing."
	component="Resizable"
	features={[
		'Bindable percent sizes',
		{ label: 'Pointer and keyboard resize', test: 'a11y:resizable.keyboard' },
		'Horizontal, vertical, and RTL groups',
		'Default and splitted variants',
		'Opt-in collapsible panels with bindable collapsed ids',
		'Panel min, max, and disabled handle constraints'
	]}
>
	<ComponentCard
		{controls}
		description="A controlled editor layout with persisted sizes, visible handles, and accessible separator labels."
		code={`<Resizable
	bind:sizes={workspaceSizes}
	storageKey="svelai-resizable-workspace-demo"
	orientation="${controls.value.orientation}"
	variant="${controls.value.variant}"
	class="h-80 rounded-lg border border-neutral-muted"
	handle
	panels={[
		{ id: 'explorer', defaultSize: 24, minSize: 16, maxSize: 35, content: explorerPanel },
		{ id: 'editor', defaultSize: 52, minSize: 30, content: editorPanel },
		{ id: 'inspector', defaultSize: 24, minSize: 18, maxSize: 36, content: inspectorPanel }
	]}
/>`}
	>
		<div class="grid w-full gap-4">
			<Resizable
				bind:sizes={workspaceSizes}
				storageKey="svelai-resizable-workspace-demo"
				orientation={controls.value.orientation}
				variant={controls.value.variant}
				class={controls.value.variant === 'splitted'
					? 'h-80'
					: 'border-neutral-muted bg-surface h-80 rounded-lg border'}
				handle
				getHandleAriaLabel={getWorkspaceHandleLabel}
				onResize={updateLastResize}
				panels={[
					{
						id: 'workspace-explorer',
						defaultSize: 24,
						minSize: 16,
						maxSize: 35,
						content: workspaceExplorer
					},
					{
						id: 'workspace-editor',
						defaultSize: 52,
						minSize: 30,
						content: workspaceEditor
					},
					{
						id: 'workspace-inspector',
						defaultSize: 24,
						minSize: 18,
						maxSize: 36,
						content: workspaceInspector
					}
				]}
			/>
			<div class="flex flex-wrap items-center justify-center gap-2">
				<Chip color="neutral" variant="soft">{formatSizes(workspaceSizes)}</Chip>
				<Chip color="neutral" variant="soft">{lastResize}</Chip>
			</div>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="The splitted variant separates panels as rounded surfaces; showLines can hide the separator stroke while keeping resize rails active."
		>
			<div class="grid w-full gap-4">
				<div class="flex flex-wrap items-center gap-6">
					<Switch label="Splitted" bind:value={splitExampleIsSplitted} size="small" />
					<Switch label="Lines" bind:value={splitExampleShowLines} size="small" />
					<Switch label="Handles" bind:value={splitExampleWithHandle} size="small" />
					<Switch
						label="Thumb"
						bind:value={splitExampleUseThumbHandle}
						disabled={!splitExampleWithHandle}
						size="small"
					/>
				</div>
				<Resizable
					variant={splitExampleIsSplitted ? 'splitted' : 'default'}
					showLines={splitExampleShowLines}
					handle={splitExampleWithHandle}
					handleVariant={splitExampleUseThumbHandle ? 'thumb' : 'grip'}
					class={splitExampleIsSplitted
						? 'h-80'
						: 'border-neutral-muted bg-surface h-80 rounded-lg border'}
					panels={[
						{
							id: 'split-explorer',
							defaultSize: 24,
							minSize: 16,
							maxSize: 35,
							content: workspaceExplorer
						},
						{
							id: 'split-editor',
							defaultSize: 52,
							minSize: 30,
							content: workspaceEditor
						},
						{
							id: 'split-inspector',
							defaultSize: 24,
							minSize: 18,
							maxSize: 36,
							content: workspaceInspector
						}
					]}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Panels collapse only when their item opts in; collapsedSize can be a percent or px value, and collapsed ids can persist."
		>
			<div class="grid w-full gap-4">
				<Resizable
					bind:sizes={collapsibleSizes}
					bind:collapsedPanels={collapsedPanelIds}
					storageKey="svelai-resizable-collapsible-demo"
					class="border-neutral-muted bg-surface h-72 rounded-lg border"
					handle
					panels={[
						{
							id: 'collapsible-nav',
							defaultSize: 26,
							minSize: 18,
							maxSize: 40,
							collapsible: true,
							collapsedSize: '56px',
							collapseBreakpoint: 20,
							content: workspaceExplorer
						},
						{
							id: 'collapsible-editor',
							defaultSize: 52,
							minSize: 32,
							content: workspaceEditor
						},
						{
							id: 'collapsible-inspector',
							defaultSize: 22,
							minSize: 16,
							maxSize: 34,
							collapsible: true,
							collapsedSize: 8,
							collapseBreakpoint: 18,
							content: workspaceInspector
						}
					]}
				/>
				<div class="flex flex-wrap items-center justify-center gap-2">
					<Chip color="neutral" variant="soft">{formatSizes(collapsibleSizes)}</Chip>
					<Chip color="neutral" variant="soft">{formatCollapsedPanels(collapsedPanelIds)}</Chip>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Groups can be nested by rendering a Resizable inside a panel snippet."
		>
			<Resizable
				class="border-neutral-muted bg-surface h-80 rounded-lg border"
				handle
				panels={[
					{
						id: 'nested-sidebar',
						defaultSize: 34,
						minSize: 24,
						maxSize: 48,
						content: workspaceExplorer
					},
					{
						id: 'nested-right-group',
						defaultSize: 66,
						minSize: 42,
						content: nestedRightGroup
					}
				]}
			/>
		</ComponentCard>

		<ComponentCard
			description="Vertical orientation uses the same panel model and row-resize handles."
		>
			<Resizable
				bind:sizes={verticalSizes}
				orientation="vertical"
				class="border-neutral-muted bg-surface h-96 rounded-lg border"
				handle
				panels={[
					{
						id: 'vertical-header',
						defaultSize: 18,
						minSize: 14,
						maxSize: 28,
						content: verticalHeader
					},
					{
						id: 'vertical-canvas',
						defaultSize: 58,
						minSize: 36,
						content: verticalCanvas
					},
					{
						id: 'vertical-console',
						defaultSize: 24,
						minSize: 16,
						maxSize: 36,
						content: verticalConsole
					}
				]}
			/>
		</ComponentCard>

		<ComponentCard description="RTL mirrors horizontal drag deltas and arrow-key behavior.">
			<Resizable
				dir="rtl"
				class="border-neutral-muted bg-surface h-72 rounded-lg border"
				handle
				panels={[
					{
						id: 'rtl-list',
						defaultSize: 34,
						minSize: 24,
						maxSize: 48,
						content: rtlList
					},
					{
						id: 'rtl-detail',
						defaultSize: 66,
						minSize: 42,
						content: rtlDetail
					}
				]}
			/>
		</ComponentCard>

		<ComponentCard description="Panel constraints clamp pointer and keyboard movement.">
			<Resizable
				bind:sizes={constrainedSizes}
				class="border-neutral-muted bg-surface h-72 rounded-lg border"
				handle
				disabledHandles={[1]}
				keyboardStep={5}
				panels={[
					{
						id: 'constrained-nav',
						defaultSize: 24,
						minSize: 20,
						maxSize: 32,
						content: constrainedNav
					},
					{
						id: 'constrained-main',
						defaultSize: 52,
						minSize: 36,
						content: constrainedMain
					},
					{
						id: 'constrained-detail',
						defaultSize: 24,
						minSize: 18,
						maxSize: 30,
						content: constrainedDisabled
					}
				]}
			/>
		</ComponentCard>
	{/snippet}
</DocPage>
