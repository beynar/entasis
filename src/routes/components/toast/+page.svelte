<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { Toaster, toast } from '$lib/components/Toast/index.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import type { ToastPosition } from '$lib/components/Toast/toast.state.svelte.js';

	const positions: ToastPosition[] = [
		'top-left',
		'top-center',
		'top-right',
		'bottom-left',
		'bottom-center',
		'bottom-right'
	];

	const sizes = ['small', 'normal', 'large'] as const;
	const controls = createComponentControls([
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'success',
			options: ['primary', 'success', 'warning', 'danger', 'neutral']
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'duration',
			type: 'slider',
			label: 'Duration',
			value: 4000,
			min: 1000,
			max: 10000,
			step: 500,
			showValue: true
		},
		{ name: 'richColors', type: 'switch', label: 'Rich colors', value: false },
		{ name: 'progress', type: 'switch', label: 'Progress', value: false }
	]);

	function showConfiguredToast() {
		toast[controls.value.color]({
			title: 'Hello',
			description: 'This is a toast',
			size: controls.value.size,
			duration: controls.value.duration,
			richColors: controls.value.richColors,
			progress: controls.value.progress
		});
	}

	// Deferred delete + Undo — the real-world pattern. Deleting an item removes it
	// from the UI optimistically and shows a toast with an Undo action. The actual
	// The irreversible delete is deferred to `onAutoDismiss`, which fires only if the
	// toast times out — clicking Undo dismisses it first, so the delete never runs.
	type Item = { id: number; name: string };
	let items = $state<Item[]>([
		{ id: 1, name: 'Design brief.pdf' },
		{ id: 2, name: 'Q3 roadmap.md' },
		{ id: 3, name: 'Invoice #1024.pdf' }
	]);
	const committed: string[] = [];

	const deleteItem = (item: Item) => {
		items = items.filter((i) => i.id !== item.id); // optimistic remove
		toast.neutral({
			title: `Deleted “${item.name}”`,
			duration: 5000,
			actions: [
				{
					content: 'Undo',
					color: 'primary',
					onclick: () => {
						items = [...items, item].sort((a, b) => a.id - b.id); // restore
					}
				}
			],
			onAutoDismiss: () => {
				// Not undone → commit the real deletion here (your API call).
				committed.push(item.name);
				console.log('Committed delete:', item.name);
			}
		});
	};

	// A pending toast that resolves into a success toast after a delay — the common
	// "optimistic action" pattern. Calling toast again with the same id updates that toast
	// in place, so pressing the button twice still shows a single toast.
	const showLoadingToast = () => {
		toast.primary({
			id: 'save-changes',
			title: 'Saving changes…',
			// Omitted keys keep their value: clear the one a previous success set.
			description: undefined,
			loading: true,
			duration: false
		});
		setTimeout(() => {
			toast.success({
				id: 'save-changes',
				title: 'Changes saved',
				description: 'Your changes are now live.',
				loading: false,
				duration: 3000
			});
		}, 1600);
	};

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	// `toast.promise` shows the loading toast, then the success or error one when the promise
	// settles. It returns the promise, so the caller can still await it.
	const upload = (fail: boolean) =>
		toast.promise(
			sleep(1800).then(() => {
				if (fail) throw new Error('The connection dropped');
				return 3;
			}),
			{
				id: 'upload',
				loading: { title: 'Uploading…', description: 'Sending your files' },
				success: (count) => ({ title: `${count} files uploaded` }),
				error: (error) => ({ title: 'Upload failed', description: (error as Error).message })
			}
		);

	// `toast.update` changes a toast that is on screen, from a patch or from a function of its
	// current options. A toast the user already closed is left alone.
	let batch = 0;
	const showBatch = () => {
		batch = 0;
		toast.info({ id: 'batch', title: 'Processed 0 of 5', duration: 8000, progress: true });
		const tick = setInterval(() => {
			batch += 1;
			toast.update('batch', { title: `Processed ${batch} of 5` });
			if (batch === 5) {
				clearInterval(tick);
				toast.update('batch', { color: 'success', title: 'All 5 processed' });
			}
		}, 700);
	};
</script>

<Toaster />

<DocPage
	title="Toast"
	subtitle="Transient notifications for feedback, alerts, and confirmations. Fire them imperatively from anywhere with the `toast` helper — a single <Toaster /> in your layout renders and stacks them."
	component="Toast"
	features={[
		'Imperative toast.color() helper API',
		'Eight color variants, plain or rich',
		'Six corner and center positions',
		'Swipe, drag or flick toward the edge to dismiss',
		'Stacked layout, hover and background tabs pause timers',
		'Update, dismiss and promise helpers',
		'Timers pause for hover, focus and swipes',
		'Loading spinner, progress bar & actions'
	]}
>
	<ComponentCard
		{controls}
		description="Fire a toast from anywhere with the toast helper. Mount a single <Toaster /> once in your layout. Drag or flick a toast toward its screen edge to dismiss it."
		code={`<script>
	import { Toaster, toast } from 'entasis/toast';
</scr${'ipt'}>

<Toaster />

	<Button
		onclick={() =>
			toast.${controls.value.color}({
				title: 'Hello',
				description: 'This is a toast',
				size: '${controls.value.size}',
				duration: ${controls.value.duration},
				richColors: ${controls.value.richColors},
				progress: ${controls.value.progress}
			})}
>
	Show toast
</Button>`}
	>
		<Button color={controls.value.color} onclick={showConfiguredToast}>Show toast</Button>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Types"
			description="Each semantic color ships a matching default icon — a check, info, warning, or error glyph."
			class="!min-h-fit"
			code={`toast.success({ title: 'Saved', description: 'Your changes were saved.' });
toast.info({ title: 'Heads up', description: 'A new version is available.' });
toast.warning({ title: 'Careful', description: 'This needs a review first.' });
toast.danger({ title: 'Something went wrong', description: 'Please try again.' });
toast.neutral({ title: 'Note', description: 'Just so you know.' });`}
		>
			<div class="flex flex-wrap justify-center gap-2">
				<Button
					color="success"
					variant="soft"
					onclick={() => toast.success({ title: 'Saved', description: 'Your changes were saved.' })}
				>
					Success
				</Button>
				<Button
					color="info"
					variant="soft"
					onclick={() =>
						toast.info({ title: 'Heads up', description: 'A new version is available.' })}
				>
					Info
				</Button>
				<Button
					color="warning"
					variant="soft"
					onclick={() =>
						toast.warning({ title: 'Careful', description: 'This needs a review first.' })}
				>
					Warning
				</Button>
				<Button
					color="danger"
					variant="soft"
					onclick={() =>
						toast.danger({ title: 'Something went wrong', description: 'Please try again.' })}
				>
					Danger
				</Button>
				<Button
					color="neutral"
					variant="soft"
					onclick={() => toast.neutral({ title: 'Note', description: 'Just so you know.' })}
				>
					Neutral
				</Button>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Rich colors"
			description="By default a toast is a neutral surface with a colored icon. Pass richColors to tint the whole toast in its semantic color."
			class="!min-h-fit"
			code={`// Default: neutral surface, colored icon
toast.success({ title: 'Saved' });

// Rich: fully tinted surface
toast.success({ title: 'Saved', richColors: true });`}
		>
			<div class="flex flex-col items-stretch gap-6 sm:flex-row sm:gap-12">
				<div class="flex flex-col items-center gap-2">
					<span class="text-neutral/70 text-xs font-medium tracking-wide uppercase"> Default </span>
					<div class="flex flex-wrap justify-center gap-2">
						<Button
							color="success"
							variant="soft"
							onclick={() => toast.success({ title: 'Saved', description: 'Neutral surface.' })}
						>
							Success
						</Button>
						<Button
							color="danger"
							variant="soft"
							onclick={() => toast.danger({ title: 'Failed', description: 'Neutral surface.' })}
						>
							Danger
						</Button>
						<Button
							color="info"
							variant="soft"
							onclick={() => toast.info({ title: 'Info', description: 'Neutral surface.' })}
						>
							Info
						</Button>
					</div>
				</div>
				<div class="flex flex-col items-center gap-2">
					<span class="text-neutral/70 text-xs font-medium tracking-wide uppercase">
						Rich colors
					</span>
					<div class="flex flex-wrap justify-center gap-2">
						<Button
							color="success"
							onclick={() =>
								toast.success({ title: 'Saved', description: 'Tinted surface.', richColors: true })}
						>
							Success
						</Button>
						<Button
							color="danger"
							onclick={() =>
								toast.danger({ title: 'Failed', description: 'Tinted surface.', richColors: true })}
						>
							Danger
						</Button>
						<Button
							color="info"
							onclick={() =>
								toast.info({ title: 'Info', description: 'Tinted surface.', richColors: true })}
						>
							Info
						</Button>
					</div>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Positions"
			description="Toasts anchor to any corner or edge-center. Set a default on the Toaster, or override per toast with the position option."
			class="!min-h-fit"
			code={`toast.info({ title: 'top-right', position: 'top-right' });
toast.info({ title: 'bottom-center', position: 'bottom-center' });`}
		>
			<div class="grid grid-cols-3 gap-2">
				{#each positions as position (position)}
					<Button
						variant="outline"
						color="neutral"
						size="small"
						onclick={() => toast.info({ title: position, position })}
					>
						{position}
					</Button>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Three sizes tune padding, radius, type and icon scale — small for dense UIs, large for prominent alerts."
			class="!min-h-fit"
			code={`toast.success({ title: 'Compact', size: 'small' });
toast.success({ title: 'Default', size: 'normal' });
toast.success({ title: 'Prominent', size: 'large' });

// or default every toast:
<Toaster size="large" />`}
		>
			<div class="flex flex-wrap justify-center gap-2">
				{#each sizes as size (size)}
					<Button
						variant="soft"
						color="success"
						onclick={() =>
							toast.success({
								title: size,
								description: 'The quick brown fox.',
								size,
								position: 'top-center'
							})}
					>
						{size}
					</Button>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Banners"
			description="banner-top and banner-bottom render a full screen-width bar pinned flush to the edge — for app-wide announcements. Swipe toward the edge to dismiss."
			class="!min-h-fit"
			code={`toast.info({
	title: 'Scheduled maintenance tonight at 2am UTC.',
	position: 'banner-top'
});

toast.warning({ title: 'You are offline.', position: 'banner-bottom' });`}
		>
			<div class="flex flex-wrap justify-center gap-2">
				<Button
					variant="soft"
					color="info"
					onclick={() =>
						toast.info({
							title: 'Scheduled maintenance tonight at 2am UTC.',
							position: 'banner-top'
						})}
				>
					Top banner
				</Button>
				<Button
					variant="soft"
					color="warning"
					onclick={() => toast.warning({ title: 'You are offline.', position: 'banner-bottom' })}
				>
					Bottom banner
				</Button>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Action toast (Undo)"
			description="The real-world Undo pattern. Deleting removes the item immediately; the toast carries an Undo action. The irreversible delete is deferred to onAutoDismiss — it runs only if the toast times out, so Undo cancels it. Hovering pauses the timer."
			class="!min-h-fit"
			code={`const deleteItem = (item) => {
	items = items.filter((i) => i.id !== item.id); // optimistic remove

	toast.neutral({
		title: \`Deleted "\${item.name}"\`,
		duration: 5000,
		actions: [
			{ content: 'Undo', color: 'primary', onclick: () => restore(item) }
		],
		// Runs ONLY on timeout — never when the toast is dismissed (Undo).
		onAutoDismiss: () => commitDelete(item)
	});
};`}
		>
			<div
				class="border-neutral-muted divide-neutral-muted w-full max-w-sm divide-y rounded-lg border"
			>
				{#each items as item (item.id)}
					<div class="flex items-center justify-between gap-2 px-3 py-2 text-sm">
						<span class="text-neutral truncate">{item.name}</span>
						<Button size="small" variant="ghost" color="danger" onclick={() => deleteItem(item)}>
							Delete
						</Button>
					</div>
				{/each}
				{#if !items.length}
					<p class="text-neutral/70 px-3 py-6 text-center text-sm">
						All items deleted. Reload the page to reset.
					</p>
				{/if}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Progress bar"
			description="Set progress to render a bar counting down the remaining duration. It pauses when you hover the toast, like the timer, and while the window is in the background. Set it on a single toast or on the Toaster to default it everywhere."
			class="!min-h-fit"
			code={`// per toast
toast.info({ title: 'Auto-dismissing', duration: 6000, progress: true });

// or as a default for every toast
<Toaster progress />`}
		>
			<Button
				color="info"
				variant="soft"
				onclick={() =>
					toast.info({
						title: 'Auto-dismissing',
						description: 'Hover to pause the countdown.',
						duration: 6000,
						progress: true
					})}
			>
				Show with progress
			</Button>
		</ComponentCard>

		<ComponentCard
			title="Loading &amp; updates"
			description="Show a spinner for a pending action, then call toast again with the same id once it resolves. A toast whose id is already on screen updates in place: the new options merge over the old ones, so keys you leave out keep their value, and its timer restarts."
			class="!min-h-fit"
			code={`toast.primary({
	id: 'save-changes',
	title: 'Saving changes…',
	// Omitted keys keep their value: clear the one a previous success set.
	description: undefined,
	loading: true,
	duration: false
});

// later, when the action resolves — same id, so the toast updates in place:
toast.success({
	id: 'save-changes',
	title: 'Changes saved',
	description: 'Your changes are now live.',
	loading: false,
	duration: 3000
});`}
		>
			<Button color="primary" onclick={showLoadingToast}>Save changes</Button>
		</ComponentCard>

		<ComponentCard
			title="Promise"
			description="toast.promise(promise, stages) shows a loading toast and turns it into the success or error toast when the promise settles. success and error take options or a function of the result. It returns the promise, and a toast the user dismissed while waiting is not shown again."
			class="!min-h-fit"
			code={`await toast.promise(uploadFiles(), {
	id: 'upload',
	loading: { title: 'Uploading…', description: 'Sending your files' },
	success: (count) => ({ title: \`\${count} files uploaded\` }),
	error: (error) => ({ title: 'Upload failed', description: error.message })
});`}
		>
			<div class="flex flex-wrap justify-center gap-2">
				<Button color="primary" onclick={() => upload(false).catch(() => {})}>Upload</Button>
				<Button color="danger" variant="soft" onclick={() => upload(true).catch(() => {})}>
					Upload and fail
				</Button>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Update and dismiss"
			description="toast.update(id, patch) changes a toast that is on screen: a patch, or a function of its current options. The countdown restarts and the toast's data-update-key attribute changes. toast.dismiss(id) closes one toast, toast.dismiss() all of them."
			class="!min-h-fit"
			code={`toast.info({ id: 'batch', title: 'Processed 0 of 5', duration: 8000, progress: true });

toast.update('batch', { title: 'Processed 3 of 5' });
toast.update('batch', (current) => ({ title: current.title + '!' }));
toast.update('batch', { color: 'success', title: 'All 5 processed' });

toast.dismiss('batch'); // one toast
toast.dismiss(); // every toast`}
		>
			<div class="flex flex-wrap justify-center gap-2">
				<Button color="info" variant="soft" onclick={showBatch}>Start batch</Button>
				<Button color="neutral" variant="outline" onclick={() => toast.dismiss()}>
					Dismiss all
				</Button>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Keyboard, focus and screen readers"
			description="Press F6 from anywhere to move focus into the notification region, then Tab through the toasts. Timers pause while the pointer or keyboard focus is on a stack, while a touch or swipe is on a toast, and while the window is in the background. Dismissing the focused toast moves focus to the next one. Toasts are announced through a live region that is always present."
			class="!min-h-fit"
			code={`<Toaster /> // a landmark named "Notifications", always rendered

toast.success({ title: 'Saved' }); // announced politely
toast.danger({ title: 'Payment failed', important: true }); // announced assertively`}
		>
			<div class="flex flex-wrap justify-center gap-2">
				<Button
					color="success"
					variant="soft"
					onclick={() =>
						toast.success({
							title: 'Saved',
							description: 'Press F6, then Tab, to reach this toast.',
							duration: 15000
						})}
				>
					Polite toast
				</Button>
				<Button
					color="danger"
					variant="soft"
					onclick={() =>
						toast.danger({ title: 'Payment failed', important: true, duration: 15000 })}
				>
					Important toast
				</Button>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
