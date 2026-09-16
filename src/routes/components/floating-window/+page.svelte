<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import Chip from '$lib/components/Chip/Chip.svelte';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import FloatingWindow from '$lib/components/FloatingWindow/FloatingWindow.svelte';
	import type { FloatingWindowDockPlacement } from '$lib/components/FloatingWindow/floatingWindow.props.js';
	import { terminalWindowIcon } from '$lib/components/Icons/terminalWindow.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const dockPlacements: FloatingWindowDockPlacement[] = [
		'bottom-left',
		'bottom-right',
		'top-left',
		'top-right',
		'left-top',
		'left-bottom',
		'right-top',
		'right-bottom'
	];
	const controls = createComponentControls([
		{
			name: 'dragFrom',
			type: 'segmented',
			label: 'Drag',
			value: 'header',
			options: ['header', 'window']
		},
		{
			name: 'dockPlacement',
			type: 'segmented',
			label: 'Dock',
			value: 'bottom-left',
			options: dockPlacements
		},
		{ name: 'draggable', type: 'switch', label: 'Draggable', value: true },
		{ name: 'resizable', type: 'switch', label: 'Resizable', value: true },
		{ name: 'minimizable', type: 'switch', label: 'Minimize', value: true },
		{ name: 'closable', type: 'switch', label: 'Close', value: true }
	]);

	let notesOpen = $state(false);
	let notesMinimized = $state(false);
	let inboxOpen = $state(false);
	let inboxMinimized = $state(false);
	let activityOpen = $state(false);
	let activityMinimized = $state(false);
	let inspectorOpen = $state(false);
	let placementOpen = $state(false);
	let placementMinimized = $state(false);
	let activeDockPlacement = $state<FloatingWindowDockPlacement>('bottom-left');
	let layeringWindowOpen = $state(false);
	let layeringDialogOpen = $state(false);

	const openNotes = () => {
		notesOpen = true;
		notesMinimized = false;
	};

	const openDockExample = () => {
		inboxOpen = true;
		inboxMinimized = false;
		activityOpen = true;
		activityMinimized = false;
	};

	const openPlacementExample = (placement: FloatingWindowDockPlacement) => {
		activeDockPlacement = placement;
		placementOpen = true;
		placementMinimized = true;
	};

	const openLayeringExample = () => {
		layeringWindowOpen = true;
		layeringDialogOpen = true;
	};
</script>

{#snippet inspectorTitle()}
	<span class="flex min-w-0 items-center gap-2">
		<span class="text-primary-readable shrink-0">{@render terminalWindowIcon({ size: 17 })}</span>
		<span class="truncate">Build inspector</span>
	</span>
{/snippet}

<DocPage
	title="Floating window"
	subtitle="Crossfading utility windows with viewport-safe dragging, resizing, and a compact minimized dock."
	component="FloatingWindow"
	features={[
		'Non-modal portaled surface',
		'Header or whole-window dragging',
		'Pointer resizing from edges and corners',
		'Viewport-safe geometry',
		'Crossfaded minimize and restore transitions',
		'Theme-scoped z-order and configurable edge docks',
		'Dialog-safe layer ordering',
		{ label: 'Topmost Escape dismissal', test: 'a11y:floating-window.escape' },
		'Bindable position, dimensions, and visibility'
	]}
>
	<ComponentCard
		{controls}
		description="Open a utility window that remains interactive alongside the page. Drag the title bar, resize from any edge or corner, then minimize it into the compact edge dock."
		code={`<FloatingWindow
	bind:open
	bind:minimized
	title="Project notes"
	dragFrom="${controls.value.dragFrom}"
	dockPlacement="${controls.value.dockPlacement}"
	draggable={${controls.value.draggable}}
	resizable={${controls.value.resizable}}
	minimizable={${controls.value.minimizable}}
	closable={${controls.value.closable}}
>
	<p>Review the release checklist before publishing.</p>
</FloatingWindow>`}
	>
		<div class="grid max-w-md justify-items-center gap-3 text-center">
			<div>
				<p class="font-medium">Project notes</p>
				<p class="text-neutral/70 mt-1 text-sm">A focused utility window without modal blocking.</p>
			</div>
			<Button onclick={openNotes}>Open project notes</Button>
		</div>

		<FloatingWindow
			bind:open={notesOpen}
			bind:minimized={notesMinimized}
			title="Project notes"
			dragFrom={controls.value.dragFrom}
			dockPlacement={controls.value.dockPlacement}
			draggable={controls.value.draggable}
			resizable={controls.value.resizable}
			minimizable={controls.value.minimizable}
			closable={controls.value.closable}
		>
			<div class="grid gap-4">
				<p class="text-neutral/70 text-sm">
					Review the release checklist before publishing the new component package.
				</p>
				<ul class="grid gap-2 text-sm">
					<li class="border-neutral-muted flex items-center justify-between border-b pb-2">
						<span>API review</span>
						<Chip size="small" color="success" variant="soft">Complete</Chip>
					</li>
					<li class="border-neutral-muted flex items-center justify-between border-b pb-2">
						<span>Visual QA</span>
						<Chip size="small" color="warning" variant="soft">In progress</Chip>
					</li>
					<li class="flex items-center justify-between">
						<span>Release notes</span>
						<Chip size="small" color="neutral" variant="soft">Pending</Chip>
					</li>
				</ul>
			</div>
		</FloatingWindow>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Dialog layering"
			description="Floating windows remain mounted beneath modal dialogs. Closing the dialog returns to the window without resetting its position or content."
			code={`<FloatingWindow bind:open={windowOpen} title="Research notes">
	Window content
</FloatingWindow>

<Dialog bind:open={dialogOpen} title="Confirm publish">
	Dialog content
</Dialog>`}
		>
			<Button variant="outline" onclick={openLayeringExample}>Open window and dialog</Button>

			<FloatingWindow
				bind:open={layeringWindowOpen}
				title="Research notes"
				position={{ x: 96, y: 132 }}
				dimensions={{ width: 390, height: 240 }}
			>
				<p class="text-neutral/70 text-sm">
					This non-modal window stays mounted beneath the modal layer.
				</p>
			</FloatingWindow>

			<Dialog bind:open={layeringDialogOpen} title="Confirm publish">
				<div class="grid gap-4">
					<p class="text-neutral/70 text-sm">
						The dialog and its backdrop always render above every floating window in this Theme.
					</p>
					<div class="flex justify-end gap-2">
						<Button variant="ghost" onclick={() => (layeringDialogOpen = false)}>Cancel</Button>
						<Button onclick={() => (layeringDialogOpen = false)}>Confirm</Button>
					</div>
				</div>
			</Dialog>
		</ComponentCard>

		<ComponentCard
			title="Coordinated dock"
			description="Instances sharing a placement stack together without affecting docks on other edges. Bottom and top docks remain horizontally draggable."
			code={`<FloatingWindow bind:open={inboxOpen} bind:minimized={inboxMinimized} title="Inbox">
	Inbox content
</FloatingWindow>

<FloatingWindow bind:open={activityOpen} bind:minimized={activityMinimized} title="Activity">
	Activity content
</FloatingWindow>`}
		>
			<div class="grid justify-items-center gap-3 text-center">
				<p class="text-neutral/70 max-w-lg text-sm">
					Open both windows, minimize them, then drag a title horizontally or restore either window.
				</p>
				<Button variant="outline" onclick={openDockExample}>Open both windows</Button>
			</div>

			<FloatingWindow
				bind:open={inboxOpen}
				bind:minimized={inboxMinimized}
				title="Inbox"
				position={{ x: 72, y: 120 }}
				dimensions={{ width: 380, height: 250 }}
			>
				<div class="grid gap-3 text-sm">
					<div class="border-neutral-muted rounded-lg border p-3">
						<p class="font-medium">Design review</p>
						<p class="text-neutral/70 mt-1">Three new comments on the floating window API.</p>
					</div>
					<div class="border-neutral-muted rounded-lg border p-3">
						<p class="font-medium">Release checklist</p>
						<p class="text-neutral/70 mt-1">Visual QA is ready for review.</p>
					</div>
				</div>
			</FloatingWindow>

			<FloatingWindow
				bind:open={activityOpen}
				bind:minimized={activityMinimized}
				title="Activity"
				position={{ x: 480, y: 180 }}
				dimensions={{ width: 360, height: 230 }}
			>
				<div class="grid gap-3 text-sm">
					<p><strong>10:42</strong> Component examples updated</p>
					<p><strong>10:18</strong> Theme diagnostics passed</p>
					<p><strong>09:55</strong> Resize behavior reviewed</p>
				</div>
			</FloatingWindow>
		</ComponentCard>

		<ComponentCard
			title="Dock placement"
			description="Choose the default edge and stacking origin. Lateral docks switch to a vertical title bar and drag along the vertical axis."
			code={`<FloatingWindow
	bind:open
	bind:minimized
	dockPlacement="right-top"
	title="Inspector"
	dimensions={{ width: 360, height: 220, min: [280, 160], max: [720, 520] }}
>
	Inspector content
</FloatingWindow>`}
		>
			<div class="grid justify-items-center gap-4 text-center">
				<p class="text-neutral/70 max-w-xl text-sm">
					Open a minimized window at any edge placement, then restore and minimize it to check the
					crossfade path.
				</p>
				<div class="flex max-w-2xl flex-wrap justify-center gap-2">
					{#each dockPlacements as placement, index (index)}
						<Button size="small" variant="outline" onclick={() => openPlacementExample(placement)}>
							{placement}
						</Button>
					{/each}
				</div>
			</div>

			<FloatingWindow
				bind:open={placementOpen}
				bind:minimized={placementMinimized}
				dockPlacement={activeDockPlacement}
				title={`Dock: ${activeDockPlacement}`}
				dimensions={{ width: 360, height: 220, min: [280, 160], max: [720, 520] }}
			>
				<p class="text-neutral/70 text-sm">
					This window returns to <strong>{activeDockPlacement}</strong> when minimized.
				</p>
			</FloatingWindow>
		</ComponentCard>

		<ComponentCard
			title="Whole-window dragging"
			description="Set dragFrom to window when the entire quiet surface should act as the drag target. Native controls and marked no-drag regions remain interactive."
			code={`<FloatingWindow
	bind:open
	dragFrom="window"
	title={customTitle}
>
	<div data-floating-window-no-drag>
		Selectable content that does not begin a drag.
	</div>
</FloatingWindow>`}
		>
			<Button variant="outline" onclick={() => (inspectorOpen = true)}>Open build inspector</Button>

			<FloatingWindow
				bind:open={inspectorOpen}
				dragFrom="window"
				title={inspectorTitle}
				dimensions={{ width: 420, height: 280 }}
			>
				<div data-floating-window-no-drag class="grid gap-4">
					<div class="grid grid-cols-2 gap-3 text-sm">
						<div class="bg-surface-recessed rounded-lg p-3">
							<p class="text-neutral/70 text-xs">Bundle</p>
							<p class="mt-1 font-medium">42.8 kB</p>
						</div>
						<div class="bg-surface-recessed rounded-lg p-3">
							<p class="text-neutral/70 text-xs">Modules</p>
							<p class="mt-1 font-medium">18</p>
						</div>
					</div>
					<p class="text-neutral/65 text-sm select-text">
						This region keeps text selection even when the rest of the surface starts a drag.
					</p>
				</div>
			</FloatingWindow>
		</ComponentCard>
	{/snippet}
</DocPage>
