<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Form, type FormInputs } from 'svelai/form';
	import { Select } from 'svelai/select';

	let message = $state('');
	let recipients = $state<string[]>(['sam@example.com']);
	let draft = $state<{ email?: string }>({});
	let role = $state<string | null>('Editor');
	const inputs = {
		email: {
			type: 'email',
			label: 'Teammate’s email',
			required: true,
			onValidate: (value) =>
				recipients.includes(value.toLowerCase()) ? 'This email is already in the list.' : false
		}
	} satisfies FormInputs;
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Card
		class="mx-auto w-full max-w-2xl"
		title="Build your team"
		description="Add colleagues to a local invitation list."
		><Stack gap="lg">
			<Form
				{inputs}
				bind:value={draft}
				actions={[
					{ children: 'Add recipient', variant: 'outline', onAction: (form) => form.submit() }
				]}
				onSubmit={({ email }) => {
					recipients = [...recipients, email.toLowerCase()];
					draft = { email: '' };
					message = '';
				}}
			/>
			<Stack orientation="horizontal" wrap="wrap" gap="sm">
				{#each recipients as recipient (recipient)}<Chip
						onclick={() => (recipients = recipients.filter((email) => email !== recipient))}
						>{recipient} ×</Chip
					>{:else}<p class="text-sm text-neutral/60">No recipients added yet.</p>{/each}
			</Stack>
			<Select
				label="Everyone joins as"
				bind:value={role}
				items={[
					{ value: 'Editor', label: 'Editor — can create and edit' },
					{ value: 'Viewer', label: 'Viewer — read and comment' }
				]}
			/><Button
				disabled={recipients.length === 0}
				onclick={() =>
					(message = `${recipients.length} ${role?.toLowerCase()} invitations prepared locally. No email was sent.`)}
				>Prepare {recipients.length} invitations</Button
			>{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
			<p class="text-xs text-neutral/60">Select an email chip to remove it.</p>
		</Stack></Card
	>
</Stack>
