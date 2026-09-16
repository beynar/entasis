<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Avatar } from 'svelai/avatar';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';

	let message = $state('');
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<div class="border-neutral-muted grid overflow-hidden rounded-lg border md:grid-cols-2">
		<aside class="gap-xl bg-surface-recessed p-lg sm:p-xl flex flex-col justify-between">
			<span class="text-lg font-semibold">Northstar</span>
			<div>
				<p class="text-4xl leading-tight font-light sm:text-5xl">
					The right work.<br />The right people.<br /><span class="text-primary-readable"
						>One place.</span
					>
				</p>
			</div>
			<div class="gap-md flex items-center">
				<Avatar name="Alex Morgan" />
				<p class="text-neutral/70 text-sm">
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
			<p class="text-neutral/70 text-xs">Local demonstration. No email is sent.</p>
		</Stack>
	</div>
</Stack>
