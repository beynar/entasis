<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';
	import { RadioInput } from 'svelai/radio-input';

	let message = $state('');
	let plan = $state<string | null>('Starter');
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Stack gap="lg" class="mx-auto w-full max-w-2xl">
		<div class="text-center">
			<Chip color="primary">14-day trial preview</Chip>
			<h2 class="mt-lg text-3xl font-semibold">Choose your starting point.</h2>
		</div>
		<RadioInput
			label="Workspace plan"
			mode="card"
			items={[
				{ value: 'Starter', label: 'Starter', description: 'For your own projects · Free' },
				{ value: 'Team', label: 'Team', description: 'For shared work · $18 / member' }
			]}
			bind:value={plan}
		/><Card title="Your details" description={`${plan} workspace · Account setup preview`}
			><Stack gap="lg"
				><Form
					inputs={{
						name: { type: 'text', label: 'Full name', required: true },
						email: { type: 'email', label: 'Work email', required: true }
					}}
					actions={[{ children: 'Continue', fullWidth: true, onAction: (form) => form.submit() }]}
					onSubmit={({ name }) =>
						(message = `${name}, your ${plan} plan selection is ready. No subscription or account was created.`)}
				/>{#if message}<Alert
						color="info"
						variant="soft"
						title="Demo result"
						description={message}
					/>{/if}</Stack
			></Card
		>
	</Stack>
</Stack>
