<script lang="ts">
	import { tick } from 'svelte';
	import Tour from '$lib/components/Tour/Tour.svelte';
	import { tourTarget } from '$lib/components/Tour/tour.targets.svelte.js';
	import type { TourStep } from '$lib/components/Tour/tour.props.js';
	import Button from '$lib/components/Button/Button.svelte';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'progress',
			type: 'segmented',
			label: 'Progress',
			value: 'count',
			options: ['count', 'dots']
		},
		{
			name: 'missingTarget',
			type: 'segmented',
			label: 'Missing target',
			value: 'skip',
			options: ['skip', 'center', 'stop']
		},
		{ name: 'modal', type: 'switch', label: 'Modal', value: false },
		{ name: 'arrow', type: 'switch', label: 'Arrow', value: true }
	]);

	let usageOpen = $state(false);
	let lastEvent = $state('—');
	const usageSteps: TourStep[] = [
		{
			target: null,
			title: 'Welcome to your workspace',
			description: 'A quick look at the three things you will use every day.'
		},
		{
			target: 'tour-search',
			title: 'Search everything',
			description: 'Projects, people and files, from one field.'
		},
		{
			target: 'tour-create',
			title: 'Create a project',
			description: 'Start from a template or from scratch.',
			position: 'bottom-end'
		},
		{
			// Not on the page: skipped, centred or the end of the tour, as Missing target says.
			target: '#tour-docs-missing',
			title: 'A step whose target is missing',
			description: 'Nothing on the page matches this target.'
		},
		{
			target: 'tour-profile',
			title: 'Your profile',
			description: 'Notifications, language and theme live here.',
			position: 'left'
		}
	];

	// A step inside an open Dialog.
	let dialogOpen = $state(false);
	let dialogTourOpen = $state(false);
	const dialogSteps: TourStep[] = [
		{
			target: '#tour-docs-dialog-name',
			title: 'Name the project',
			description: 'The tour sits above the dialog; the field stays usable through the hole.'
		},
		{
			target: '#tour-docs-dialog-save',
			title: 'Save it',
			description: 'Pressing the tour never dismisses the dialog underneath.'
		}
	];

	// A target that appears once `before` has run.
	let panelShown = $state(false);
	const beforeSteps: TourStep[] = [
		{
			target: '#tour-docs-reveal',
			title: 'Open the panel',
			description: 'The next step opens a panel before it shows.'
		},
		{
			target: '#tour-docs-panel',
			title: 'Loaded on demand',
			description: 'before() ran, the tour waited for this element, then pointed at it.',
			before: async ({ signal }) => {
				await new Promise((resolve) => setTimeout(resolve, 800));
				if (signal.aborted) return;
				panelShown = true;
				await tick();
			}
		}
	];
	let beforeOpen = $state(false);

	// "Now click this".
	let likes = $state(0);
	let advanceOpen = $state(false);
	const advanceSteps: TourStep[] = [
		{
			target: '#tour-docs-like',
			title: 'Try it',
			description: 'Press Like: the tour moves on by itself.',
			advanceOn: 'click'
		},
		{
			target: '#tour-docs-count',
			title: 'Counted',
			description: 'The press reached the button through the spotlight.'
		}
	];

	let introOpen = $state(false);
</script>

<DocPage
	title="Tour"
	subtitle="A guided walkthrough anchored to elements of the page: a spotlight around each target and a popup beside it."
	features={[
		'One SVG backdrop with a rounded hole: the target stays visible and pressable, nothing is lifted',
		'Targets by name ({@attach tourTarget}), selector, element or function; null for a centred step',
		'before() is awaited, then the tour waits for the target (missingTarget: skip, center or stop)',
		'The spotlight glides between steps and follows scrolling, resizing and clipping scrollers',
		{
			label: 'The popup takes focus on each step; focus returns where it was on close',
			test: 'a11y:tour.focus-follows-steps'
		},
		{
			label: 'The step description is added to the target’s aria-describedby while it shows',
			test: 'a11y:tour.describes-target'
		},
		{
			label: 'Escape closes; arrow keys move between steps from the popup or the target',
			test: 'a11y:tour.keyboard'
		},
		{
			label: 'Modal mode makes the rest of the page inert; Tab cycles popup and target',
			test: 'a11y:tour.modal-inert'
		},
		'Opens above an open Dialog without dismissing it; page scroll is never locked'
	]}
>
	<ComponentCard
		{controls}
		code={`<script lang="ts">
	import { Tour, tourTarget, type TourStep } from 'entasis/tour';
	import { Button } from 'entasis/button';

	let open = $state(false);
	const steps: TourStep[] = [
		{ target: null, title: 'Welcome to your workspace', description: '…' },
		{ target: 'tour-search', title: 'Search everything', description: '…' },
		{ target: 'tour-create', title: 'Create a project', description: '…', position: 'bottom-end' },
		{ target: 'tour-profile', title: 'Your profile', description: '…', position: 'left' }
	];
${'</' + 'script>'}

<input aria-label="Search" {@attach tourTarget('tour-search')} />
<Button {@attach tourTarget('tour-create')}>New project</Button>
<button aria-label="Profile" {@attach tourTarget('tour-profile')}>AL</button>
<Button onclick={() => (open = true)}>Start the tour</Button>

<Tour
	{steps}
	bind:open
	size="${controls.value.size}"
	progress="${controls.value.progress}"
	missingTarget="${controls.value.missingTarget}"${controls.value.modal ? '\n\tmodal' : ''}${controls.value.arrow ? '' : '\n\tarrow={false}'}
/>`}
	>
		<div class="flex w-full max-w-xl flex-col gap-6">
			<div
				class="border-neutral-muted flex items-center gap-3 rounded-lg border p-3"
				aria-label="Demo toolbar"
				role="toolbar"
			>
				<input
					{@attach tourTarget('tour-search')}
					class="border-neutral-muted bg-surface h-8 min-w-0 flex-1 rounded-md border px-3 text-sm"
					placeholder="Search…"
					aria-label="Search"
				/>
				<Button size="small" {@attach tourTarget('tour-create')}>New project</Button>
				<button
					{@attach tourTarget('tour-profile')}
					type="button"
					aria-label="Profile"
					class="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-full text-xs font-medium"
				>
					AL
				</button>
			</div>
			<div class="flex flex-col items-center gap-2">
				<Button onclick={() => (usageOpen = true)}>Start the tour</Button>
				<p class="text-neutral/70 text-sm">Last change: {lastEvent}</p>
			</div>
		</div>
		<Tour
			steps={usageSteps}
			bind:open={usageOpen}
			size={controls.value.size}
			progress={controls.value.progress}
			missingTarget={controls.value.missingTarget}
			modal={controls.value.modal}
			arrow={controls.value.arrow}
			targetTimeout={800}
			onOpenChange={(open, details) =>
				(lastEvent = `${open ? 'open' : 'close'}: ${details.reason}`)}
			onStepChange={(details) => (lastEvent = `step ${details.step + 1}: ${details.reason}`)}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Centred intro"
			description="A step with target: null has no spotlight: the popup sits in the middle of the page over the dimmed backdrop. Good for a welcome or a closing message."
			code={`<Tour
	bind:open
	steps={[
		{ target: null, title: 'Welcome aboard', description: 'Three minutes to learn the basics.' },
		{ target: null, title: 'That is it', description: 'Restart the tour from the Help menu.' }
	]}
/>`}
		>
			<Button onclick={() => (introOpen = true)}>Show the intro</Button>
			<Tour
				bind:open={introOpen}
				steps={[
					{
						target: null,
						title: 'Welcome aboard',
						description: 'Three minutes to learn the basics.'
					},
					{
						target: null,
						title: 'That is it',
						description: 'Restart the tour from the Help menu.'
					}
				]}
			/>
		</ComponentCard>

		<ComponentCard
			title="Inside an open Dialog"
			description="The tour opens above the layers already open. The target inside the dialog stays usable through the hole, and pressing the tour never dismisses the dialog."
			code={`<Dialog bind:open={dialogOpen} title="New project" onAfterOpen={() => (tourOpen = true)}>
	<input id="project-name" aria-label="Project name" />
	<Button id="project-save">Save</Button>
</Dialog>

<Tour
	bind:open={tourOpen}
	steps={[
		{ target: '#project-name', title: 'Name the project', description: '…' },
		{ target: '#project-save', title: 'Save it', description: '…' }
	]}
/>`}
		>
			<Button onclick={() => (dialogOpen = true)}>Open the dialog with a tour</Button>
			<Dialog
				bind:open={dialogOpen}
				title="New project"
				description="Give it a name to get started."
				onAfterOpen={() => (dialogTourOpen = true)}
			>
				<div class="flex flex-col gap-3">
					<input
						id="tour-docs-dialog-name"
						aria-label="Project name"
						class="border-neutral-muted bg-surface h-8 rounded-md border px-3 text-sm"
						placeholder="Project name"
					/>
					<div class="flex justify-end">
						<Button id="tour-docs-dialog-save" onclick={() => (dialogOpen = false)}>Save</Button>
					</div>
				</div>
			</Dialog>
			<Tour bind:open={dialogTourOpen} steps={dialogSteps} />
		</ComponentCard>

		<ComponentCard
			title="A target that appears after before()"
			description="A step's before() is awaited (open a menu, navigate, load data), then the tour waits for the target, up to targetTimeout. Meanwhile the popup is aria-busy and carries data-resolving."
			code={`const steps: TourStep[] = [
	{ target: '#reveal', title: 'Open the panel', description: '…' },
	{
		target: '#panel',
		title: 'Loaded on demand',
		before: async ({ signal }) => {
			await loadPanel(signal);
			panelShown = true;
		}
	}
];`}
		>
			<div class="flex flex-col items-center gap-4">
				<div class="flex items-center gap-3">
					<Button
						id="tour-docs-reveal"
						variant="outline"
						onclick={() => (panelShown = !panelShown)}
					>
						{panelShown ? 'Hide' : 'Show'} the panel
					</Button>
					<Button
						onclick={() => {
							panelShown = false;
							beforeOpen = true;
						}}
					>
						Start the tour
					</Button>
				</div>
				{#if panelShown}
					<div
						id="tour-docs-panel"
						class="border-neutral-muted text-neutral/80 rounded-lg border p-4 text-sm"
					>
						A panel that was not on the page when the tour started.
					</div>
				{/if}
			</div>
			<Tour bind:open={beforeOpen} steps={beforeSteps} />
		</ComponentCard>

		<ComponentCard
			title="Now click this"
			description="advanceOn names an event on the target that moves the tour on, so a step can ask for the real action instead of a Next press."
			code={`<Tour
	bind:open
	steps={[
		{ target: '#like', title: 'Try it', description: 'Press Like.', advanceOn: 'click' },
		{ target: '#count', title: 'Counted' }
	]}
/>`}
		>
			<div class="flex items-center gap-4">
				<Button id="tour-docs-like" variant="outline" onclick={() => (likes += 1)}>Like</Button>
				<span id="tour-docs-count" class="text-neutral/80 text-sm tabular-nums">{likes} likes</span>
				<Button onclick={() => (advanceOpen = true)}>Start the tour</Button>
			</div>
			<Tour bind:open={advanceOpen} steps={advanceSteps} />
		</ComponentCard>
	{/snippet}
</DocPage>
