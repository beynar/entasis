<script lang="ts">
	import { confirmation } from '$lib/components/Confirmation/confirmation.state.svelte.js';
	import Button from '$lib/components/Button/Button.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const controls = createComponentControls([
		{
			name: 'color',
			type: 'segmented',
			label: 'Confirm color',
			value: 'danger',
			options: ['danger', 'primary', 'success', 'warning']
		},
		{ name: 'async', type: 'switch', label: 'Async action', value: false }
	]);
	let lastResult = $state<string>('—');

	async function showConfirmation() {
		const outcome = await confirmation({
			title: 'Confirm action',
			description: 'Review the action before continuing.',
			confirm: { text: 'Continue', color: controls.value.color },
			cancel: 'Cancel',
			...(controls.value.async
				? {
						onConfirm: async () => {
							await new Promise((resolve) => setTimeout(resolve, 1200));
							return 'completed';
						}
					}
				: {})
		});

		lastResult = outcome.confirmed
			? `Confirmed${outcome.result ? ` → ${outcome.result}` : ''}`
			: 'Cancelled';
	}

	async function confirmAsync() {
		const { confirmed, result } = await confirmation({
			title: 'Publish changes',
			description: 'This runs an async task and shows a loading state until it resolves.',
			confirm: { text: 'Publish', color: 'primary' },
			cancel: 'Cancel',
			onConfirm: async () => {
				await new Promise((r) => setTimeout(r, 1200));
				return 'published';
			}
		});
		lastResult = confirmed ? `Confirmed → ${result}` : 'Cancelled';
	}
</script>

<DocPage
	title="Confirmation"
	subtitle="An imperative, promise-based confirm dialog. Call confirmation() and await the outcome."
	features={[
		'Promise-based imperative API — no local state',
		'Async onConfirm with an automatic loading state',
		{
			label: 'Modal: cannot be dismissed by escape or click-outside',
			test: 'a11y:confirmation.modal'
		},
		'Rendered by a single <Confirmation /> mounted at the app root'
	]}
>
	<ComponentCard
		{controls}
		code={`import { confirmation } from 'svelai/confirmation';

const { confirmed } = await confirmation({
	title: 'Confirm action',
	description: 'Review the action before continuing.',
	confirm: { text: 'Continue', color: '${controls.value.color}' },
	cancel: 'Cancel'${
		controls.value.async
			? `,
	onConfirm: async () => {
		await runAction();
		return 'completed';
	}`
			: ''
	}
});`}
	>
		<div class="flex flex-col items-center gap-4">
			<Button color={controls.value.color} onclick={showConfirmation}>Open confirmation</Button>
			<p class="text-neutral/70 text-sm">Last result: {lastResult}</p>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Async onConfirm: the confirm button shows a loading state until the promise resolves, and its return value comes back as result."
			code={`const { confirmed, result } = await confirmation({
	title: 'Publish changes',
	description: 'Runs an async task.',
	confirm: { text: 'Publish', color: 'primary' },
	cancel: 'Cancel',
	onConfirm: async () => {
		await publish();
		return 'published';
	}
});`}
		>
			<div class="flex flex-col items-center gap-4">
				<Button color="primary" onclick={confirmAsync}>Publish changes</Button>
				<p class="text-neutral/70 text-sm">Last result: {lastResult}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Setup: mount <Confirmation /> once, near the root of your app. The confirmation() function talks to it via events, so you never render it at the call site."
			code={`// +layout.svelte — import and render once, near the root:
import { Confirmation } from 'svelai/confirmation';

// ...then in the markup:
// <slot />
// <Confirmation />`}
		>
			<p class="text-neutral/70 text-sm">Already mounted in this docs app's root layout.</p>
		</ComponentCard>
	{/snippet}
</DocPage>
