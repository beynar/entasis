<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Alert } from 'entasis/alert';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { fingerprintIcon } from 'entasis/icons/fingerprint';
	let message = $state('');
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Stack gap="lg" class="mx-auto w-full max-w-xl">
		<div class="gap-lg flex items-start">
			<div class="bg-primary-muted p-md rounded-lg text-3xl">{@render fingerprintIcon()}</div>
			<div>
				<h2 class="text-2xl font-semibold">Skip the password next time.</h2>
				<p class="mt-sm text-neutral/70 text-sm">Create a passkey on a device you trust.</p>
			</div>
		</div>
		<Card
			><ol class="gap-lg grid">
				<li class="gap-md flex">
					<Chip>1</Chip>
					<div>
						<strong>Use a personal device</strong>
						<p class="text-neutral/70 text-sm">
							Your passkey lives in your device’s secure credential manager.
						</p>
					</div>
				</li>
				<li class="gap-md flex">
					<Chip>2</Chip>
					<div>
						<strong>Confirm it’s you</strong>
						<p class="text-neutral/70 text-sm">
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
