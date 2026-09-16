<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Card } from 'svelai/card';
	import { Checkbox } from 'svelai/checkbox';
	import { Form } from 'svelai/form';
	import type { FormInputs } from 'svelai/form';
	let message = $state('');
	let remember = $state(false);
	const inputs = {
		email: { type: 'email', label: 'Work email', placeholder: 'you@company.com', required: true },
		password: {
			type: 'password',
			label: 'Password',
			required: true,
			onValidate: (value) => (value.length < 8 ? 'Use at least 8 characters.' : false)
		}
	} satisfies FormInputs;
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<div class="mx-auto w-full max-w-md">
		<Card title="Welcome back" description="Sign in to your Northstar workspace."
			><Stack gap="lg">
				<div
					class="bg-primary text-primary-contrast mx-auto grid size-12 place-items-center rounded-lg text-xl font-bold"
				>
					N
				</div>
				<Form
					{inputs}
					actions={[{ children: 'Sign in', fullWidth: true, onAction: (form) => form.submit() }]}
					onSubmit={({ email }) =>
						(message = `Credentials for ${email} passed local validation. Connect your authentication service to sign in.`)}
				/><Checkbox label="Remember this device" bind:value={remember} />{#if message}<Alert
						color="info"
						variant="soft"
						title="Demo result"
						description={message}
					/>{/if}
				<p class="text-neutral/70 text-center text-xs">
					Protected workspace · Local form demonstration
				</p>
			</Stack></Card
		>
	</div>
</Stack>
