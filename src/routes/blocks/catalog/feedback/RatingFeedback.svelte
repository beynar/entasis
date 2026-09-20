<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Alert } from 'entasis/alert';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Dialog } from 'entasis/dialog';
	import { Form } from 'entasis/form';

	let open = $state(false);
	let submitted = $state(false);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card
		class="mx-auto w-full max-w-xl"
		title="Everything back on track?"
		description="Your support request has been resolved in this sample workspace."
		><Stack gap="lg">
			<div class="bg-success-muted p-lg rounded-lg">
				<h3 class="font-semibold">Export issue resolved</h3>
				<p class="mt-sm text-neutral/65 text-sm">Maya helped you restore the project export.</p>
			</div>
			<Button onclick={() => (open = true)}
				>{submitted ? 'Update feedback' : 'Share your feedback'}</Button
			>{#if submitted}<Alert
					color="success"
					title="Feedback recorded in this preview"
					description="Thank you for helping improve the experience. Nothing was sent."
				/>{/if}
		</Stack></Card
	><Dialog
		bind:open
		type="drawerRight"
		title="How did we do?"
		description="Your feedback helps us make support more useful."
		><Form
			inputs={{
				rating: { type: 'rating', label: 'Your experience', required: true },
				comment: {
					type: 'textarea',
					label: 'What could be better?',
					placeholder: 'A few words go a long way…',
					maxLength: 500
				},
				followUp: { type: 'checkbox', label: 'I am open to a follow-up' }
			}}
			actions={[{ children: 'Save feedback locally', onAction: (form) => form.submit() }]}
			onSubmit={() => {
				submitted = true;
				open = false;
			}}
		/></Dialog
	>
</Stack>
