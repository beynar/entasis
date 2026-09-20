<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Accordion } from 'entasis/accordion';
	import { Alert } from 'entasis/alert';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Dialog } from 'entasis/dialog';
	import { Form } from 'entasis/form';
	import { TextInput } from 'entasis/text-input';

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
	let query = $state<string | null>('');
	let contact = $state(false);
	let matches = $derived(
		questions.filter((question) =>
			(question.title + ' ' + question.content).toLowerCase().includes((query ?? '').toLowerCase())
		)
	);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Stack gap="xl" class="mx-auto w-full max-w-3xl">
		<header class="text-center">
			<p class="text-primary-readable text-sm">Help center</p>
			<h2 class="mt-sm text-4xl font-semibold">What’s on your mind?</h2>
			<p class="mt-md text-neutral/65">Search for a question, a feature, or a workflow.</p>
		</header>
		<TextInput
			label="Search help articles"
			placeholder="Try notifications, team, or exports"
			bind:value={query}
		/>
		<p class="text-neutral/70 text-sm" aria-live="polite">{matches.length} matching answers</p>
		{#if matches.length}<Accordion items={matches} oneAtATime variant="card" />{:else}<Card
				title="No matching answers"
				description="Try a shorter search or contact the team below."
			/>{/if}<Card
			title="A human touch helps."
			description="If you haven’t found what you need, prepare a support request."
			><Button variant="outline" onclick={() => (contact = true)}>Contact support</Button></Card
		>
	</Stack>
	<Dialog
		bind:open={contact}
		title="Tell us what’s happening"
		description="This form creates a local request preview."
		><Stack gap="lg"
			><Form
				inputs={{
					email: { type: 'email', label: 'Email address', required: true },
					question: { type: 'textarea', label: 'Your question', required: true }
				}}
				actions={[{ children: 'Prepare request', onAction: (form) => form.submit() }]}
				onSubmit={() => (message = 'Support request drafted locally. No message was sent.')}
			/>{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}</Stack
		></Dialog
	>
</Stack>
