<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Dialog } from 'svelai/dialog';
	import { Form } from 'svelai/form';
	import { Table } from 'svelai/table';

	let open = $state(false);
	let members = $state([
		{ email: 'alex@example.com', role: 'Admin', status: 'Active' },
		{ email: 'maya@example.com', role: 'Editor', status: 'Active' }
	]);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header class="gap-lg flex flex-wrap items-end justify-between">
		<div>
			<h2 class="text-3xl font-semibold">Better together.</h2>
			<p class="mt-sm text-neutral/70 text-sm">Invite people to your demo workspace.</p>
		</div>
		<Button onclick={() => (open = true)}>Invite a teammate</Button>
	</header>
	<Card
		><Table
			header={{ email: 'Email', role: 'Role', status: 'Status' }}
			items={members.map((member) => ({ cells: member }))}
		/></Card
	><Dialog
		bind:open
		title="Invite a teammate"
		description="This creates a pending invitation in the local preview."
		><Form
			inputs={{
				email: {
					type: 'email',
					label: 'Work email',
					required: true,
					onValidate: (value) =>
						members.some((member) => member.email.toLowerCase() === value.toLowerCase())
							? 'This email is already listed.'
							: false
				},
				role: {
					type: 'select',
					label: 'Role',
					required: true,
					items: [
						{ value: 'Editor', label: 'Editor — create and edit projects' },
						{ value: 'Viewer', label: 'Viewer — read and comment' }
					]
				}
			}}
			actions={[{ children: 'Add demo invitation', onAction: (form) => form.submit() }]}
			onSubmit={({ email, role }) => {
				members = [...members, { email, role, status: 'Pending (demo)' }];
				open = false;
			}}
		/></Dialog
	>
</Stack>
