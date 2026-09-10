<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Card } from 'svelai/card';
	import { Form } from 'svelai/form';
	import type { FormInputs } from 'svelai/form';
	let message = $state('');
	let values = $state<{
		name?: string;
		email?: string;
		password?: string;
		confirm?: string;
		terms?: boolean;
	}>({});
	const inputs = {
		name: { type: 'text', label: 'Full name', required: true },
		email: { type: 'email', label: 'Work email', placeholder: 'you@company.com', required: true },
		password: {
			type: 'password',
			label: 'Password',
			required: true,
			onValidate: (value) => (value.length < 8 ? 'Use at least 8 characters.' : false)
		},
		confirm: {
			type: 'password',
			label: 'Confirm password',
			required: true,
			onValidate: (value) => (value !== values.password ? 'Passwords must match.' : false)
		},
		terms: { type: 'checkbox', label: 'I agree to the demo terms', required: true }
	} satisfies FormInputs;
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Card
		class="mx-auto w-full max-w-md"
		title="Create your account"
		description="Your next great project starts here."
		><Stack gap="lg">
			<Form
				{inputs}
				bind:value={values}
				actions={[
					{ children: 'Create account preview', fullWidth: true, onAction: (form) => form.submit() }
				]}
				onSubmit={({ name }) =>
					(message = `Account form for ${name} passed validation. No account was created.`)}
			/>{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
			<p class="text-center text-xs text-neutral/60">Local preview · No payment details required</p>
		</Stack></Card
	>
</Stack>
