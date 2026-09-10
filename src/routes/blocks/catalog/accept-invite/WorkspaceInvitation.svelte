<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';

	let message = $state('');
	let accepted = $state(false);
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Card
		class="mx-auto w-full max-w-md"
		title="Your seat is ready"
		description="Maya invited you to the Northstar design workspace."
		><Stack gap="lg" class="text-center">
			<Avatar user={{ name: 'Maya Chen' }} size="large" class="mx-auto" />
			<div class="rounded-lg bg-surface-recessed p-lg">
				<h3 class="font-semibold">Northstar Studio</h3>
				<p class="mt-xs text-sm text-neutral/60">Product design · 12 members</p>
				<Chip color="primary" class="mt-md">Editor access</Chip>
			</div>
			{#if accepted}<Alert
					color="success"
					title="Invitation accepted in this preview"
					description="Your demo seat is ready. No workspace account was created."
				/>{:else}<Button onclick={() => (accepted = true)}>Accept invitation</Button><Button
					variant="ghost"
					color="neutral"
					onclick={() => (message = 'Invitation declined in this preview.')}
					>Decline invitation</Button
				>{/if}{#if message}<Alert
					color="info"
					variant="soft"
					title="Demo result"
					description={message}
				/>{/if}
		</Stack></Card
	>
</Stack>
