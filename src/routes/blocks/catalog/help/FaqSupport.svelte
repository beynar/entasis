<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Accordion } from 'svelai/accordion';
	import { Alert } from 'svelai/alert';
	import { Card } from 'svelai/card';
	import { Form } from 'svelai/form';

	const questions = [
		{
			title: 'How do I invite my team?',
			content:
				'Open workspace settings, choose Members, and use Invite a teammate. Choose a role before sending an invitation.'
		},
		{
			title: 'Can I change my plan later?',
			content:
				'Yes. Your workspace administrator can review available plans from the billing settings.'
		},
		{
			title: 'Where can I find my exports?',
			content:
				'Project exports appear in the project activity panel. Open the latest completed export to download it.'
		},
		{
			title: 'How do I manage notifications?',
			content:
				'Open your profile settings and choose Notifications. Set each activity type and delivery channel to suit your workday.'
		}
	];
	let message = $state('');
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header>
		<p class="text-sm text-primary-readable">We’re here to help</p>
		<h2 class="mt-sm text-3xl font-semibold">Let’s get you unstuck.</h2>
	</header>
	<div class="grid items-start gap-xl md:grid-cols-2">
		<Stack gap="lg">
			<h3 class="text-xl font-semibold">A few quick answers</h3>
			<Accordion items={questions} oneAtATime /><Card
				title="A useful support request"
				variant="soft"
				><p class="text-sm text-neutral/65">
					Tell us what you expected, what happened, and the steps that led there.
				</p></Card
			>
		</Stack>
		<Card
			title="Still need a hand?"
			description="Describe the issue and we’ll prepare a local ticket preview."
			><Stack gap="lg"
				><Form
					inputs={{
						email: { type: 'email', label: 'Your email', required: true },
						subject: { type: 'text', label: 'Subject', required: true },
						message: { type: 'textarea', label: 'How can we help?', required: true }
					}}
					actions={[{ children: 'Prepare ticket preview', onAction: (form) => form.submit() }]}
					onSubmit={({ subject }) =>
						(message = `Ticket draft “${subject}” is ready. No support request was sent.`)}
				/>{#if message}<Alert
						color="info"
						variant="soft"
						title="Demo result"
						description={message}
					/>{/if}</Stack
			></Card
		>
	</div>
</Stack>
