<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import { confirmation } from '$lib/components/Confirmation/confirmation.state.svelte.js';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import type { OpenChangeDetails } from '$lib/types/index.js';
	import TextArea from '$lib/components/Form/TextArea/TextArea.svelte';
	import TextInput from '$lib/components/Form/TextInput/TextInput.svelte';
	import type { DialogSnapPoint } from '$lib/components/Dialog/dialog.props.js';

	let searchField = $state<HTMLInputElement | null>(null);

	const dialogTypes = [
		'modal',
		'alert',
		'fullScreen',
		'drawerRight',
		'drawerLeft',
		'drawerBottom',
		'drawerTop'
	] as const;
	const controls = createComponentControls([
		{
			name: 'type',
			type: 'segmented',
			label: 'Type',
			value: 'modal',
			options: dialogTypes
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{ name: 'responsive', type: 'switch', label: 'Responsive', value: true },
		{
			name: 'inset',
			type: 'segmented',
			label: 'Drawer inset',
			value: 'theme',
			options: ['theme', 'none', 'sm', 'layout-md']
		}
	]);

	const shortText =
		'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Placeat quas natus voluptatibus aliquam quisquam, dignissimos accusantium.';

	const paragraph = `Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit
		amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur
		adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
		Quisquam, quos.`;

	const longText = Array.from({ length: 12 }, () => paragraph).join('\n\n');

	let keepOpen = $state(true);
	let dialogLog = $state('No change yet');

	// Ask before closing: with a draft in the field, every way out (Escape, a press outside, the
	// close button, a swipe, Android Back) is held back until the question is answered.
	let draftOpen = $state(false);
	let draft = $state('');
	let draftLog = $state('Nothing asked yet');
	const askBeforeClosing = (open: boolean, details: OpenChangeDetails) => {
		if (open || !draft) return;
		details.cancel();
		draftLog = `Held back a close by ${details.reason}`;
		void confirmation({
			title: 'Discard this draft?',
			description: 'The message has not been sent.',
			confirm: { text: 'Discard', color: 'danger' },
			cancel: 'Keep editing'
		}).then(({ confirmed }) => {
			draftLog = confirmed ? 'Draft discarded' : 'Kept editing';
			if (!confirmed) return;
			draft = '';
			draftOpen = false;
		});
	};

	// Snap points: the resting point is bindable, and the drawer reports every change.
	const snapPoints: DialogSnapPoint[] = [0.3, 0.6, 1];
	let snapPoint = $state<DialogSnapPoint | undefined>(0.3);
	let snapLog = $state('No change yet');

	let pageClicks = $state(0);
	// Runs before the change: while "Keep open" is on, only the dialog's own button closes it.
	const guardClose = (open: boolean, details: OpenChangeDetails) => {
		if (!open && keepOpen && details.reason !== 'close-press') details.cancel();
		dialogLog = `onOpenChange(${open}, { reason: '${details.reason}' })${details.isCanceled ? ' · cancelled' : ''}`;
	};
</script>

<DocPage
	title="Dialog"
	subtitle="Modal, alert, and full-screen overlays layered above the page."
	component="Dialog"
	features={[
		'Styling hooks: data-open, data-closed, data-entering, data-exiting on the root and panel, data-popup-open on the trigger (dialogDataAttributes)',
		'Portals over a single shared backdrop',
		{
			label: 'Escape & click-outside dismissal, both toggleable',
			test: 'a11y:dialog.dismissal-toggleable'
		},
		'Swipe-to-dismiss on touch',
		'Stacks & nests — parents scale and fade behind',
		{
			label: 'role=dialog + aria-modal with labelled title',
			test: 'a11y:dialog.aria-modal-labelled'
		},
		{
			label: 'type="alert" renders role=alertdialog',
			test: 'a11y:dialog.alert-role'
		},
		{
			label: 'Alerts ignore outside presses; Escape still answers',
			test: 'a11y:dialog.alert-outside-press'
		},
		{
			label: 'The close button is named Close',
			test: 'a11y:dialog.close-button-named'
		},
		{
			label: 'A hidden Close button for screen readers when the visible one is suppressed',
			test: 'a11y:dialog.hidden-close'
		},
		'Every way of closing can be held back through onOpenChange',
		'Non-modal mode leaves the page interactive',
		'Snap points for bottom and top drawers and mobile sheets',
		'Indent hooks on <html> to scale the page back behind a sheet'
	]}
>
	<ComponentCard
		{controls}
		description="A centered modal opened from a trigger button."
		code={`<Dialog
	type="${controls.value.type}"
	size="${controls.value.size}"
	responsive={${controls.value.responsive}}${controls.value.inset === 'theme' ? '' : `\n\tinset="${controls.value.inset}"`}
	title="Modal"
	description="A centered modal dialog."
	trigger={{ content: 'Open', color: 'primary' }}
>
	<p>Dialog body content…</p>
</Dialog>`}
	>
		<Dialog
			type={controls.value.type}
			size={controls.value.size}
			responsive={controls.value.responsive}
			inset={controls.value.inset === 'theme' ? undefined : controls.value.inset}
			title="Modal"
			description="A centered modal dialog."
			trigger={{ content: 'Open', color: 'primary' }}
		>
			<p>{shortText}</p>
		</Dialog>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Modal, alert and full-screen variants. All portal to the body over a single shared backdrop. An alert is an alertdialog: an outside press leaves it open, Escape or a button answers it."
		>
			<Dialog
				type="modal"
				title="Modal"
				description="A centered modal dialog."
				trigger={{ content: 'modal', color: 'primary' }}
			>
				<p>{shortText}</p>
			</Dialog>
			<Dialog
				type="alert"
				title="Alert"
				description="A compact, attention-grabbing dialog."
				trigger={{ content: 'alert', color: 'danger' }}
			>
				<p>{shortText}</p>
			</Dialog>
			<Dialog
				type="fullScreen"
				title="Full screen"
				description="Fills the viewport."
				trigger={{ content: 'fullScreen', color: 'secondary' }}
			>
				<p>{shortText}</p>
			</Dialog>
		</ComponentCard>

		<ComponentCard description="Constrain the modal width with the size prop.">
			<Dialog
				type="modal"
				size="small"
				title="Small"
				trigger={{ content: 'small', color: 'primary' }}
			>
				<p>{shortText}</p>
			</Dialog>
			<Dialog
				type="modal"
				size="normal"
				title="Normal"
				trigger={{ content: 'normal', color: 'primary' }}
			>
				<p>{shortText}</p>
			</Dialog>
			<Dialog
				type="modal"
				size="large"
				title="Large"
				trigger={{ content: 'large', color: 'primary' }}
			>
				<p>{shortText}</p>
			</Dialog>
		</ComponentCard>

		<ComponentCard
			description="For content taller than the viewport, scroll inside the card (inner, the default) or scroll the whole viewport (outer)."
		>
			<Dialog
				type="modal"
				scroll="inner"
				title="Inner scroll"
				description="The card is capped to the viewport and its body scrolls."
				trigger={{ content: 'inner scroll', color: 'primary' }}
			>
				<p class="whitespace-pre-line">{longText}</p>
			</Dialog>
			<Dialog
				type="modal"
				scroll="outer"
				title="Outer scroll"
				description="The card grows to its full height and the viewport scrolls."
				trigger={{ content: 'outer scroll', color: 'secondary' }}
			>
				<p class="whitespace-pre-line">{longText}</p>
			</Dialog>
		</ComponentCard>

		<ComponentCard
			description="Edge-anchored panels that slide in from any side. They always scroll internally."
		>
			<Dialog
				type="drawerRight"
				title="Right drawer"
				trigger={{ content: 'drawerRight', color: 'primary' }}
			>
				<p class="whitespace-pre-line">{longText}</p>
			</Dialog>
			<Dialog
				type="drawerLeft"
				title="Left drawer"
				description="Swipes only from the thumb or header (swipeFrom='handle')."
				swipeFrom="handle"
				trigger={{ content: 'drawerLeft', color: 'primary' }}
			>
				<p class="whitespace-pre-line">{longText}</p>
			</Dialog>
			<Dialog
				type="drawerTop"
				title="Top drawer"
				trigger={{ content: 'drawerTop', color: 'primary' }}
			>
				<p>{shortText}</p>
			</Dialog>
			<Dialog
				type="drawerBottom"
				title="Bottom drawer"
				trigger={{ content: 'drawerBottom', color: 'primary' }}
			>
				<p>{shortText}</p>
			</Dialog>
		</ComponentCard>

		<ComponentCard
			description="Open dialogs on top of each other — parents scale down and their content fades behind a single backdrop."
		>
			<Dialog
				title="Nested dialog"
				description="Open a child — the parent scales down and fades behind."
				trigger={{ content: 'open nested', color: 'primary' }}
				type="modal"
			>
				<p class="mb-4">This is the first level. Open another dialog on top of it.</p>
				<Dialog
					title="Child dialog"
					description="One level deeper. The parent is now dimmed and scaled."
					trigger={{ content: 'open child', color: 'primary' }}
					type="modal"
					size="small"
				>
					<p class="mb-4">Second level. Go one more to see a small dialog over the stack.</p>
					<Dialog
						title="Grandchild"
						description="A small dialog on top of the stack."
						trigger={{ content: 'open grandchild', color: 'primary' }}
						type="alert"
						size="small"
					>
						<p>Both parents are scaled and faded behind this one.</p>
					</Dialog>
				</Dialog>
			</Dialog>
		</ComponentCard>

		<ComponentCard
			title="Trigger and open-change details"
			description="Snippets receive a DialogApi (open, close, status, trigger…). A snippet trigger that attaches dialog.trigger gets aria-haspopup, aria-expanded and aria-controls, and focus returns to it. onOpenChange runs before the change with a reason and cancel(): while Keep open is on, Escape and outside presses are cancelled and only the close button closes it."
			code={`<script lang="ts">
	import type { OpenChangeDetails } from 'entasis/types';

	let keepOpen = $state(true);
	const guardClose = (open: boolean, details: OpenChangeDetails) => {
		if (!open && keepOpen && details.reason !== 'close-press') details.cancel();
	};
${'</' + 'script>'}

<Dialog title="Guarded dialog" onOpenChange={guardClose}>
	{#snippet trigger(dialog)}
		<Button {@attach dialog.trigger}>Open guarded dialog</Button>
		<span>Status: {dialog.status}</span>
	{/snippet}
	<Switch label="Keep open" bind:value={keepOpen} />
</Dialog>`}
		>
			<div class="flex w-full max-w-xl flex-col items-center gap-3">
				<Dialog
					title="Guarded dialog"
					description="Escape and outside presses ask first."
					onOpenChange={guardClose}
				>
					{#snippet trigger(dialog)}
						<Button color="primary" {@attach dialog.trigger}>Open guarded dialog</Button>
						<span class="text-neutral/70 text-sm" data-testid="dialog-status">
							Status: {dialog.status}
						</span>
					{/snippet}
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" bind:checked={keepOpen} />
						Keep open
					</label>
				</Dialog>
				<p class="text-neutral/70 text-center text-sm" data-testid="dialog-open-change-log">
					{dialogLog}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Ask before closing"
			description="Escape, a press outside, the close button, a swipe and the Android Back gesture all go through onOpenChange. With a draft in the field, the drawer calls details.cancel() and asks first: a cancelled swipe snaps back with no exit animation. Type something, then try Escape or swipe it away (touch)."
			code={`<script lang="ts">
	import { confirmation } from 'entasis/confirmation';
	import type { OpenChangeDetails } from 'entasis/types';

	let open = $state(false);
	let draft = $state('');

	const askBeforeClosing = (nextOpen: boolean, details: OpenChangeDetails) => {
		if (nextOpen || !draft) return;
		details.cancel();
		confirmation({
			title: 'Discard this draft?',
			confirm: { text: 'Discard', color: 'danger' },
			cancel: 'Keep editing'
		}).then(({ confirmed }) => {
			if (!confirmed) return;
			draft = '';
			open = false;
		});
	};
${'</' + 'script>'}

<Dialog
	type="drawerRight"
	title="New message"
	bind:open
	onOpenChange={askBeforeClosing}
	trigger={{ content: 'Write a message' }}
>
	<TextArea label="Message" bind:value={draft} />
</Dialog>`}
		>
			<div class="flex w-full max-w-xl flex-col items-center gap-3">
				<Dialog
					type="drawerRight"
					title="New message"
					description="Closing with text in the field asks first."
					bind:open={draftOpen}
					onOpenChange={askBeforeClosing}
					trigger={{ content: 'Write a message', color: 'primary' }}
				>
					<TextArea label="Message" bind:value={draft} />
				</Dialog>
				<p class="text-neutral/70 text-center text-sm" data-testid="dialog-draft-log">
					{draftLog}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Non-modal"
			description="modal={false} leaves the page behind usable: no inert page, no scroll lock, no backdrop, no focus trap, and an outside press does not dismiss it. Escape and the close button still do."
			code={`<Dialog
	modal={false}
	type="drawerRight"
	size="small"
	theme={{ content: { base: 'max-w-72' } }}
	title="Inspector"
	trigger={{ content: 'Open inspector' }}
>
	<p>The page behind stays interactive.</p>
</Dialog>`}
		>
			<!-- The page button sits at the start edge and the drawer is narrowed, so even the tablet-width
				content column (about 460px beside the sidebar) leaves the button uncovered. -->
			<div class="flex w-full flex-wrap items-center justify-start gap-3">
				<Button variant="soft" onclick={() => (pageClicks += 1)}>Page button · {pageClicks}</Button>
				<Dialog
					modal={false}
					type="drawerRight"
					size="small"
					theme={{ content: { base: 'max-w-72' } }}
					title="Inspector"
					description="The page behind stays interactive."
					trigger={{ content: 'Open inspector', color: 'primary' }}
				>
					<p>{shortText}</p>
				</Dialog>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Snap points"
			description="A bottom or top drawer (or a modal collapsed into a mobile sheet) rests at snapPoints: fractions of the available height or CSS lengths. Drag it between them; a flick carries it to the next, and dragging below the lowest dismisses it. Its body scrolls only at the largest point. snapPoint is bindable, defaultSnapPoint sets where it opens and onSnapPointChange can cancel."
			code={`<script lang="ts">
	let snapPoint = $state(0.3);
${'</' + 'script>'}

<Dialog
	type="drawerBottom"
	title="Snap points"
	snapPoints={[0.3, 0.6, 1]}
	bind:snapPoint
	onSnapPointChange={({ snapPoint, details }) => console.log(snapPoint, details.reason)}
	trigger={{ content: 'Open sheet' }}
>
	{#snippet children(dialog)}
		<Button onclick={() => dialog.setSnapPoint(1)}>Expand</Button>
	{/snippet}
</Dialog>`}
		>
			<div class="flex w-full max-w-xl flex-col items-center gap-3">
				<Dialog
					type="drawerBottom"
					responsive={false}
					title="Snap points"
					description="Drag the handle, or use the buttons."
					{snapPoints}
					bind:snapPoint
					onSnapPointChange={({ snapPoint, details }) =>
						(snapLog = `onSnapPointChange({ snapPoint: ${snapPoint}, details: { reason: '${details.reason}' } })`)}
					trigger={{ content: 'Open sheet', color: 'primary' }}
				>
					{#snippet children(dialog)}
						<div class="flex flex-col gap-3">
							<div class="flex flex-wrap gap-2">
								{#each snapPoints as point (point)}
									<Button
										size="small"
										variant={dialog.currentSnapPoint === point ? 'solid' : 'soft'}
										onclick={() => dialog.setSnapPoint(point)}>{point}</Button
									>
								{/each}
							</div>
							<p class="whitespace-pre-line">{longText}</p>
						</div>
					{/snippet}
				</Dialog>
				<p class="text-neutral/70 text-center text-sm" data-testid="dialog-snap-log">
					Resting at {snapPoint} · {snapLog}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Indent effect"
			description="While a modal dialog is open, <html> carries data-dialog-open and --dialog-depth (the number of open modal dialogs), so a page can scale back behind a sheet with plain CSS. The box below follows them; open any dialog on this page."
			code={`/* Anywhere in your global CSS: the app shell moves back behind a sheet. */
.app-shell {
	transition: transform 300ms ease, border-radius 300ms ease;
	transform-origin: 50% 0;
}
html[data-dialog-open] .app-shell {
	transform: scale(calc(1 - var(--dialog-depth) * 0.04));
	border-radius: 1rem;
}`}
		>
			<div class="flex w-full max-w-xl flex-col items-center gap-4">
				<div
					class="indent-demo border-neutral-muted bg-surface-floating w-full rounded-md border p-6 text-center text-sm"
				>
					The page behind the sheet
				</div>
				<Dialog
					type="drawerBottom"
					title="Indent effect"
					description="The box behind this sheet scaled back."
					trigger={{ content: 'Open sheet', color: 'primary' }}
				>
					<p>{shortText}</p>
				</Dialog>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Fields above the keyboard"
			description="In a bottom sheet (or a modal collapsed into one on mobile), the sheet stays above the on-screen keyboard while a field inside has focus: its padding follows --keyboard-inset and --visual-viewport-top, so it fits the visible area wherever iOS scrolled the page, and the field is centered inside the sheet once the keyboard has stopped moving. On iOS the Theme keeps Safari from zooming into the focused field. Browsers that resize the layout for the keyboard (Chrome on Android only with interactive-widget=resizes-content in the viewport meta tag) report no inset and need no help; by default Chrome on Android reports it like iOS."
			code={`<Dialog type="drawerBottom" title="Reply" trigger={{ content: 'Reply' }}>
	<TextInput label="Subject" />
	<TextArea label="Message" />
</Dialog>`}
		>
			<Dialog
				type="drawerBottom"
				responsive={false}
				title="Reply"
				trigger={{ content: 'Reply', color: 'primary' }}
			>
				<div class="flex flex-col gap-3">
					<TextInput label="Subject" />
					<TextArea label="Message" />
				</div>
			</Dialog>
		</ComponentCard>

		<ComponentCard
			title="Where focus goes on close"
			description="Focus returns to the button that opened the dialog, with a focus ring after Escape. Closing the confirmation inside it returns focus to Delete, not to the first field. With focusOnClose, the Save button sends focus to the search field instead; Escape still restores the trigger."
			code={`<script lang="ts">
	let search = $state<HTMLInputElement | null>(null);
${'</' + 'script>'}

<input bind:this={search} aria-label="Search" />
<Dialog
	title="Rename project"
	trigger={{ content: 'Rename' }}
	focusOnClose={(details) => (details?.reason === 'close-press' ? search : undefined)}
>
	<input aria-label="Name" />
	<Button onclick={() => confirmation({ title: 'Delete project?', confirm: 'Delete', cancel: 'Keep' })}>
		Delete
	</Button>
</Dialog>`}
		>
			<div class="flex w-full max-w-xl flex-wrap items-center justify-center gap-3">
				<input
					bind:this={searchField}
					aria-label="Search"
					placeholder="Search"
					class="border-neutral/20 rounded-md border px-2 py-1 text-sm"
				/>
				<Dialog
					title="Rename project"
					trigger={{ content: 'Rename', color: 'primary' }}
					size="small"
					focusOnClose={(details) => (details?.reason === 'close-press' ? searchField : undefined)}
				>
					<div class="flex flex-col gap-3">
						<input
							aria-label="Name"
							placeholder="Name"
							class="border-neutral/20 rounded-md border px-2 py-1 text-sm"
						/>
						<Button
							variant="soft"
							color="danger"
							onclick={() =>
								confirmation({
									title: 'Delete project?',
									description: 'This cannot be undone.',
									confirm: 'Delete',
									cancel: 'Keep'
								})}>Delete</Button
						>
					</div>
				</Dialog>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Imperatively prompt for a yes/no decision with the confirmation() helper."
		>
			<Button
				onclick={async () => {
					await confirmation({
						title: 'Confirmation',
						description: 'Are you sure you want to continue?',
						confirm: 'Confirm',
						cancel: 'Cancel',
						onConfirm: () => {
							console.log('confirmed');
						}
					});
				}}>Ask for confirmation</Button
			>
		</ComponentCard>
	{/snippet}
</DocPage>

<style>
	/* The indent recipe, live: the box moves back while any modal dialog is open. */
	.indent-demo {
		transition:
			transform 300ms ease,
			border-radius 300ms ease;
		transform-origin: 50% 0;
	}
	:global(html[data-dialog-open]) .indent-demo {
		transform: scale(calc(1 - var(--dialog-depth, 1) * 0.04));
		border-radius: 1rem;
	}
</style>
