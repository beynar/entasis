<script lang="ts">
	import Popover from '$lib/components/Popover/Popover.svelte';
	import type { Snippet } from 'svelte';
	import { createRawSnippet } from 'svelte';

	import {} from 'svelte/compiler';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { tooltip } from '$lib/components/Tooltip/tooltip.attachment.svelte.js';
	import { sizes } from '$lib/utils/tokens.js';
	import type { OpenChangeDetails } from '$lib/types/index.js';
	import type { PopoverPlacement } from '$lib/components/Popover/popover.props.js';

	const placements = ['top', 'bottom', 'left', 'right', 'inline-start', 'inline-end'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'position',
			type: 'segmented',
			label: 'Position',
			value: 'bottom',
			options: placements
		}
	]);

	const panelText =
		'Use popovers for compact actions, controls, and supporting context that should stay anchored to a trigger.';

	const placementExamples = [
		{ position: 'top', label: 'Top' },
		{ position: 'right', label: 'Right' },
		{ position: 'bottom', label: 'Bottom' },
		{ position: 'left', label: 'Left' },
		{ position: 'bottom-start', label: 'Bottom start' },
		{ position: 'bottom-end', label: 'Bottom end' },
		{ position: 'inline-start', label: 'Inline start' },
		{ position: 'inline-end', label: 'Inline end' }
	] satisfies Array<{ position: PopoverPlacement; label: string }>;

	const text = `Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor`;

	const wrapper2 = createRawSnippet<[Snippet]>(() => {
		return {
			render() {
				return `<div>
					<h1>Hello</h1>
				</div>`;
			}
		};
	});

	let buttonRef = $state<HTMLButtonElement | null>(null);

	let lifetimeTrigger = $state(true);
	let lifetimeLog = $state('No change yet');

	let note = $state('');
	let noteLog = $state('No change yet');
	// Runs before the change: an outside press or Escape keeps a popover holding an unsaved note.
	const keepNote = (open: boolean, details: OpenChangeDetails) => {
		const dismissal = details.reason === 'outside-press' || details.reason === 'escape-key';
		if (!open && dismissal && note) details.cancel();
		noteLog = `onOpenChange(${open}, { reason: '${details.reason}' })${details.isCanceled ? ' · cancelled' : ''}`;
	};
</script>

{#snippet panelContent(title: string, description = panelText)}
	<div class="grid gap-2">
		<h2 class="text-neutral text-base font-semibold">{title}</h2>
		<p class="text-neutral/70 text-sm">{description}</p>
	</div>
{/snippet}

{#snippet wrapper(children: Snippet)}
	{@render children()}
{/snippet}

{#snippet children()}
	render children
{/snippet}

<DocPage
	title="Popover"
	subtitle="Floating content anchored to a trigger element."
	component="Popover"
	features={[
		'Positioned with Floating UI flip & offset',
		'Bindable open, external ref support',
		'Click, hover, or custom trigger snippet',
		{
			label: 'Escape & click-outside dismissal, both toggleable',
			test: 'a11y:popover.dismissal-toggleable'
		},
		'Directed enter/exit transitions by placement',
		{
			label: 'Inline mode renders the panel in normal document flow',
			test: 'a11y:popover.inline-in-flow'
		}
	]}
>
	<ComponentCard
		{controls}
		description="A floating panel opened from a trigger button."
		code={`<Popover
	trigger={{
		content: 'Open',
		color: 'primary'
	}}
	size="${controls.value.size}"
	position="${controls.value.position}"
>
	<div>
		<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor</p>
	</div>
</Popover>`}
	>
		<Popover
			trigger={{
				content: 'Open',
				color: 'primary'
			}}
			size={controls.value.size}
			position={controls.value.position}
		>
			<div>
				<p>{text}</p>
			</div>
		</Popover>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Inline (static): the panel renders in normal flow where the component sits — no portal, no floating placement — so an open panel can be shown in place."
			code={`<Popover inline open trigger={false} size="normal">
	<p>Rendered in place, no portal.</p>
</Popover>`}
		>
			<div class="flex flex-wrap items-start gap-4">
				<Popover inline open trigger={false} closeOnEscape={false} size="small">
					<p class="text-sm">Inline small</p>
				</Popover>
				<Popover inline open trigger={false} closeOnEscape={false}>
					<p class="text-sm">Inline normal, always visible.</p>
				</Popover>
				<Popover
					inline
					closeOnEscape={false}
					trigger={{ content: 'Toggle inline', color: 'primary' }}
				>
					<p class="text-sm">The trigger still toggles an inline panel.</p>
				</Popover>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Placement"
			description="Choose the preferred side or aligned edge. Floating UI flips the panel when there is not enough room. inline-start and inline-end follow the reading direction: inline-end opens on the right in English and on the left in Arabic."
			class="!min-h-fit"
			code={`<Popover position="top" trigger={{ content: 'Top', variant: 'soft' }}>
	<div>Top placement</div>
</Popover>

<Popover position="bottom-end" trigger={{ content: 'Bottom end', variant: 'soft' }}>
	<div>Bottom-end placement</div>
</Popover>

<Popover position="inline-end" trigger={{ content: 'Inline end', variant: 'soft' }}>
	<div>Opens on the reading direction's end side</div>
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
						{@render panelContent(`${example.label} placement`)}
					</Popover>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Styling by side"
			description="The panel reports the side it landed on, after any flip, as data-side, and its trigger reports it as data-popup-side. Square the corners where they meet, whichever way the panel opens."
			class="!min-h-fit"
			code={`<Popover
	position="bottom-start"
	offset={0}
	class="data-[side=bottom]:rounded-t-none data-[side=top]:rounded-b-none"
	trigger={{
		content: 'Attached panel',
		variant: 'soft',
		class: 'data-[popup-side=bottom]:rounded-b-none data-[popup-side=top]:rounded-t-none'
	}}
>
	<div>Attached to its trigger</div>
</Popover>`}
		>
			<Popover
				position="bottom-start"
				offset={0}
				class="data-[side=bottom]:rounded-t-none data-[side=top]:rounded-b-none"
				trigger={{
					content: 'Attached panel',
					variant: 'soft',
					class: 'data-[popup-side=bottom]:rounded-b-none data-[popup-side=top]:rounded-t-none'
				}}
			>
				{@render panelContent('Attached to its trigger')}
			</Popover>
		</ComponentCard>

		<ComponentCard
			title="Wrapped link"
			description="A trigger that wraps across lines has a bounding box wider than either line. With anchorTo set to line, the panel anchors to the line the pointer was on when it opened and stays there while it is open."
			class="!min-h-fit"
			code={`<p class="w-56">
	Read the
	<Popover anchorTo="line" position="bottom-start">
		{#snippet trigger(popover)}
			<span class="underline" {@attach popover.trigger}>full release notes for this version</span>
		{/snippet}
		<div>Anchored to the line you pointed at</div>
	</Popover>
	before upgrading.
</p>`}
		>
			<p class="w-56 text-sm leading-6" data-testid="wrapped-link-example">
				Read the
				<Popover anchorTo="line" position="bottom-start">
					{#snippet trigger(popover)}
						<span class="text-primary cursor-pointer underline" {@attach popover.trigger}
							>full release notes for this version</span
						>
					{/snippet}
					{@render panelContent('Anchored to the line you pointed at')}
				</Popover>
				before upgrading.
			</p>
		</ComponentCard>

		<ComponentCard
			description="Positions, hover open, nested popovers, and custom triggers."
			class="mt-40"
		>
			{@render wrapper(children)}
			{@render wrapper2(children)}

			<Button
				{@attach tooltip({
					content: children,
					position: 'top',
					offset: 5
				})}
			>
				tooltip here
			</Button>
			<Button
				{@attach tooltip({
					content: children,
					position: 'bottom',
					offset: 5
				})}
			>
				tooltip here
			</Button>

			<Popover
				mobileSheet
				position="bottom"
				trigger={{
					content: 'mobile sheet',
					color: 'primary'
				}}
			>
				<div class="grid gap-2">
					<h2 class="text-neutral text-base font-semibold">Mobile sheet</h2>
					<p class="text-neutral/70 text-sm">{text}</p>
				</div>
			</Popover>

			<Popover trigger={false} open ref={buttonRef} position="bottom"
				>default opened with external ref</Popover
			>

			<Popover
				closeOnMouseLeave={true}
				openOnHover
				delay={1000}
				trigger={{
					content: 'hover open',
					color: 'danger'
				}}
				position="bottom"
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				closeOnEscape
				position="top"
				trigger={{
					content: 'top',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				position="left"
				trigger={{
					content: 'left',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				position="bottom-end"
				trigger={{
					content: 'bottom-end',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				position="bottom-start"
				trigger={{
					content: 'bottom-start',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				position="top-start"
				trigger={{
					content: 'top-start',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				position="top-end"
				trigger={{
					content: 'top-end',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
					<Popover
						position="top-end"
						trigger={{
							content: 'top-end',
							color: 'danger'
						}}
					>
						<div>
							<h1>Hello</h1>
							<p>{text}</p>
						</div>
					</Popover>
				</div>
			</Popover>

			<Popover position="bottom-start">
				{#snippet trigger(popover)}
					<Button
						variant="soft"
						size="small"
						{@attach popover.reference}
						onclick={() => {
							console.log(popover);
							popover.toggle();
						}}
					>
						yo
					</Button>
				{/snippet}
				content
			</Popover>
		</ComponentCard>

		<ComponentCard
			title="Trigger lifetime"
			description="The trigger anchors the panel. Removing it closes an open popover and reports onOpenChange(false) with reason 'trigger-unmount', so the panel never lingers against a detached element. Outside presses are off here, so the removal is what closes it."
			code={`<script lang="ts">
	let showTrigger = $state(true);
${'</' + 'script>'}

<Button onclick={() => (showTrigger = !showTrigger)}>Remove trigger</Button>

<Popover
	closeOnClickOutside={false}
	onOpenChange={(open, details) => console.log(open, details.reason)}
>
	{#snippet trigger(popover)}
		{#if showTrigger}
			<Button {@attach popover.reference} onclick={() => popover.toggle()}>Open</Button>
		{/if}
	{/snippet}

	<div>Anchored to the trigger</div>
</Popover>`}
		>
			<!-- Remove trigger comes first: when the row wraps on a phone it sits above the trigger,
			     so the panel opening below the trigger never covers it. -->
			<div class="flex w-full max-w-xl flex-wrap items-center justify-center gap-3">
				<Button
					variant="outline"
					color="neutral"
					onclick={() => (lifetimeTrigger = !lifetimeTrigger)}
				>
					{lifetimeTrigger ? 'Remove trigger' : 'Restore trigger'}
				</Button>
				<Popover
					position="bottom"
					closeOnClickOutside={false}
					onOpenChange={(open, details) =>
						(lifetimeLog = `onOpenChange(${open}, { reason: '${details.reason}' })`)}
				>
					{#snippet trigger(popover)}
						{#if lifetimeTrigger}
							<Button variant="soft" {@attach popover.reference} onclick={() => popover.toggle()}>
								Open anchored panel
							</Button>
						{/if}
					{/snippet}
					<p class="text-neutral/70 max-w-xs text-sm">
						Press Remove trigger: this panel closes with it.
					</p>
				</Popover>
				<p class="text-neutral/70 w-full text-center text-sm" data-testid="trigger-lifetime-log">
					{lifetimeLog}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Open-change details"
			description="onOpenChange runs before the change with a reason, the event and cancel(). Type a note, then press outside or Escape: the popover stays open while the note has text. Discard empties it and closes."
			code={`<script lang="ts">
	import type { OpenChangeDetails } from 'entasis/types';

	let note = $state('');
	const keepNote = (open: boolean, details: OpenChangeDetails) => {
		const dismissal = details.reason === 'outside-press' || details.reason === 'escape-key';
		if (!open && dismissal && note) details.cancel();
	};
${'</' + 'script>'}

<Popover trigger={{ content: 'Add a note' }} focusOnOpen="first" onOpenChange={keepNote}>
	{#snippet children(popover)}
		<TextArea label="Note" bind:value={note} />
		<Button onclick={() => { note = ''; popover.close(); }}>Discard</Button>
	{/snippet}
</Popover>`}
		>
			<div class="flex w-full max-w-xl flex-col items-center gap-3">
				<Popover
					trigger={{ content: 'Add a note', variant: 'soft' }}
					position="bottom"
					focusOnOpen="first"
					onOpenChange={keepNote}
				>
					{#snippet children(popover)}
						<div class="flex flex-col gap-2">
							<textarea
								aria-label="Note"
								class="border-neutral/20 min-h-20 rounded-md border p-2 text-sm"
								bind:value={note}></textarea>
							<Button
								size="small"
								variant="soft"
								onclick={() => {
									note = '';
									popover.close();
								}}>Discard</Button
							>
						</div>
					{/snippet}
				</Popover>
				<p class="text-neutral/70 text-center text-sm" data-testid="open-change-log">{noteLog}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="How it opened"
			description="openReason records how the popover opened. A hover-opened popover leaves page scroll unlocked and closes when the pointer leaves; pressing its trigger pins it open. With several triggers, the one pressed anchors the panel and gets focus back."
			code={`<Popover openOnHover closeOnMouseLeave trigger={{ content: 'Hover or press' }}>
	{#snippet children(popover)}Opened by {popover.openReason}{/snippet}
</Popover>

<Popover focusOnOpen="first">
	{#snippet trigger(popover)}
		<Button {@attach popover.trigger}>First</Button>
		<Button {@attach popover.trigger}>Second</Button>
	{/snippet}
	{#snippet children(popover)}
		<Button onclick={() => popover.close()}>Close</Button>
	{/snippet}
</Popover>`}
		>
			<div class="flex flex-wrap items-center justify-center gap-3">
				<Popover
					openOnHover
					closeOnMouseLeave
					position="bottom"
					trigger={{ content: 'Hover or press', variant: 'soft' }}
				>
					{#snippet children(popover)}
						<p class="text-sm" data-testid="open-reason">Opened by {popover.openReason}</p>
					{/snippet}
				</Popover>
				<Popover position="bottom" focusOnOpen="first">
					{#snippet trigger(popover)}
						<Button variant="outline" color="neutral" {@attach popover.trigger}>First</Button>
						<Button variant="outline" color="neutral" {@attach popover.trigger}>Second</Button>
					{/snippet}
					{#snippet children(popover)}
						<Button size="small" variant="soft" onclick={() => popover.close()}>Close</Button>
					{/snippet}
				</Popover>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
