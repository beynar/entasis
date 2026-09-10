<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { fingerprintIcon } from 'svelai/icons/fingerprint';
	let message = $state('');
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Stack gap="lg" class="mx-auto w-full max-w-xl">
		<div class="flex items-start gap-lg">
			<div class="rounded-lg bg-primary-muted p-md text-3xl">{@render fingerprintIcon()}</div>
			<div>
				<h2 class="text-2xl font-semibold">Skip the password next time.</h2>
				<p class="mt-sm text-sm text-neutral/60">Create a passkey on a device you trust.</p>
			</div>
		</div>
		<Card
			><ol class="grid gap-lg">
				<li class="flex gap-md">
					<Chip>1</Chip>
					<div>
						<strong>Use a personal device</strong>
						<p class="text-sm text-neutral/60">
							Your passkey lives in your device’s secure credential manager.
						</p>
					</div>
				</li>
				<li class="flex gap-md">
					<Chip>2</Chip>
					<div>
						<strong>Confirm it’s you</strong>
						<p class="text-sm text-neutral/60">
							Unlock with your fingerprint, face, or device PIN.
						</p>
					</div>
				</li>
			</ol></Card
		>
		<Stack orientation="horizontal" wrap="wrap" gap="md">
			<Button
				onclick={() =>
					(message = 'Passkey setup is not available in this demo. No passkey was created.')}
				>Set up a passkey</Button
			><Button
				variant="ghost"
				onclick={() => (message = 'You can set up a passkey later from account security.')}
				>Maybe later</Button
			>
		</Stack>
		{#if message}<Alert
				color="info"
				variant="soft"
				title="Demo result"
				description={message}
			/>{/if}
	</Stack>
</Stack>
