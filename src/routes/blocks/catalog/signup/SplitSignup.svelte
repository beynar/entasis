<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Card } from 'svelai/card';
	import { Form } from 'svelai/form';
	import { Meter } from 'svelai/meter';

	let message = $state('');
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<div class="border-neutral-muted grid overflow-hidden rounded-lg border md:grid-cols-2">
		<Stack gap="lg" class="p-lg sm:p-xl">
			<strong class="text-lg">Northstar</strong>
			<h2 class="text-3xl font-semibold">Make room for better work.</h2>
			<Form
				inputs={{
					name: { type: 'text', label: 'Your name', required: true },
					email: { type: 'email', label: 'Work email', required: true },
					password: {
						type: 'password',
						label: 'Password',
						required: true,
						onValidate: (value) => (value.length < 8 ? 'Use at least 8 characters.' : false)
					}
				}}
				actions={[
					{ children: 'Start your workspace', fullWidth: true, onAction: (form) => form.submit() }
				]}
				onSubmit={({ name }) =>
					(message = `Workspace signup preview for ${name}. No account was created.`)}
			/>{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
		</Stack>
		<Stack as="aside" gap="lg" justify="center" class="bg-primary-muted p-lg sm:p-xl">
			<h3 class="text-2xl font-semibold">From a good idea to a great launch.</h3>
			<Card title="Website launch" description="Product design · Team workspace"
				><Stack gap="md">
					<div class="flex justify-between text-sm">
						<span>Launch readiness</span><strong>75%</strong>
					</div>
					<Meter
						value={75}
						color="primary"
					/>{#each ['Research complete', 'Design review complete', 'Build in progress'] as label (label)}<div
							class="bg-surface-recessed p-md rounded-md text-sm"
						>
							{label}
						</div>{/each}
				</Stack></Card
			>
			<p class="text-neutral/70 text-sm">Plan, create, and make progress together.</p>
		</Stack>
	</div>
</Stack>
