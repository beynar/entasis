<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Avatar } from 'svelai/avatar';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';

	let message = $state('');
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<div class="grid overflow-hidden rounded-lg border border-neutral-muted md:grid-cols-2">
		<aside class="flex flex-col justify-between gap-xl bg-surface-recessed p-lg sm:p-xl">
			<span class="text-lg font-semibold">Northstar</span>
			<div>
				<p class="text-4xl font-light sm:text-5xl leading-tight">
					The right work.<br />The right people.<br /><span class="text-primary-readable"
						>One place.</span
					>
				</p>
			</div>
			<div class="flex items-center gap-md">
				<Avatar user={{ name: 'Alex Morgan' }} />
				<p class="text-sm text-neutral/60">
					“Back to the work that matters.”<br />Alex, product designer
				</p>
			</div>
		</aside>
		<Stack gap="lg" justify="center" class="p-lg sm:p-xl">
			<Chip color="primary">Passwordless access</Chip>
			<h2 class="text-3xl font-semibold">Make yourself at home.</h2>
			<Form
				inputs={{ email: { type: 'email', label: 'Work email', required: true } }}
				actions={[
					{
						children: 'Preview my sign-in link',
						fullWidth: true,
						onAction: (form) => form.submit()
					}
				]}
				onSubmit={({ email }) =>
					(message = `Sign-in email preview for ${email}. Connect a provider to send a real link.`)}
			/>{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
			<p class="text-xs text-neutral/60">Local demonstration. No email is sent.</p>
		</Stack>
	</div>
</Stack>
