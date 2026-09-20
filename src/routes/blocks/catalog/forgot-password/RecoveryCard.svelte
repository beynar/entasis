<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Form } from 'entasis/form';

	let submitted = $state(false);
	let address = $state('');
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card
		class="mx-auto w-full max-w-md"
		title="Forgot your password?"
		description="Let’s get you back into your workspace."
		><Stack gap="lg">
			{#if submitted}<div class="bg-primary-muted p-lg rounded-lg">
					<h3 class="font-semibold">Check-inbox preview</h3>
					<p class="mt-sm text-sm">
						A recovery link would be sent to <strong>{address}</strong> after connecting an authentication
						service. No email was sent.
					</p>
				</div>
				<Button variant="outline" onclick={() => (submitted = false)}>Use another email</Button
				>{:else}<Form
					inputs={{
						email: {
							type: 'email',
							label: 'Account email',
							placeholder: 'you@company.com',
							required: true
						}
					}}
					actions={[
						{ children: 'Preview recovery', fullWidth: true, onAction: (form) => form.submit() }
					]}
					onSubmit={({ email }) => {
						address = email;
						submitted = true;
					}}
				/>{/if}
			<p class="text-neutral/70 text-xs">
				For security, a live service should return the same message for every email.
			</p>
		</Stack></Card
	>
</Stack>
