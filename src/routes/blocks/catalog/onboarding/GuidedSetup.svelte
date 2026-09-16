<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Dialog } from 'svelai/dialog';
	import { MultiStepForm } from 'svelai/multi-step-form';

	let open = $state(false);
	let complete = $state(false);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card
		class="mx-auto w-full max-w-xl"
		title="Welcome aboard, Alex"
		description="Build a workspace that fits the way you work."
		><Stack gap="lg">
			<Grid columns={{ minWidth: 170, max: 3 }} gap="md">
				{#each ['Introduce yourself', 'Pick your focus', 'Set your pace'] as title, index (title)}<div
						class="bg-surface-recessed p-md rounded-lg"
					>
						<Chip color={complete ? 'success' : 'neutral'}>{complete ? '✓' : index + 1}</Chip>
						<p class="mt-md text-sm font-medium">{title}</p>
					</div>{/each}
			</Grid>
			<Button onclick={() => (open = true)}
				>{complete ? 'Review setup' : 'Let’s get started'}</Button
			>{#if complete}<Alert
					color="success"
					title="Preview setup complete"
					description="Your choices are saved in this local block until it reloads."
				/>{/if}
		</Stack></Card
	><Dialog
		bind:open
		title="Make yourself at home"
		description="Three small steps to shape your demo workspace."
		><MultiStepForm
			items={[
				{
					title: 'Your name',
					inputs: { name: { type: 'text', label: 'Display name', required: true } }
				},
				{
					title: 'Choose a focus',
					inputs: {
						focus: {
							type: 'radio',
							label: 'What brings you here?',
							mode: 'card',
							required: true,
							items: [
								{ value: 'projects', label: 'Manage projects' },
								{ value: 'knowledge', label: 'Organize knowledge' },
								{ value: 'team', label: 'Bring a team together' }
							]
						}
					}
				},
				{
					title: 'Your rhythm',
					inputs: { digest: { type: 'switch', label: 'Send a weekly progress summary' } }
				}
			]}
			submitText="Complete setup"
			onSubmitForm={() => {
				complete = true;
				open = false;
			}}
		/></Dialog
	>
</Stack>
