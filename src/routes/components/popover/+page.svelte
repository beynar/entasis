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
	import type { PopoverApi } from '$lib/components/Popover/popover.api.js';

	type Person = { id: number; name: string; role: string };
	const people: Person[] = [
		{ id: 1, name: 'Ada', role: 'Mathematician' },
		{ id: 2, name: 'Grace', role: 'Rear admiral' },
		{ id: 3, name: 'Edsger', role: 'Computer scientist' }
	];

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
		},
		{ name: 'arrow', type: 'switch', label: 'Arrow', value: false }
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
		'Styling hooks: data-open, data-closed, data-entering, data-exiting, data-side, data-align on the panel, data-popup-open on the trigger (popoverDataAttributes)',
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
		},
		{
			label: 'Hover never opens from a touch tap or a disabled trigger',
			test: 'a11y:popover.hover-ignores-touch-and-disabled'
		},
		'Neighbouring hover popovers, hover cards and tooltips open without waiting',
		{
			label: 'Tab reaches the panel from its trigger and continues after it',
			test: 'a11y:popover.tab-into-panel'
		},
		{
			label:
				'Modal popovers contain Tab, make the page inert and give screen readers a Close button',
			test: 'a11y:popover.modal-inert'
		},
		{
			label: 'Named with label or labelledBy',
			test: 'a11y:popover.label'
		},
		{
			label: 'Closes when focus moves on to something else',
			test: 'a11y:popover.focus-out'
		},
		'Optional arrow that follows the trigger',
		'One popup shared by many triggers, each with its own payload'
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
	position="${controls.value.position}"${controls.value.arrow ? '\n\tarrow' : ''}
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
			arrow={controls.value.arrow as boolean}
		>
			<div>
				<p>{text}</p>
			</div>
		</Popover>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Styling hooks"
			description="State attributes style each part without reading component state: the trigger carries data-popup-open while the panel is open, the panel data-open, data-side and data-align, and data-entering / data-exiting while its transition plays. popoverDataAttributes and popoverCssVariables list them all."
			code={`<Popover
	position="bottom-start"
	class="data-[side=bottom]:rounded-t-none data-[side=top]:rounded-b-none"
	trigger={{ content: 'Open', variant: 'outline', class: 'data-popup-open:bg-primary-muted' }}
>
	<p>The trigger stays tinted while this panel is open.</p>
</Popover>`}
		>
			<Popover
				position="bottom-start"
				class="data-[side=bottom]:rounded-t-none data-[side=top]:rounded-b-none"
				trigger={{
					content: 'Open',
					variant: 'outline',
					class: 'data-popup-open:bg-primary-muted'
				}}
			>
				<p class="text-sm">The trigger stays tinted while this panel is open.</p>
			</Popover>
		</ComponentCard>

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
			title="Hover popovers"
			description="openOnHover opens after delay, from a mouse or pen only: a touch tap or a disabled trigger never hover-opens it. Once one is open, its neighbour opens at once. closeDelay is how long the pointer may wander outside the safe area before closeOnMouseLeave closes the panel."
			code={`<Popover
	openOnHover
	closeOnMouseLeave
	delay={300}
	closeDelay={300}
	trigger={{ content: 'Profile', variant: 'soft' }}
>
	<p>Hover the next trigger: it opens without waiting.</p>
</Popover>

<Popover openOnHover closeOnMouseLeave delay={300} closeDelay={300} trigger={{ content: 'Billing', variant: 'soft' }}>
	<p>Opened without the delay.</p>
</Popover>

<Popover openOnHover delay={300} trigger={{ content: 'Disabled', disabled: true }}>
	<p>Never shown on hover.</p>
</Popover>`}
		>
			<div class="flex w-full max-w-xl flex-wrap items-center justify-center gap-3">
				{#each ['Profile', 'Billing', 'Team'] as label (label)}
					<Popover
						openOnHover
						closeOnMouseLeave
						delay={300}
						closeDelay={300}
						position="bottom"
						lockScroll={false}
						trigger={{ content: label, variant: 'soft' }}
					>
						<p class="text-neutral/70 max-w-xs text-sm">
							{label} details. Move to a neighbouring trigger: it opens without waiting.
						</p>
					</Popover>
				{/each}
				<Popover
					openOnHover
					delay={300}
					position="bottom"
					lockScroll={false}
					trigger={{ content: 'Disabled', variant: 'soft', disabled: true }}
				>
					<p class="text-sm">Never shown on hover.</p>
				</Popover>
			</div>
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
			description="Every snippet receives a PopoverApi: openReason records how the popover opened and status where its panel is in the open/close lifecycle. A hover-opened popover leaves page scroll unlocked and closes when the pointer leaves; pressing its trigger pins it open. With several triggers, the one pressed anchors the panel and gets focus back."
			code={`<Popover openOnHover closeOnMouseLeave trigger={{ content: 'Hover or press' }}>
	{#snippet children(popover)}Opened by {popover.openReason} ({popover.status}){/snippet}
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
						<p class="text-sm" data-testid="open-reason">
							Opened by {popover.openReason} (<span data-testid="open-status">{popover.status}</span
							>)
						</p>
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

		<ComponentCard
			title="Tab order"
			description="The panel is rendered at the end of the page, but Tab treats it as part of the trigger: Tab on the open trigger enters the panel, Tab past its last control continues with the next control and closes it, and Shift+Tab on its first control returns to the trigger. focusOnClose chooses where focus goes when it closes."
			code={`<Button>Previous control</Button>
<Popover trigger={{ content: 'Open filters' }}>
	<label><input type="checkbox" /> In stock</label>
	<label><input type="checkbox" /> On sale</label>
</Popover>
<Button>Next control</Button>`}
		>
			<div class="flex flex-wrap items-center justify-center gap-3">
				<Button variant="outline" color="neutral">Previous control</Button>
				<Popover trigger={{ content: 'Open filters', variant: 'soft' }} position="bottom">
					<div class="flex flex-col gap-2 text-sm">
						<label class="flex items-center gap-2"><input type="checkbox" /> In stock</label>
						<label class="flex items-center gap-2"><input type="checkbox" /> On sale</label>
					</div>
				</Popover>
				<Button variant="outline" color="neutral">Next control</Button>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Closing when focus moves on"
			description="Focus that was on the trigger or inside the panel moving to a control outside both closes the popover (reason 'focus-out') and is not taken back. It follows closeOnClickOutside unless closeOnFocusOut says otherwise. Menus and lists steer focus themselves, so they are left alone. tabBridge={false} takes the panel out of the trigger's Tab order for a panel that is not meant to be tabbed into."
			code={`<Popover focusOnOpen="first" trigger={{ content: 'Closes when focus leaves' }}>
	<input aria-label="Name" />
</Popover>

<Popover closeOnFocusOut={false} trigger={{ content: 'Stays open' }}>
	<input aria-label="Name" />
</Popover>

<Popover tabBridge={false} trigger={{ content: 'Not in the Tab order' }}>
	Hover-style hint, not for tabbing into
</Popover>`}
		>
			<div class="flex flex-wrap items-center justify-center gap-3">
				<Popover
					focusOnOpen="first"
					position="bottom"
					trigger={{ content: 'Closes when focus leaves', variant: 'soft' }}
				>
					<input
						aria-label="Name"
						placeholder="Name"
						class="border-neutral/30 w-full rounded-md border px-2 py-1 text-sm"
					/>
				</Popover>
				<Popover
					closeOnFocusOut={false}
					focusOnOpen="first"
					position="bottom"
					trigger={{ content: 'Stays open', variant: 'soft' }}
				>
					<input
						aria-label="Name"
						placeholder="Name"
						class="border-neutral/30 w-full rounded-md border px-2 py-1 text-sm"
					/>
				</Popover>
				<Popover
					tabBridge={false}
					position="bottom"
					trigger={{ content: 'Not in the Tab order', variant: 'soft' }}
				>
					{@render panelContent('A hint', 'Tab on the trigger moves on to the next control.')}
				</Popover>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Modal and named"
			description="A modal popover keeps Tab inside the panel, makes the rest of the page inert and opens with focus inside it. A visually hidden Close button at the end of the panel gives screen reader users a control that closes it. label names the dialog for assistive technology (labelledBy points at a visible heading instead)."
			code={`<Popover modal label="Delivery options" trigger={{ content: 'Delivery options' }}>
	<fieldset>
		<label><input type="radio" name="speed" /> Standard</label>
		<label><input type="radio" name="speed" /> Express</label>
	</fieldset>
	<Button>Save</Button>
</Popover>`}
		>
			<Popover
				modal
				label="Delivery options"
				position="bottom"
				trigger={{ content: 'Delivery options', color: 'primary' }}
			>
				{#snippet children(popover)}
					<div class="grid gap-3 text-sm">
						<label class="flex items-center gap-2"
							><input type="radio" name="speed" checked /> Standard</label
						>
						<label class="flex items-center gap-2"
							><input type="radio" name="speed" /> Express</label
						>
						<Button size="small" onclick={() => popover.close()}>Save</Button>
					</div>
				{/snippet}
			</Popover>
		</ComponentCard>

		<ComponentCard
			title="Arrow"
			description="arrow draws a small pointer from the panel toward the trigger. It is placed after the panel has shifted to fit the viewport, so it keeps pointing at the trigger, and it reports the side it sits on as data-side (data-uncentered when the trigger is not under the middle of the panel). Style it with theme.arrow."
			code={`<Popover arrow position="bottom" offset={10} trigger={{ content: 'Bottom' }}>
	<div>Arrow points up at the trigger</div>
</Popover>

<Popover arrow position="right" offset={10} trigger={{ content: 'Right' }}>
	<div>Arrow points left</div>
</Popover>`}
		>
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each ['top', 'right', 'bottom', 'left'] as const as side (side)}
					<Popover arrow offset={10} position={side} trigger={{ content: side, variant: 'soft' }}>
						{@render panelContent(`Arrow on the ${side} side`, 'It follows the trigger.')}
					</Popover>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="One popup for many triggers"
			description="A list of rows does not need a popover per row. Put {'{@attach popover.triggerFor(() => row)}'} on every row's trigger: one Popover moves to the one that was pressed, and popover.payload is that trigger's data, read live (type the snippet parameter PopoverApi<Person>). Pressing another trigger while it is open moves the panel to it."
			code={`<script lang="ts">
	import { Popover, type PopoverApi } from 'entasis/popover';
	import { Button } from 'entasis/button';

	type Person = { id: number; name: string; role: string };
	let { people }: { people: Person[] } = $props();
${'</' + 'script>'}

<Popover>
	{#snippet trigger(popover: PopoverApi<Person>)}
		{#each people as person (person.id)}
			<Button {@attach popover.triggerFor(() => person)}>{person.name}</Button>
		{/each}
	{/snippet}
	{#snippet children(popover: PopoverApi<Person>)}
		<strong>{popover.payload?.name}</strong>
		<p>{popover.payload?.role}</p>
	{/snippet}
</Popover>`}
		>
			<Popover position="bottom" arrow offset={10}>
				{#snippet trigger(popover: PopoverApi<Person>)}
					<div class="flex flex-wrap items-center justify-center gap-3">
						{#each people as person (person.id)}
							<Button variant="soft" {@attach popover.triggerFor(() => person)}>
								{person.name}
							</Button>
						{/each}
					</div>
				{/snippet}
				{#snippet children(popover: PopoverApi<Person>)}
					<div class="grid gap-1" data-testid="shared-popup">
						<strong class="text-sm">{popover.payload?.name}</strong>
						<span class="text-neutral/70 text-sm">{popover.payload?.role}</span>
					</div>
				{/snippet}
			</Popover>
		</ComponentCard>
	{/snippet}
</DocPage>
