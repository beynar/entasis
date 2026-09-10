<script lang="ts">
	import { Grid } from 'svelai/grid';
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
			onValidate: (value) => {
				if (value.length < 8) return 'Use at least 8 characters.';
				if (!/[A-Z]/.test(value)) return 'Include an uppercase letter.';
				if (!/[0-9]/.test(value)) return 'Include a number.';
				return false;
			}
		},
		confirm: {
			type: 'password',
			label: 'Confirm password',
			required: true,
			onValidate: (value) => (value !== values.password ? 'Passwords must match.' : false)
		}
	} satisfies FormInputs;
	let hasUppercase = $derived(/[A-Z]/.test(values.password ?? ''));
	let hasNumber = $derived(/[0-9]/.test(values.password ?? ''));
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Grid columns={{ minWidth: 220, max: 2 }} gap="xl">
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
		<Stack as="aside" gap="lg" justify="center" class="rounded-lg bg-primary-muted p-xl">
			<h3 class="text-xl font-semibold">A little stronger, a lot safer.</h3>
			<p class="text-sm text-neutral/65">Use a unique phrase that’s easy for you to remember.</p>
			<ul class="grid gap-md">
				<li>{(values.password?.length ?? 0) >= 8 ? '✓' : '○'} At least 8 characters</li>
				<li>{hasUppercase ? '✓' : '○'} An uppercase letter</li>
				<li>{hasNumber ? '✓' : '○'} A number</li>
			</ul>
			<p class="text-xs text-neutral/60">The checklist updates as you type.</p>
		</Stack>
	</Grid>
</Stack>
