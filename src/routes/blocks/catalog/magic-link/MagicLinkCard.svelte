<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Alert } from 'entasis/alert';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Form } from 'entasis/form';
	import { Separator } from 'entasis/separator';

	let address = $state('');
	let resends = $state(0);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card
		class="mx-auto w-full max-w-md"
		title="A little less to remember"
		description="Access your workspace with a one-time email link."
		><Stack gap="lg">
			{#if address}<Alert
					color="info"
					title="Email link preview"
					description={`A link would be sent to ${address}. No email was sent.`}
				/><Button variant="outline" onclick={() => (resends += 1)}>Preview another link</Button>
				<p class="text-neutral/70 text-xs" aria-live="polite">{resends} resend previews</p>
				<Button variant="ghost" onclick={() => (address = '')}>Change email</Button>{:else}<Form
					inputs={{
						email: {
							type: 'email',
							label: 'Your email',
							required: true,
							placeholder: 'you@company.com'
						}
					}}
					actions={[
						{ children: 'Continue with email', fullWidth: true, onAction: (form) => form.submit() }
					]}
					onSubmit={({ email }) => (address = email)}
				/>{/if}<Separator />
			<p class="text-neutral/70 text-center text-xs">One link. One use. Your next workday.</p>
		</Stack></Card
	>
</Stack>
