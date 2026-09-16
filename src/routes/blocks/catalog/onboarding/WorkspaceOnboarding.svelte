<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { MultiStepForm } from 'svelai/multi-step-form';

	let message = $state('');
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<div class="gap-xl grid md:grid-cols-3">
		<aside>
			<Chip color="primary">A good beginning</Chip>
			<h2 class="mt-lg text-3xl font-semibold">Let’s make this space yours.</h2>
			<p class="mt-md text-neutral/65 text-sm">A few details help your team get started.</p>
			<div class="mt-xl bg-primary-muted p-lg rounded-lg text-sm">
				Your progress stays here while you complete the steps.
			</div>
		</aside>
		<Card class="md:col-span-2"
			><Stack gap="lg"
				><MultiStepForm
					items={[
						{
							title: 'About you',
							description: 'How should your team know you?',
							inputs: {
								name: { type: 'text', label: 'Your name', required: true },
								role: {
									type: 'select',
									label: 'Your role',
									required: true,
									items: [
										{ value: 'design', label: 'Design' },
										{ value: 'engineering', label: 'Engineering' },
										{ value: 'product', label: 'Product' }
									]
								}
							}
						},
						{
							title: 'Your workspace',
							inputs: {
								workspace: { type: 'text', label: 'Workspace name', required: true },
								size: {
									type: 'select',
									label: 'Team size',
									required: true,
									items: [
										{ value: 'solo', label: 'Just me' },
										{ value: 'small', label: '2–10 people' },
										{ value: 'growing', label: '11–50 people' }
									]
								}
							}
						},
						{
							title: 'Stay in the loop',
							inputs: {
								digest: { type: 'switch', label: 'Weekly progress digest' },
								updates: { type: 'switch', label: 'Product news' }
							}
						}
					]}
					submitText="Finish preview"
					onSubmitForm={() => {
						message = 'Onboarding complete in this preview. No workspace was created.';
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
