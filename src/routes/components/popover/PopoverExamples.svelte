<script lang="ts">
	import type { Placement } from '@floating-ui/dom';

	import Button from '$lib/components/Button/Button.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import type { MenuItem } from '$lib/components/Menu/menu.props.js';
	import { copyIcon } from '$lib/components/Icons/copy.js';
	import { downloadIcon } from '$lib/components/Icons/download.js';
	import { envelopeIcon } from '$lib/components/Icons/envelope.js';
	import { exportIcon } from '$lib/components/Icons/export.js';
	import { gearSixIcon } from '$lib/components/Icons/gearSix.js';
	import { shareIcon } from '$lib/components/Icons/share.js';
	import ComponentCard from '../../ComponentCard.svelte';

	const text =
		'Use popovers for compact actions, controls, and supporting context that should stay anchored to a trigger.';

	const placementExamples = [
		{ position: 'top', label: 'Top' },
		{ position: 'right', label: 'Right' },
		{ position: 'bottom', label: 'Bottom' },
		{ position: 'left', label: 'Left' },
		{ position: 'bottom-start', label: 'Bottom start' },
		{ position: 'bottom-end', label: 'Bottom end' }
	] satisfies Array<{ position: Placement; label: string }>;

	let externalAnchor = $state<HTMLButtonElement | null>(null);
	let externalOpen = $state(false);

	const mobileSheetMenuItems = [
		{
			type: 'option',
			title: 'Overview',
			description: 'Compact root action'
		},
		{
			type: 'submenu',
			prefix: shareIcon,
			title: 'Share',
			description: 'Inline submenu on mobile',
			menu: [
				{ type: 'option', title: 'Copy link', prefix: copyIcon },
				{ type: 'option', title: 'Send by email', prefix: envelopeIcon },
				{
					type: 'submenu',
					title: 'Advanced sharing',
					description: 'Another level with a taller panel',
					menu: [
						{ type: 'option', title: 'Create public link' },
						{ type: 'option', title: 'Invite collaborators' },
						{ type: 'option', title: 'Restrict to workspace' },
						{ type: 'option', title: 'Require approval' },
						{ type: 'option', title: 'Copy embed code', prefix: copyIcon }
					]
				}
			]
		},
		{
			type: 'submenu',
			prefix: exportIcon,
			title: 'Export',
			description: 'Taller submenu to test sheet resizing',
			menu: [
				{ type: 'option', title: 'Export PDF', prefix: downloadIcon },
				{ type: 'option', title: 'Export CSV', prefix: downloadIcon },
				{ type: 'option', title: 'Export JSON', prefix: downloadIcon },
				{ type: 'option', title: 'Schedule export' },
				{ type: 'option', title: 'Send to integration' },
				{ type: 'option', title: 'Download archive' }
			]
		},
		{ type: 'separator' },
		{
			type: 'option',
			prefix: gearSixIcon,
			title: 'Settings',
			description: 'Leaf item closes the menu'
		}
	] satisfies MenuItem[];
</script>

{#snippet content(title: string, description = text)}
	<div class="grid gap-2">
		<h2 class="text-neutral text-base font-semibold">{title}</h2>
		<p class="text-neutral/70 text-sm">{description}</p>
	</div>
{/snippet}

<ComponentCard
	title="Placement"
	description="Choose the preferred side or aligned edge. Floating UI flips the panel when there is not enough room."
	class="!min-h-fit"
	code={`<Popover position="top" trigger={{ content: 'Top', variant: 'soft' }}>
	<div>Top placement</div>
</Popover>

<Popover position="bottom-end" trigger={{ content: 'Bottom end', variant: 'soft' }}>
	<div>Bottom-end placement</div>
</Popover>`}
>
	<div class="flex w-full max-w-3xl flex-wrap items-center justify-center gap-3">
		{#each placementExamples as example (example.position)}
			<Popover
				position={example.position}
				trigger={{
					content: example.label,
					variant: 'soft'
				}}
			>
				{@render content(`${example.label} placement`)}
			</Popover>
		{/each}
	</div>
</ComponentCard>

<ComponentCard
	title="Interaction"
	description="Use the same primitive for click toggles, hover previews, and strict dismissal behavior."
	class="!min-h-fit"
	code={`<Popover trigger={{ content: 'Click' }} position="bottom">
	<div>Click toggled content</div>
</Popover>

<Popover
	openOnHover
	openOnClick={false}
	closeOnMouseLeave
	delay={150}
	trigger={{ content: 'Hover', variant: 'soft' }}
	position="top"
>
	<div>Hover preview content</div>
</Popover>`}
>
	<div class="flex w-full max-w-2xl flex-wrap items-center justify-center gap-3">
		<Popover trigger={{ content: 'Click' }} position="bottom">
			{@render content('Click toggled', 'Click the trigger again or click outside to close.')}
		</Popover>
		<Popover
			openOnHover
			openOnClick={false}
			closeOnMouseLeave
			delay={150}
			trigger={{ content: 'Hover', color: 'secondary', variant: 'soft' }}
			position="top"
		>
			{@render content('Hover preview', 'The safe area keeps this open while moving into it.')}
		</Popover>
		<Popover
			closeOnEscape
			closeOnClickOutside
			trigger={{ content: 'Escape / outside', color: 'neutral', variant: 'outline' }}
			position="bottom-end"
		>
			{@render content('Dismissible', 'Escape and outside clicks close the active popover.')}
		</Popover>
	</div>
</ComponentCard>

<ComponentCard
	title="Custom trigger and external anchor"
	description="Render your own trigger snippet or position the popover from a separate element reference."
	class="!min-h-fit"
	code={`<script lang="ts">
	let anchor = $state<HTMLButtonElement | null>(null);
	let open = $state(false);
${'</' + 'script>'}

<Popover position="bottom-start">
	{#snippet trigger(popover)}
		<Button {@attach popover.reference} onclick={() => popover.toggle()}>
			Custom trigger
		</Button>
	{/snippet}

	<div>Custom trigger content</div>
</Popover>

<Button bind:ref={anchor} onclick={() => (open = !open)}>
	External anchor
</Button>
<Popover trigger={false} bind:open ref={anchor} position="right">
	<div>Anchored content</div>
</Popover>`}
>
	<div class="grid w-full max-w-xl gap-4 sm:grid-cols-2">
		<Popover position="bottom-start" fitTrigger>
			{#snippet trigger(popover)}
				<Button
					fullWidth
					variant="outline"
					color="neutral"
					{@attach popover.reference}
					onclick={() => popover.toggle()}
				>
					Custom trigger
				</Button>
			{/snippet}
			{@render content('Custom trigger', 'The trigger owns its markup and attaches the reference.')}
		</Popover>

		<div class="flex flex-col gap-3">
			<Button
				bind:ref={externalAnchor}
				variant="soft"
				color="secondary"
				onclick={() => (externalOpen = !externalOpen)}
			>
				External anchor
			</Button>
			<Popover trigger={false} bind:open={externalOpen} ref={externalAnchor} position="right">
				{@render content('External reference', 'The panel is positioned from a bound element.')}
			</Popover>
		</div>
	</div>
</ComponentCard>

<ComponentCard
	title="Nested popovers"
	description="A child popover can live inside parent content while dismissal stays scoped to the active layer."
	class="!min-h-fit"
	code={`<Popover position="bottom" trigger={{ content: 'Open parent' }}>
	<div>
		<p>Parent content</p>
		<Popover position="right-start" trigger={{ content: 'Open child', size: 'small' }}>
			<div>Child content</div>
		</Popover>
	</div>
</Popover>`}
>
	<Popover position="bottom" trigger={{ content: 'Open parent' }}>
		<div class="grid gap-3">
			{@render content('Parent popover', 'Open the child without closing this parent layer.')}
			<Popover
				position="right-start"
				trigger={{ content: 'Open child', size: 'small', variant: 'soft' }}
			>
				{@render content('Child popover', 'Nested layers keep their own placement and dismissal.')}
			</Popover>
		</div>
	</Popover>
</ComponentCard>

<ComponentCard
	title="Popover to sheet"
	description="Set mobileSheet to keep the popover anchored on desktop and render it as a bottom sheet below the mobile breakpoint."
	class="!min-h-fit"
	code={`<Popover
	mobileSheet
	position="bottom"
	trigger={{ content: 'Open filters', color: 'primary' }}
>
	<div class="grid gap-3">
		<h2>Filters</h2>
		<p>This is anchored on desktop and becomes a bottom sheet on mobile.</p>
	</div>
</Popover>`}
>
	<Popover
		mobileSheet
		position="bottom"
		trigger={{
			content: 'Open filters',
			color: 'primary'
		}}
	>
		<div class="grid gap-3">
			{@render content(
				'Filters',
				'This stays anchored on desktop and becomes a bottom sheet on mobile.'
			)}
			<div class="flex flex-wrap gap-2">
				<Button size="small" variant="soft">Active</Button>
				<Button size="small" variant="outline" color="neutral">Archived</Button>
				<Button size="small" variant="outline" color="neutral">Assigned to me</Button>
			</div>
		</div>
	</Popover>
</ComponentCard>

<ComponentCard
	title="Nested mobile sheet menu"
	description="Submenus stay inside the bottom sheet on mobile. The back row returns to the parent panel and the sheet animates to each panel height."
	class="!min-h-fit"
	code={`<script lang="ts">
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import type { MenuItem } from '$lib/components/Menu/menu.props.js';

	const items = [
		{
			type: 'submenu',
			title: 'Share',
			menu: [
				{ type: 'option', title: 'Copy link' },
				{
					type: 'submenu',
					title: 'Advanced sharing',
					menu: [
						{ type: 'option', title: 'Create public link' },
						{ type: 'option', title: 'Invite collaborators' },
						{ type: 'option', title: 'Restrict to workspace' }
					]
				}
			]
		}
	] satisfies MenuItem[];
${'</' + 'script>'}

<PopupMenu
	mobileSheet
	position="bottom"
	trigger={{ content: 'Open menu', color: 'primary' }}
	menu={{ items }}
/>`}
>
	<div class="flex w-full max-w-sm items-center justify-center">
		<PopupMenu
			mobileSheet
			position="bottom"
			trigger={{
				content: 'Open menu',
				color: 'primary'
			}}
			menu={{ items: mobileSheetMenuItems }}
		/>
	</div>
</ComponentCard>
