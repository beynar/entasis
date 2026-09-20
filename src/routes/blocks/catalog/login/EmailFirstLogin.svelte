<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Alert } from 'entasis/alert';
	import { Button } from 'entasis/button';
	import { Form } from 'entasis/form';
	import { Separator } from 'entasis/separator';

	let message = $state('');
	let showEmail = $state(false);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<div class="border-neutral-muted grid overflow-hidden rounded-lg border md:grid-cols-2">
		<Stack
			as="aside"
			gap="xl"
			justify="between"
			class=" bg-primary p-lg sm:p-xl text-primary-contrast"
		>
			<strong class="text-xl">northstar / workspace</strong>
			<div>
				<p class="mb-md text-sm">LESS ADMIN. MORE MOMENTUM.</p>
				<h2 class="text-4xl font-semibold tracking-tight">
					Your team’s next great idea starts here.
				</h2>
			</div>
			<p class="text-sm">A shared space for thoughtful work.</p>
		</Stack>
		<Stack gap="lg" justify="center" class="bg-surface p-lg sm:p-xl">
			<h2 class="text-2xl font-semibold">Find your workspace</h2>
			<Button
				variant="outline"
				color="neutral"
				onclick={() =>
					(message = 'Google authentication needs a connected provider. No account was accessed.')}
				>Continue with Google</Button
			><Button
				variant="outline"
				color="neutral"
				onclick={() =>
					(message = 'Enterprise SSO needs your identity provider. This is a local preview.')}
				>Continue with SSO</Button
			><Separator /><Button variant="ghost" onclick={() => (showEmail = !showEmail)}
				>{showEmail ? 'Hide email form' : 'Use email instead'}</Button
			>{#if showEmail}<Form
					inputs={{ email: { type: 'email', label: 'Email address', required: true } }}
					actions={[
						{ children: 'Continue with email', fullWidth: true, onAction: (form) => form.submit() }
					]}
					onSubmit={({ email }) => (message = `Email ${email} is valid. No sign-in link was sent.`)}
				/>{/if}{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
		</Stack>
	</div>
</Stack>
