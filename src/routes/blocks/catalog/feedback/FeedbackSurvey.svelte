<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { MultiStepForm } from 'svelai/multi-step-form';

	let message = $state('');
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<div class="grid gap-xl md:grid-cols-3">
		<aside>
			<Chip color="primary">Two minutes well spent</Chip>
			<h2 class="mt-lg text-3xl font-semibold">Help shape what comes next.</h2>
			<p class="mt-md text-sm text-neutral/65">
				Tell us what’s working and what could work better.
			</p>
			<div class="mt-xl flex items-center gap-md">
				<Avatar user={{ name: 'Maya Chen' }} />
				<p class="text-xs text-neutral/60">
					Maya, product team<br />Every piece of feedback matters.
				</p>
			</div>
		</aside>
		<Card class="md:col-span-2"
			><Stack gap="lg"
				><MultiStepForm
					items={[
						{
							title: 'Your experience',
							inputs: {
								rating: {
									type: 'rating',
									label: 'How useful is Northstar to you?',
									required: true
								},
								frequency: {
									type: 'radio',
									label: 'How often do you use it?',
									required: true,
									items: [
										{ value: 'daily', label: 'Every day' },
										{ value: 'weekly', label: 'A few times a week' },
										{ value: 'sometimes', label: 'Occasionally' }
									]
								}
							}
						},
						{
							title: 'A little more detail',
							inputs: {
								best: { type: 'textarea', label: 'What works well?', required: true },
								improve: { type: 'textarea', label: 'What would you change?' }
							}
						},
						{
							title: 'Stay in touch',
							inputs: {
								email: { type: 'email', label: 'Email (optional)' },
								contact: { type: 'checkbox', label: 'You may contact me about my feedback' }
							}
						}
					]}
					submitText="Finish survey preview"
					onSubmitForm={() => {
						message = 'Survey completed locally. No feedback or contact details were sent.';
					}}
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
