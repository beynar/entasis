<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Card } from 'svelai/card';
	import { Form } from 'svelai/form';

	let message = $state('');
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<div class="gap-xl grid md:grid-cols-3">
		<aside>
			<h2 class="text-3xl font-semibold">What can we help with?</h2>
			<p class="mt-md text-neutral/65 text-sm">
				A little context helps us find the right answer faster.
			</p>
			<Stack gap="lg" class="mt-xl">
				<div>
					<strong class="text-sm">Product questions</strong>
					<p class="text-neutral/70 text-xs">Features, workflows, and getting started.</p>
				</div>
				<div>
					<strong class="text-sm">Technical issues</strong>
					<p class="text-neutral/70 text-xs">Something broken or behaving unexpectedly.</p>
				</div>
			</Stack>
		</aside>
		<Card class="md:col-span-2" title="New support request"
			><Stack gap="lg"
				><Form
					inputs={{
						type: {
							type: 'select',
							label: 'Request type',
							required: true,
							items: [
								{ value: 'question', label: 'Product question' },
								{ value: 'bug', label: 'Report a bug' },
								{ value: 'billing', label: 'Billing question' }
							]
						},
						severity: {
							type: 'radio',
							label: 'Impact',
							required: true,
							items: [
								{ value: 'normal', label: 'I can keep working' },
								{ value: 'urgent', label: 'My work is blocked' }
							]
						},
						subject: { type: 'text', label: 'Subject', required: true },
						details: { type: 'textarea', label: 'Details', required: true, maxLength: 2000 },
						email: { type: 'email', label: 'Contact email', required: true }
					}}
					actions={[{ children: 'Create local ticket draft', onAction: (form) => form.submit() }]}
					onSubmit={({ subject, type }) =>
						(message = `${type} ticket “${subject}” drafted locally. No message was sent.`)}
				/>{#if message}<Alert
						color="info"
						variant="soft"
						title="Demo result"
						description={message}
					/>{/if}</Stack
			></Card
		>
	</div>
</Stack>
