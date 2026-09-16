<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Form } from 'svelai/form';

	let message = $state('');
	const defaults = {
		mentions: true,
		assignments: true,
		milestones: false,
		weekly: true,
		product: false
	};
	let preferences = $state({ ...defaults });
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<div class="gap-xl grid md:grid-cols-3">
		<aside>
			<h2 class="text-3xl font-semibold">A little less noise.</h2>
			<p class="mt-md text-neutral/65 text-sm">Choose the updates that deserve your attention.</p>
		</aside>
		<div class="gap-lg grid md:col-span-2">
			<Form
				variant="sectioned"
				inputs={{
					activity: {
						type: 'group',
						label: 'Workspace activity',
						description: 'Updates about the work you follow.',
						columns: 1,
						inputs: {
							mentions: {
								type: 'switch',
								label: 'Mentions and replies',
								description: 'When a teammate needs your attention.'
							},
							assignments: {
								type: 'switch',
								label: 'Task assignments',
								description: 'When new work is assigned to you.'
							},
							milestones: {
								type: 'switch',
								label: 'Project milestones',
								description: 'Important progress from your projects.'
							}
						}
					},
					digest: {
						type: 'group',
						label: 'Summaries',
						columns: 1,
						inputs: {
							weekly: { type: 'switch', label: 'Weekly progress digest' },
							product: { type: 'switch', label: 'Product news and tips' }
						}
					}
				}}
				bind:value={preferences}
				actions={[
					{
						children: 'Reset',
						variant: 'ghost',
						onAction: () => {
							preferences = { ...defaults };
							message = 'Defaults restored in this preview.';
						}
					},
					{ children: 'Save preferences', onAction: (form) => form.submit() }
				]}
				onSubmit={() => (message = 'Notification preferences saved locally for this preview.')}
			/>{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
		</div>
	</div>
</Stack>
