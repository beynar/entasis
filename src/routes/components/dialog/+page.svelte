<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import { confirmation } from '$lib/components/Confirmation/confirmation.state.svelte.js';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { sizes } from '$lib/utils/tokens.js';

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
		{ name: 'responsive', type: 'switch', label: 'Responsive', value: true }
	]);

	const shortText =
		'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Placeat quas natus voluptatibus aliquam quisquam, dignissimos accusantium.';

	const paragraph = `Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit
		amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur
		adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit.
		Quisquam, quos.`;

	const longText = Array.from({ length: 12 }, () => paragraph).join('\n\n');
</script>

<DocPage
	title="Dialog"
	subtitle="Modal, alert, and full-screen overlays layered above the page."
	component="Dialog"
	features={[
		'Portals over a single shared backdrop',
		'Escape & click-outside dismissal, both toggleable',
		'Swipe-to-dismiss on touch',
		'Stacks & nests — parents scale and fade behind',
		'role=dialog + aria-modal with labelled title'
	]}
>
	<ComponentCard
		{controls}
		description="A centered modal opened from a trigger button."
		code={`<Dialog
	type="${controls.value.type}"
	size="${controls.value.size}"
	responsive={${controls.value.responsive}}
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
			title="Modal"
			description="A centered modal dialog."
			trigger={{ content: 'Open', color: 'primary' }}
		>
			<p>{shortText}</p>
		</Dialog>
	</ComponentCard>

	{#snippet examples()}
	<ComponentCard
		description="Modal, alert and full-screen variants. All portal to the body over a single shared backdrop."
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

	<ComponentCard
		description="Constrain the modal width with the size prop."
	>
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
			{#snippet children()}
				<p class="mb-4">This is the first level. Open another dialog on top of it.</p>
				<Dialog
					title="Child dialog"
					description="One level deeper. The parent is now dimmed and scaled."
					trigger={{ content: 'open child', color: 'primary' }}
					type="modal"
					size="small"
				>
					{#snippet children()}
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
					{/snippet}
				</Dialog>
			{/snippet}
		</Dialog>
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
