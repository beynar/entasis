<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Form } from 'svelai/form';
	import { envelopeIcon } from 'svelai/icons/envelope';
	let message = $state('');
	let address = $state('alex@example.com');
	let editing = $state(false);
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Stack gap="lg" class="mx-auto w-full max-w-xl text-center">
		<div class="mx-auto rounded-full bg-primary-muted p-xl text-4xl">{@render envelopeIcon()}</div>
		<h2 class="text-3xl font-semibold">You’re one click away.</h2>
		<p class="text-neutral/65">
			A verification email would arrive at <strong class="text-neutral">{address}</strong>.
		</p>
		<Alert
			color="info"
			title="Inbox preview"
			description="This example does not send email or verify a real account."
		/><Card
			><Stack gap="lg" class="text-left">
				<h3 class="font-semibold">Can’t find the email?</h3>
				<p class="text-sm text-neutral/65">
					Check your spam folder, or confirm you entered the right address.
				</p>
				<Button variant="outline" onclick={() => (editing = !editing)}>Change email address</Button
				>{#if editing}<Form
						inputs={{ email: { type: 'email', label: 'Email address', required: true } }}
						defaultValue={{ email: address }}
						actions={[
							{
								children: 'Update preview address',
								fullWidth: true,
								onAction: (form) => form.submit()
							}
						]}
						onSubmit={({ email }) => {
							address = email;
							editing = false;
						}}
					/>{/if}<Button
					variant="ghost"
					onclick={() => (message = 'Resend requested in the preview. No email was sent.')}
					>Resend verification email</Button
				>{#if message}<Alert
						color="info"
						variant="soft"
						title="Demo result"
						description={message}
					/>{/if}
			</Stack></Card
		>
	</Stack>
</Stack>
