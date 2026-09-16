<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form } from 'svelai/form';

	let message = $state('');
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Grid columns={{ minWidth: 220, max: 2 }} gap="xl">
		<Stack as="aside" gap="lg" justify="center" class="bg-primary-muted p-xl rounded-lg">
			<Chip color="primary" variant="solid">Invitation from Maya Chen</Chip>
			<h2 class="text-3xl font-semibold">Good work happens together.</h2>
			<p class="text-neutral/65">Join the team building a calmer way to work.</p>
			<ul class="gap-md grid text-sm">
				<li>✓ Shared projects and decisions</li>
				<li>✓ One home for your team’s knowledge</li>
				<li>✓ Editor access to the Design workspace</li>
			</ul>
			<Stack orientation="horizontal" gap="sm">
				{#each ['Maya Chen', 'Sam Rivera', 'Alex Park'] as name (name)}<Avatar {name} />{/each}
			</Stack>
		</Stack>
		<Card title="Join Northstar" description="Create your local preview profile."
			><Stack gap="lg"
				><Form
					inputs={{
						name: { type: 'text', label: 'Your name', required: true },
						email: { type: 'email', label: 'Invited email', required: true },
						password: {
							type: 'password',
							label: 'Choose a password',
							required: true,
							onValidate: (value) => (value.length < 8 ? 'Use at least 8 characters.' : false)
						}
					}}
					actions={[
						{ children: 'Join workspace', fullWidth: true, onAction: (form) => form.submit() }
					]}
					onSubmit={({ name }) =>
						(message = `Welcome, ${name}. Your demo profile is ready; no account was created.`)}
				/>{#if message}<Alert
						color="info"
						variant="soft"
						title="Demo result"
						description={message}
					/>{/if}</Stack
			></Card
		>
	</Grid>
</Stack>
