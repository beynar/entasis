<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Card } from 'svelai/card';
	import { Form } from 'svelai/form';
	import type { FormInputs } from 'svelai/form';
	let message = $state('');
	let values = $state<{ password?: string; confirm?: string }>({});
	const inputs = {
		password: {
			type: 'password',
			label: 'New password',
			required: true,
			onValidate: (value) => (value.length < 8 ? 'Use at least 8 characters.' : false)
		},
		confirm: {
			type: 'password',
			label: 'Confirm password',
			required: true,
			onValidate: (value) => (value !== values.password ? 'Passwords must match.' : false)
		}
	} satisfies FormInputs;
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<div class="mx-auto w-full max-w-md">
		<Card title="Set a new password" description="Use a password you haven’t used here before."
			><Stack gap="lg">
				<Form
					{inputs}
					bind:value={values}
					actions={[
						{
							children: 'Save password preview',
							fullWidth: true,
							onAction: (form) => form.submit()
						}
					]}
					onSubmit={() =>
						(message = 'Password passed local validation. No account password was changed.')}
				/>{#if message}<Alert
						color="info"
						variant="soft"
						title="Demo result"
						description={message}
					/>{/if}
			</Stack></Card
		>
	</div>
</Stack>
