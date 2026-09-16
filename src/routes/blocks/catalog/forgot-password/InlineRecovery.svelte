<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';

	let message = $state('');
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<div class="gap-xl grid md:grid-cols-3">
		<div>
			<Chip color="neutral">Account / Recovery</Chip>
			<h2 class="mt-lg text-3xl font-semibold">A fresh start.</h2>
			<p class="mt-md text-neutral/65 text-sm">
				Use the email you registered with. You’ll keep your projects and team access.
			</p>
		</div>
		<div class="gap-lg grid md:col-span-2">
			<Form
				variant="sectioned"
				title="Reset access"
				description="This preview validates your email without sending a message."
				inputs={{ email: { type: 'email', label: 'Work email', required: true } }}
				actions={[
					{ children: 'Request recovery link', fullWidth: true, onAction: (form) => form.submit() }
				]}
				onSubmit={({ email }) =>
					(message = `Recovery request preview for ${email}. No email was sent.`)}
			/>{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}<Card
				title="Still having trouble?"
				description="If you use your company’s single sign-on, contact your workspace administrator."
				variant="outline"
			/>
		</div>
	</div>
</Stack>
