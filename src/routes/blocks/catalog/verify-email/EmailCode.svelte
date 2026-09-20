<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Alert } from 'entasis/alert';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Form } from 'entasis/form';

	let message = $state('');
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card
		class="mx-auto w-full max-w-md"
		title="Check your inbox"
		description="Enter the verification code for alex@example.com."
		><Stack gap="lg">
			<Form
				inputs={{
					code: {
						type: 'pin',
						label: 'Email verification code',
						length: 6,
						required: true,
						onValidate: (value) => (value === '123456' ? false : 'Use the demo code 123456.')
					}
				}}
				actions={[
					{ children: 'Verify email preview', fullWidth: true, onAction: (form) => form.submit() }
				]}
				onSubmit={() => (message = 'Demo email verification complete. No account was updated.')}
			/>
			<p class="text-neutral/70 text-sm">Preview code: <strong>123456</strong></p>
			<Button
				variant="ghost"
				onclick={() => (message = 'Resend preview requested. No email was sent.')}
				>Resend code</Button
			>{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
		</Stack></Card
	>
</Stack>
