<script lang="ts">
	import { Alert } from 'entasis/alert';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Checkbox } from 'entasis/checkbox';
	import { confirmation } from 'entasis/confirmation';
	import { Stack } from 'entasis/stack';
	import { checkCircleIcon } from 'entasis/icons/checkCircle';
	import { trashIcon } from 'entasis/icons/trash';
	import { warningCircleIcon } from 'entasis/icons/warningCircle';

	let acknowledged = $state(false);
	let outcome = $state<'idle' | 'cancelled' | 'deleted'>('idle');

	async function requestDeletion() {
		const { confirmed } = await confirmation({
			title: 'Delete Northstar workspace?',
			description:
				'Northstar, its 24 projects, and every shared file will be permanently deleted. This action cannot be undone.',
			confirm: {
				text: 'Delete workspace',
				color: 'danger',
				variant: 'solid',
				prefix: trashIcon
			},
			cancel: {
				text: 'Keep workspace',
				variant: 'outline'
			},
			onConfirm: async () => {
				await new Promise<void>((resolve) => setTimeout(resolve, 800));
				acknowledged = false;
				outcome = 'deleted';
			}
		});

		if (!confirmed) outcome = 'cancelled';
	}
</script>

<Stack align="center">
	<Card class="w-full max-w-2xl" variant="outline" color="danger" density="normal" showBorders>
		{#snippet title()}Danger zone{/snippet}
		{#snippet description()}
			Permanent workspace actions require an explicit review of their consequences.
		{/snippet}

		<Stack gap="lg">
			<Alert
				color="warning"
				variant="soft"
				prefix={warningCircleIcon}
				title="This removes the workspace for everyone"
				description="Members lose access immediately. Projects, uploads, comments, and audit history are not recoverable."
			/>

			<Stack gap="md">
				<h2 class="text-neutral text-base font-semibold">Deleting Northstar will remove</h2>
				<ul class="text-neutral/70 gap-sm pl-xl flex list-disc flex-col text-sm">
					<li>24 active projects and their complete history</li>
					<li>18.4 GB of files, exports, and attachments</li>
					<li>Access for all 12 workspace members</li>
				</ul>
			</Stack>

			<Checkbox
				mode="card"
				bind:value={acknowledged}
				disabled={outcome === 'deleted'}
				label="I understand this action is permanent"
				description="You will still have one final chance to cancel."
			/>

			{#if outcome === 'deleted'}
				<Alert
					color="success"
					variant="soft"
					prefix={checkCircleIcon}
					title="Workspace deleted"
					description="Northstar has been permanently removed."
				/>
			{:else}
				<Stack orientation="horizontal" align="center" justify="between" gap="md" wrap="wrap">
					<p class="text-neutral/70 text-sm" aria-live="polite">
						{outcome === 'cancelled'
							? 'Deletion cancelled. No changes were made.'
							: 'No changes are made until you confirm.'}
					</p>
					<Button
						color="danger"
						variant="solid"
						prefix={trashIcon}
						disabled={!acknowledged}
						onclick={requestDeletion}
					>
						Delete workspace
					</Button>
				</Stack>
			{/if}
		</Stack>
	</Card>
</Stack>
